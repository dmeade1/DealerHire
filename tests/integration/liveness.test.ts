import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  advisoryDecision,
  deriveLivenessState,
  executionDecision,
  upsertSourceLiveness,
} from "@/modules/liveness/sources";
import {
  ROOFTOP_A,
  TENANT_A,
  actorFor,
  requireIntegrationDb,
  setupIntegrationDb,
  teardownIntegrationDb,
  withTenantContext,
} from "./helpers/db";

describe("G1-10 liveness Fresh/ObservedZero/Missing/Stale + abstain/halt", () => {
  beforeAll(async () => {
    requireIntegrationDb();
    await setupIntegrationDb();
  }, 60_000);

  afterAll(async () => {
    await teardownIntegrationDb();
  });

  it("derives states and persists source_liveness under hiring_operations", async () => {
    expect(deriveLivenessState({ lastHeartbeatAt: null, expectedCadenceSeconds: 60, observedZero: false })).toBe(
      "missing",
    );
    expect(advisoryDecision("missing")).toBe("abstain");
    expect(executionDecision("missing")).toBe("pause");

    expect(
      deriveLivenessState({
        lastHeartbeatAt: new Date(),
        expectedCadenceSeconds: 60,
        observedZero: true,
      }),
    ).toBe("observed_zero");
    expect(advisoryDecision("observed_zero")).toBe("advise");
    expect(executionDecision("observed_zero")).toBe("continue");

    const stale = deriveLivenessState({
      lastHeartbeatAt: new Date(Date.now() - 10 * 60 * 1000),
      expectedCadenceSeconds: 60,
      observedZero: false,
    });
    expect(stale).toBe("stale");
    expect(advisoryDecision("stale")).toBe("abstain");
    expect(executionDecision("stale")).toBe("pause");

    const row = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"),
      (sql) =>
        upsertSourceLiveness(sql, {
          tenantId: TENANT_A,
          rooftopId: ROOFTOP_A,
          sourceKey: "intake.envelope",
          expectedCadenceSeconds: 300,
          lastHeartbeatAt: new Date(),
          observedZero: false,
        }),
    );
    expect(row.state).toBe("fresh");
    expect(advisoryDecision("fresh")).toBe("advise");
    expect(executionDecision("fresh")).toBe("continue");
  });
});
