import { describe, expect, it } from "vitest";
import { auditListing } from "./audit";

const basePayload = {
  title: "ASE Technician",
  department: "fixed_operations" as const,
  jobFamily: "technician" as const,
  description: "Perform diagnostics and repair on vehicles in a dealership fixed ops environment with safety and OEM procedures.",
  schedule: "Tue-Sat",
  locationType: "onsite" as const,
  mustHaveSkills: ["diagnostics"],
  trainableSkills: ["EV"],
  credentials: ["ASE"],
  locale: "en" as const,
};

describe("auditListing", () => {
  it("passes a complete English NY onsite listing", () => {
    const result = auditListing({
      payload: basePayload,
      payMinCents: 2500,
      payMaxCents: 4500,
      requirements: [{ proxyReviewed: true, essentialFunction: "Diagnose vehicle faults" }],
      jurisdictionPack: "us-ny-state",
    });
    expect(result.hardBlockerCount).toBe(0);
    expect(result.reviewReady).toBe(true);
  });

  it("blocks missing pay range and unreviewed proxies", () => {
    const result = auditListing({
      payload: basePayload,
      payMinCents: 0,
      payMaxCents: 0,
      requirements: [{ proxyReviewed: false, essentialFunction: "Native English" }],
      jurisdictionPack: "us-ny-state",
    });
    expect(result.findings.some((f) => f.code === "PAY_RANGE_REQUIRED")).toBe(true);
    expect(result.findings.some((f) => f.code === "PROXY_REVIEW_REQUIRED")).toBe(true);
    expect(result.reviewReady).toBe(false);
  });
});
