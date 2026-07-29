import { describe, expect, it } from "vitest";
import {
  buildG1StructuredPayloadFromContact,
  normalizeG1StructuredPayload,
} from "./g1-payload";

describe("normalizeG1StructuredPayload", () => {
  it("accepts already-safe synthetic fingerprint payloads", () => {
    const result = normalizeG1StructuredPayload({
      synthetic: true,
      label: "SYNTHETIC",
      contactFingerprint: "abc",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.label).toBe("SYNTHETIC");
      expect(result.payload.contactFingerprint).toBe("abc");
    }
  });

  it("fingerprints nested contact and strips raw fields", () => {
    const result = normalizeG1StructuredPayload({
      synthetic: true,
      label: "SYNTHETIC",
      contact: { fullName: "Ada", email: "ada@example.com", phone: "555" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.contactFingerprint).toMatch(/^[a-f0-9]{64}$/);
      expect("contact" in result.payload).toBe(false);
    }
  });

  it("rejects unlabeled / non-synthetic payloads", () => {
    const result = normalizeG1StructuredPayload({ email: "x@y.com" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("synthetic_label_required");
  });

  it("rejects remaining raw PII keys that cannot be fingerprinted", () => {
    const result = normalizeG1StructuredPayload({
      synthetic: true,
      label: "SYNTHETIC",
      ssn: "123-45-6789",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("raw_pii_rejected");
  });

  it("rejects unknown keys outside the G1 allowlist", () => {
    const result = normalizeG1StructuredPayload({
      synthetic: true,
      label: "SYNTHETIC",
      freeTextEssay: "hello",
    });
    expect(result.ok).toBe(false);
  });
});

describe("buildG1StructuredPayloadFromContact", () => {
  it("never embeds raw contact fields", () => {
    const payload = buildG1StructuredPayloadFromContact({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555",
      workHistory: "Built engines",
    });
    expect(payload).toEqual(
      expect.objectContaining({
        synthetic: true,
        label: "SYNTHETIC",
        workHistoryChars: "Built engines".length,
      }),
    );
    expect(JSON.stringify(payload)).not.toMatch(/Ada|ada@example/);
  });
});
