import { describe, expect, it } from "vitest";
import { advisoryDecision, deriveLivenessState, executionDecision } from "./sources";

describe("liveness", () => {
  const now = new Date("2026-07-28T12:00:00Z");

  it("marks missing and stale correctly", () => {
    expect(
      deriveLivenessState({
        lastHeartbeatAt: null,
        expectedCadenceSeconds: 60,
        observedZero: false,
        now,
      }),
    ).toBe("missing");

    expect(
      deriveLivenessState({
        lastHeartbeatAt: new Date("2026-07-28T11:00:00Z"),
        expectedCadenceSeconds: 60,
        observedZero: false,
        now,
      }),
    ).toBe("stale");
  });

  it("abstains on analytical staleness and pauses on safety-critical staleness", () => {
    expect(advisoryDecision("stale")).toBe("abstain");
    expect(advisoryDecision("fresh")).toBe("advise");
    expect(executionDecision("stale")).toBe("pause");
    expect(executionDecision("fresh")).toBe("continue");
  });
});
