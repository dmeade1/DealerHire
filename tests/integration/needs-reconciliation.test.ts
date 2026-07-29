import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  createApprovalCase,
  markNeedsReconciliation,
  redeemApprovalAndEnqueueCommand,
  type EffectManifest,
} from "@/modules/commands/ledger";
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

async function approveAndRedeem(lever: string, drillId: string) {
  const effectManifest: EffectManifest = {
    tenantId: TENANT_A,
    rooftopId: ROOFTOP_A,
    jobControlVersionId: JCV,
    lever,
    landingUrl: `https://jobs.dealerhire.example/recon/${drillId}`,
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
        reason: "SYNTHETIC G1-07 ambiguous-timeout drill",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      }),
  );

  return withTenantContext(actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"), (sql) =>
    redeemApprovalAndEnqueueCommand(sql, {
      oneTimeToken: approval.one_time_token as string,
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      lever,
      payload: effectManifest.adapterNormalizedEffect,
      effectManifest,
    }),
  );
}

describe("G1-07 / INV-21 NeedsReconciliation — no blind recreate", () => {
  beforeAll(async () => {
    requireIntegrationDb();
    await setupIntegrationDb();
    // Clear leftover publish commands from other drills so this lever is free.
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

  it("marks ambiguous timeout as needs_reconciliation and blocks a second create", async () => {
    const drillId = randomUUID();
    const redeemed = await approveAndRedeem("publish", drillId);
    expect(redeemed.command.status).toBe("queued");

    // Simulate provider call outside the redeem txn (INV-20) → ambiguous timeout.
    await withTenantContext(actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"), (sql) =>
      markNeedsReconciliation(sql, redeemed.command.id as string, {
        reason: "provider_timeout",
        synthetic: true,
        drillId,
      }),
    );

    const state = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"),
      async (sql) => {
        const cmd = await sql<{ status: string }[]>`
          select status from hiring.commands where id = ${redeemed.command.id}::uuid
        `;
        const outbox = await sql<{ event_type: string }[]>`
          select event_type from hiring.outbox
          where aggregate_id = ${redeemed.command.id}::uuid
            and event_type = 'command.needs_reconciliation'
        `;
        return { status: cmd[0]?.status, outbox };
      },
    );
    expect(state.status).toBe("needs_reconciliation");
    expect(state.outbox).toHaveLength(1);

    // Blind recreate via a fresh approval must fail (INV-21).
    await expect(approveAndRedeem("publish", randomUUID())).rejects.toThrow(
      /no blind recreate|needs_reconciliation|unique|duplicate/i,
    );
  });
});
