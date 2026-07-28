import { describe, expect, it } from "vitest";
import { runSyntheticVerticalSlice } from "./vertical-slice";

describe("synthetic vertical slice", () => {
  it("runs listing audit → publish manifest → liveness → email auth", () => {
    const result = runSyntheticVerticalSlice();
    expect(result.auditReviewReady).toBe(true);
    expect(result.pageContentAddress.length).toBe(64);
    expect(result.advisory).toBe("advise");
    expect(result.execution).toBe("continue");
    expect(result.emailAllowed).toBe(true);
    expect(result.smsBlocked).toBe(true);
    expect(result.qualifiedHireExample).toBe(true);
    expect(result.betaBlockedByRoles).toMatch(/Beta blocked/);
    expect(result.candidateAiMode).toBe("shadow");
    expect(result.adActuationEnabled).toBe(false);
  });
});
