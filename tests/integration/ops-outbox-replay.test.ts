import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createApprovalCase,
  markNeedsReconciliation,
  redeemApprovalAndEnqueueCommand,
  type EffectManifest,
} from "@/modules/commands/ledger";
import { listOutbox, safeReplayOutbox } from "@/modules/ops/outbox";
import { randomUUID } from "node:crypto";
import {
  ROOFTOP_A,
  TENANT_A,
  actorFor,
  requireIntegrationDb,
  setupIntegrationDb,
  supersedeActiveCommands,
  teardownIntegrationDb,
  withTenantContext,
} from "./helpers/db";

const JCV = "00000000-0000-4000-8000-00000000000a";

describe("G1-12 audited outbox inspect + safe replay", () => {
  beforeAll(async () => {
    requireIntegrationDb();
    await setupIntegrationDb();
    await supersedeActiveCommands({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      levers: ["publish", "ops_replay_probe"],
    });
  }, 60_000);

  afterAll(async () => {
    await teardownIntegrationDb();
  });

  it("lists outbox, allows queued replay, refuses create re-dispatch under NeedsReconciliation", async () => {
    const drillId = randomUUID();
    const effectManifest: EffectManifest = {
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      lever: "ops_replay_probe",
      landingUrl: `https://jobs.dealerhire.example/ops-replay/${drillId}`,
      policyVersions: { pack: "us-ny-state", synthetic: true },
      adapterNormalizedEffect: { action: "publish_page", synthetic: true, drillId },
    };

    const approval = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"),
      (sql) =>
        createApprovalCase(sql, {
          tenantId: TENANT_A,
          rooftopId: ROOFTOP_A,
          jobControlVersionId: JCV,
          effectManifest,
          actor: "synthetic:hr-owner",
          authoritySource: "dealer_hr_owner",
          reason: "SYNTHETIC G1-12 outbox replay",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        }),
    );

    const redeemed = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"),
      (sql) =>
        redeemApprovalAndEnqueueCommand(sql, {
          oneTimeToken: approval.one_time_token as string,
          tenantId: TENANT_A,
          rooftopId: ROOFTOP_A,
          jobControlVersionId: JCV,
          lever: "ops_replay_probe",
          payload: effectManifest.adapterNormalizedEffect,
          effectManifest,
        }),
    );

    const queuedEvent = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"),
      async (sql) => {
        const listed = await listOutbox(sql, { limit: 20 });
        expect(listed.some((r) => r.event_type === "command.queued")).toBe(true);
        const event = listed.find(
          (r) => r.aggregate_id === redeemed.command.id && r.event_type === "command.queued",
        );
        expect(event).toBeTruthy();
        // Simulate already-published dispatch.
        await sql`update hiring.outbox set published_at = now() where id = ${event!.id}::uuid`;
        const replay = await safeReplayOutbox(sql, {
          outboxId: event!.id,
          actorSubjectRef: "ops:synthetic-recovery",
        });
        expect(replay.action).toBe("requeued");
        const after = await sql<{ published_at: Date | null }[]>`
          select published_at from hiring.outbox where id = ${event!.id}::uuid
        `;
        expect(after[0]?.published_at).toBeNull();
        return event!;
      },
    );

    await withTenantContext(actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"), (sql) =>
      markNeedsReconciliation(sql, redeemed.command.id as string, {
        reason: "provider_timeout",
        synthetic: true,
      }),
    );

    await withTenantContext(actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"), async (sql) => {
      await expect(
        safeReplayOutbox(sql, {
          outboxId: queuedEvent.id,
          actorSubjectRef: "ops:synthetic-recovery",
        }),
      ).rejects.toThrow(/needs_reconciliation|never re-dispatch create/i);
    });
  });
});
