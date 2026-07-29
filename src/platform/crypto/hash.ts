import { createHash, randomBytes, createHmac } from "node:crypto";

export function sha256(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function contentAddress(payload: unknown): string {
  return sha256(stableStringify(payload));
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function requireCapabilitySecret(secret = process.env.CAPABILITY_SECRET): string {
  if (!secret) {
    throw new Error("CAPABILITY_SECRET is required");
  }
  return secret;
}

export function hashCapability(raw: string, secret = process.env.CAPABILITY_SECRET): string {
  return createHmac("sha256", requireCapabilitySecret(secret)).update(raw).digest("hex");
}

const G1_FINGERPRINT_RE = /^fp_[a-f0-9]{64}$/;

/** Keyed G1 fingerprint — never store unsalted hashes of contact fields. */
export function fingerprintG1(payload: unknown, secret = process.env.CAPABILITY_SECRET): string {
  const digest = createHmac("sha256", requireCapabilitySecret(secret))
    .update(stableStringify(payload))
    .digest("hex");
  return `fp_${digest}`;
}

export function isG1Fingerprint(value: unknown): value is string {
  return typeof value === "string" && G1_FINGERPRINT_RE.test(value);
}

/**
 * Local envelope stand-in — base64 encoding is NOT encryption.
 * Live PII (G2) requires KMS-backed authenticated encryption.
 * Allowed only when ACCEPTANCE_ENVELOPE_BINDING=local.
 */
export function sealEnvelope(payload: unknown): string {
  if (process.env.ACCEPTANCE_ENVELOPE_BINDING !== "local") {
    throw new Error(
      "sealEnvelope blocked: insecure encoding requires ACCEPTANCE_ENVELOPE_BINDING=local; use KMS-backed encryption before live PII",
    );
  }
  const json = stableStringify(payload);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function openEnvelope(ciphertext: string): unknown {
  if (process.env.ACCEPTANCE_ENVELOPE_BINDING !== "local") {
    throw new Error(
      "openEnvelope blocked: insecure decoding requires ACCEPTANCE_ENVELOPE_BINDING=local",
    );
  }
  return JSON.parse(Buffer.from(ciphertext, "base64url").toString("utf8"));
}
