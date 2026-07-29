import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  createApprovalCase,
  markNeedsReconciliation,
  redeemApprovalAndEnqueueCommand,
  type EffectManifest,
} from "@/modules/commands/ledger";
import { resolveNeedsReconciliation } from "@/modules/commands/resolve";
import {
  ROOFTOP_A,
  TENANT_A,
  actorFor,
  requireIntegrationDb,
  setupIntegrationDb,
  teardownIntegrationDb,
  withTenantContext,
} from "./helpers/db";

const JCV = "00000000-0000-4000-8000-00000000000a";

describe("G1-07 resolve NeedsReconciliation via read-back (no recreate)", () => {
  beforeAll(async () => {
    requireIntegrationDb();
    await setupIntegrationDb();
    await withTenantContext(actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"), async (sql) => {
      await sql`
        update hiring.commands
        set status = 'superseded'
        where tenant_id = ${TENANT_A}::uuid
          and job_control_version_id = ${JCV}::uuid
          and lever = 'publish'
          and status in ('queued', 'executing', 'needs_reconciliation')
      `;
    });
  }, 60_000);

  afterAll(async () => {
    await teardownIntegrationDb();
  });

  it("receipts an ambiguous command after provider read-back", async () => {
    const drillId = randomUUID();
    const effectManifest: EffectManifest = {
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      lever: "publish",
      landingUrl: `https://jobs.dealerhire.example/resolve/${drillId}`,
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
          reason: "SYNTHETIC resolve drill",
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
          lever: "publish",
          payload: effectManifest.adapterNormalizedEffect,
          effectManifest,
        }),
    );

    await withTenantContext(actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"), (sql) =>
      markNeedsReconciliation(sql, redeemed.command.id as string, {
        reason: "provider_timeout",
        synthetic: true,
      }),
    );

    const resolved = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"),
      (sql) =>
        resolveNeedsReconciliation(sql, {
          tenantId: TENANT_A,
          rooftopId: ROOFTOP_A,
          commandId: redeemed.command.id as string,
          actorSubjectRef: "ops:synthetic-recovery",
          resolution: "receipted",
          provider: "synthetic_publish",
          providerRef: "readback-1",
          observedState: { exists: true, synthetic: true },
        }),
    );
    expect(resolved.status).toBe("succeeded");

    const row = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"),
      async (sql) => {
        const cmd = await sql<{ status: string }[]>`
          select status from hiring.commands where id = ${redeemed.command.id}::uuid
        `;
        const receipts = await sql<{ n: number }[]>`
          select count(*)::int as n from hiring.actuation_receipts
          where command_id = ${redeemed.command.id}::uuid
        `;
        return { status: cmd[0]?.status, receipts: receipts[0]?.n };
      },
    );
    expect(row.status).toBe("succeeded");
    expect(row.receipts).toBe(1);
  });
});
