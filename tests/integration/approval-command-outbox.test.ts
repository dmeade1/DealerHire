import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  createApprovalCase,
  redeemApprovalAndEnqueueCommand,
  type EffectManifest,
} from "@/modules/commands/ledger";
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

describe("G1-06 approval + command + outbox atomicity", () => {
  beforeAll(async () => {
    requireIntegrationDb();
    await setupIntegrationDb();
    await supersedeActiveCommands({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      levers: ["publish"],
    });
  }, 60_000);

  afterAll(async () => {
    await teardownIntegrationDb();
  });

  it("redeems approval and writes command + outbox in one tenant transaction", async () => {
    const drillId = randomUUID();
    const effectManifest: EffectManifest = {
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      lever: "publish",
      landingUrl: `https://jobs.dealerhire.example/demo/${drillId}`,
      budget: { dailyCents: 2500 },
      policyVersions: { pack: "us-ny-state" },
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
          reason: "SYNTHETIC G1-06 drill",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        }),
    );

    expect(approval.one_time_token).toBeTruthy();

    await supersedeActiveCommands({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      levers: ["publish"],
    });

    // Provider calls stay outside the redeem transaction (INV-20) — nothing invoked here.
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

    expect(redeemed.command.status).toBe("queued");
    expect(redeemed.approvalId).toBe(approval.id);

    const rows = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"),
      async (sql) => {
        const commands = await sql<{ id: string; status: string }[]>`
          select id, status from hiring.commands where id = ${redeemed.command.id}::uuid
        `;
        const outbox = await sql<{ event_type: string }[]>`
          select event_type from hiring.outbox
          where aggregate_id = ${redeemed.command.id}::uuid
            and event_type = 'command.queued'
        `;
        const approvalRow = await sql<{ redeemed_at: Date | null }[]>`
          select redeemed_at from hiring.approval_cases where id = ${approval.id}::uuid
        `;
        return { commands, outbox, approvalRow };
      },
    );

    expect(rows.commands).toHaveLength(1);
    expect(rows.outbox).toHaveLength(1);
    expect(rows.approvalRow[0]?.redeemed_at).toBeTruthy();
  });

  it("rejects redemption when effect fields diverge from the approval manifest", async () => {
    const effectManifest: EffectManifest = {
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      lever: "publish",
      landingUrl: "https://jobs.dealerhire.example/a",
      policyVersions: { pack: "us-ny-state" },
      adapterNormalizedEffect: { action: "publish_page" },
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
          reason: "SYNTHETIC binding drill",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        }),
    );

    await expect(
      withTenantContext(actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"), (sql) =>
        redeemApprovalAndEnqueueCommand(sql, {
          oneTimeToken: approval.one_time_token as string,
          tenantId: TENANT_A,
          rooftopId: ROOFTOP_A,
          jobControlVersionId: JCV,
          lever: "publish",
          payload: effectManifest.adapterNormalizedEffect,
          effectManifest: {
            ...effectManifest,
            landingUrl: "https://evil.example",
          },
        }),
      ),
    ).rejects.toThrow(/effect hash mismatch|reapproval required/);
  });
});
