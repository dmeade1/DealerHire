import { describe, expect, it } from "vitest";
import { contentAddress } from "@/platform/crypto/hash";

describe("command effect binding", () => {
  it("changes hash when landing URL changes", () => {
    const base = {
      tenantId: "t",
      jobControlVersionId: "j",
      lever: "publish",
      landingUrl: "https://jobs.example/a",
      policyVersions: { pack: "us-ny-state" },
      adapterNormalizedEffect: { action: "publish" },
    };
    const changed = { ...base, landingUrl: "https://evil.example" };
    expect(contentAddress(base)).not.toBe(contentAddress(changed));
  });
});
