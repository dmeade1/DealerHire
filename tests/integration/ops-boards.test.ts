import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  createApprovalCase,
  markNeedsReconciliation,
  redeemApprovalAndEnqueueCommand,
  type EffectManifest,
} from "@/modules/commands/ledger";
import { listSourceLiveness, upsertSourceLiveness } from "@/modules/liveness/sources";
import { listNeedsReconciliationCommands } from "@/modules/ops/reconciliation";
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

describe("G1-07 / G1-10 ops board queries", () => {
  beforeAll(async () => {
    requireIntegrationDb();
    await setupIntegrationDb();
    await supersedeActiveCommands({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      levers: ["ops_board_probe"],
    });
  }, 60_000);

  afterAll(async () => {
    await teardownIntegrationDb();
  });

  it("lists source_liveness with advise/pause semantics available to ops", async () => {
    const actor = actorFor(TENANT_A, ROOFTOP_A, "hiring_operations");
    await withTenantContext(actor, (sql) =>
      upsertSourceLiveness(sql, {
        tenantId: TENANT_A,
        rooftopId: ROOFTOP_A,
        sourceKey: "campaign.csv.meta",
        expectedCadenceSeconds: 60,
        lastHeartbeatAt: null,
        observedZero: false,
      }),
    );
    const rows = await withTenantContext(actor, (sql) => listSourceLiveness(sql));
    expect(rows.some((r) => r.source_key === "campaign.csv.meta" && r.state === "missing")).toBe(
      true,
    );
  });

  it("lists open needs_reconciliation commands for the recon board", async () => {
    const drillId = randomUUID();
    const effectManifest: EffectManifest = {
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      lever: "ops_board_probe",
      landingUrl: `https://jobs.dealerhire.example/board/${drillId}`,
      policyVersions: { pack: "us-ny-state", synthetic: true },
      adapterNormalizedEffect: { action: "publish_page", synthetic: true, drillId },
    };
    const actor = actorFor(TENANT_A, ROOFTOP_A, "hiring_operations");

    const approval = await withTenantContext(actor, (sql) =>
      createApprovalCase(sql, {
        tenantId: TENANT_A,
        rooftopId: ROOFTOP_A,
        jobControlVersionId: JCV,
        effectManifest,
        actor: "synthetic:hr-owner",
        authoritySource: "dealer_hr_owner",
        reason: "SYNTHETIC ops board drill",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      }),
    );

    const redeemed = await withTenantContext(actor, (sql) =>
      redeemApprovalAndEnqueueCommand(sql, {
        oneTimeToken: approval.one_time_token as string,
        tenantId: TENANT_A,
        rooftopId: ROOFTOP_A,
        jobControlVersionId: JCV,
        lever: "ops_board_probe",
        payload: effectManifest.adapterNormalizedEffect,
        effectManifest,
      }),
    );

    await withTenantContext(actor, (sql) =>
      markNeedsReconciliation(sql, redeemed.command.id as string, {
        reason: "provider_timeout",
        synthetic: true,
      }),
    );

    const open = await withTenantContext(actor, (sql) =>
      listNeedsReconciliationCommands(sql, { limit: 50 }),
    );
    expect(open.some((c) => c.id === redeemed.command.id && c.lever === "ops_board_probe")).toBe(
      true,
    );
  });
});
