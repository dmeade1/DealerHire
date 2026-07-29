import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { contentAddress } from "@/platform/crypto/hash";
import { issueAcceptanceReceipt } from "@/modules/intake/submit";
import {
  applyKillSwitch,
  readKillSwitches,
} from "@/modules/ops/kill-switch";
import {
  ROOFTOP_A,
  TENANT_A,
  requireIntegrationDb,
  setupIntegrationDb,
  teardownIntegrationDb,
} from "./helpers/db";

const JCV = "00000000-0000-4000-8000-00000000000a";

describe("G1-13 / INV-51 durable kill switches", () => {
  beforeAll(async () => {
    requireIntegrationDb();
    await setupIntegrationDb();
    process.env.ACCEPTANCE_ENVELOPE_BINDING = "local";
    process.env.CAPABILITY_SECRET = "test-only-capability-secret";
  }, 60_000);

  afterAll(async () => {
    await applyKillSwitch({
      scope: "intake",
      paused: false,
      reason: "test cleanup",
      actorSubjectRef: "ops:test-cleanup",
    });
    await applyKillSwitch({
      scope: "all_execution",
      paused: false,
      reason: "test cleanup",
      actorSubjectRef: "ops:test-cleanup",
    });
    await teardownIntegrationDb();
  });

  it("persists pause and returns durable readback", async () => {
    const state = await applyKillSwitch({
      scope: "intake",
      paused: true,
      reason: "SYNTHETIC G1-13 drill",
      actorSubjectRef: "ops:test",
    });
    expect(state.paused).toBe(true);
    expect(state.scope).toBe("intake");
    expect(state.reason).toBe("SYNTHETIC G1-13 drill");

    const switches = await readKillSwitches();
    const intake = switches.find((s) => s.scope === "intake");
    expect(intake?.paused).toBe(true);
    expect(intake?.actorSubjectRef).toBe("ops:test");
  });

  it("blocks acceptance receipts while intake is paused", async () => {
    await applyKillSwitch({
      scope: "intake",
      paused: true,
      reason: "block intake",
      actorSubjectRef: "ops:test",
    });

    const result = await issueAcceptanceReceipt({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      idempotencyKey: `idem-${randomUUID()}`,
      structuredPayload: { synthetic: true, label: "SYNTHETIC" },
      noticeHashes: { "notice.app_terms.en.v1": contentAddress("notice.app_terms.en.v1") },
      choiceHashes: {},
      jurisdictionSnapshot: { pack: "us-ny-state", synthetic: true },
      communicationAuthority: {},
    });

    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.error).toBe("intake_paused");

    await applyKillSwitch({
      scope: "intake",
      paused: false,
      reason: "resume intake",
      actorSubjectRef: "ops:test",
    });
  });
});
