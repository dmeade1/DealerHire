import { describe, expect, it } from "vitest";
import { computeTimeToFillHours, isQualifiedHire } from "./decisions";

describe("qualified hire metrics", () => {
  it("requires rubric confirmation and start", () => {
    expect(
      isQualifiedHire({
        qualifiedConfirmedAt: new Date(),
        startConfirmedAt: null,
      }),
    ).toBe(false);
    expect(
      isQualifiedHire({
        qualifiedConfirmedAt: new Date(),
        startConfirmedAt: new Date(),
      }),
    ).toBe(true);
  });

  it("computes approval-to-start clock", () => {
    const hours = computeTimeToFillHours({
      jobControlApprovedAt: new Date("2026-07-01T00:00:00Z"),
      startConfirmedAt: new Date("2026-07-02T12:00:00Z"),
    });
    expect(hours).toBe(36);
  });
});
