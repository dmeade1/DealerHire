import { describe, expect, it } from "vitest";
import { fingerprintG1 } from "@/platform/crypto/hash";
import {
  buildG1StructuredPayloadFromContact,
  normalizeG1StructuredPayload,
} from "./g1-payload";

describe("normalizeG1StructuredPayload", () => {
  it("rejects client-supplied fingerprint tokens even when format-valid", () => {
    const fp = fingerprintG1({ fullName: "Ada", email: "ada@example.com", phone: "" });
    const result = normalizeG1StructuredPayload({
      synthetic: true,
      label: "SYNTHETIC",
      contactFingerprint: fp,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("client_fingerprint_rejected");
  });

  it("rejects arbitrary strings under fingerprint keys", () => {
    const result = normalizeG1StructuredPayload({
      synthetic: true,
      label: "SYNTHETIC",
      contactFingerprint: "attacker@evil.example",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("client_fingerprint_rejected");
  });

  it("rejects client fingerprint when raw contact is also supplied", () => {
    const result = normalizeG1StructuredPayload({
      synthetic: true,
      label: "SYNTHETIC",
      contactFingerprint: fingerprintG1("ignored"),
      contact: { fullName: "Ada", email: "ada@example.com" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("client_fingerprint_rejected");
  });

  it("fingerprints nested contact with keyed HMAC and strips raw fields", () => {
    const result = normalizeG1StructuredPayload({
      synthetic: true,
      label: "SYNTHETIC",
      contact: { fullName: "Ada", email: "ada@example.com", phone: "555" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.contactFingerprint).toMatch(/^fp_[a-f0-9]{64}$/);
      expect(JSON.stringify(result.payload)).not.toMatch(/Ada|ada@example/);
    }
  });

  it("accepts synthetic-only payloads without contact", () => {
    const result = normalizeG1StructuredPayload({
      synthetic: true,
      label: "SYNTHETIC",
    });
    expect(result.ok).toBe(true);
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
    expect(payload.contactFingerprint).toMatch(/^fp_[a-f0-9]{64}$/);
    expect(payload.workHistoryFingerprint).toMatch(/^fp_[a-f0-9]{64}$/);
    expect(JSON.stringify(payload)).not.toMatch(/Ada|ada@example|Built engines/);
  });
});
