import { describe, expect, it } from "vitest";
import { contentAddress } from "@/platform/crypto/hash";
import {
  assertApprovalBindsRequestedEffect,
  type EffectManifest,
  type RedeemCommandInput,
} from "./ledger";

function baseManifest(overrides: Partial<EffectManifest> = {}): EffectManifest {
  return {
    tenantId: "00000000-0000-4000-8000-000000000001",
    rooftopId: "00000000-0000-4000-8000-000000000002",
    jobControlVersionId: "00000000-0000-4000-8000-00000000000a",
    lever: "publish",
    landingUrl: "https://jobs.example/a",
    budget: { dailyCents: 5000 },
    policyVersions: { pack: "us-ny-state" },
    adapterNormalizedEffect: { action: "publish_page" },
    ...overrides,
  };
}

function redeemInput(manifest: EffectManifest, overrides: Partial<RedeemCommandInput> = {}): RedeemCommandInput {
  return {
    oneTimeToken: "tok",
    tenantId: manifest.tenantId,
    rooftopId: manifest.rooftopId,
    jobControlVersionId: manifest.jobControlVersionId,
    lever: manifest.lever,
    payload: manifest.adapterNormalizedEffect,
    effectManifest: manifest,
    ...overrides,
  };
}

describe("command effect binding", () => {
  it("changes hash when landing URL changes", () => {
    const base = baseManifest();
    const changed = baseManifest({ landingUrl: "https://evil.example" });
    expect(contentAddress(base)).not.toBe(contentAddress(changed));
  });

  it("accepts a request that matches the stored approval manifest", () => {
    const stored = baseManifest();
    expect(() =>
      assertApprovalBindsRequestedEffect(stored, contentAddress(stored), redeemInput(stored)),
    ).not.toThrow();
  });

  it("rejects a different rooftop with the same token context", () => {
    const stored = baseManifest();
    const requested = baseManifest({
      rooftopId: "00000000-0000-4000-8000-000000000099",
    });
    expect(() =>
      assertApprovalBindsRequestedEffect(stored, contentAddress(stored), redeemInput(requested)),
    ).toThrow(/effect hash mismatch|rooftopId|command identity/);
  });

  it("rejects a different lever or destination payload", () => {
    const stored = baseManifest();
    expect(() =>
      assertApprovalBindsRequestedEffect(
        stored,
        contentAddress(stored),
        redeemInput(stored, {
          lever: "pause",
          effectManifest: baseManifest({ lever: "pause" }),
        }),
      ),
    ).toThrow(/effect hash mismatch|lever|command identity/);

    expect(() =>
      assertApprovalBindsRequestedEffect(
        stored,
        contentAddress(stored),
        redeemInput(stored, { payload: { action: "evil" } }),
      ),
    ).toThrow(/payload/);
  });

  it("rejects caller-only hash agreement without matching stored fields", () => {
    const stored = baseManifest();
    const attacker = baseManifest({
      landingUrl: "https://evil.example",
      budget: { dailyCents: 999999 },
    });
    // Attacker supplies a self-consistent manifest/hash pair that is not the stored approval.
    expect(() =>
      assertApprovalBindsRequestedEffect(stored, contentAddress(stored), redeemInput(attacker)),
    ).toThrow(/effect hash mismatch/);
  });
});
