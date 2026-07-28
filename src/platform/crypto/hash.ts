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

export function hashCapability(raw: string, secret = process.env.CAPABILITY_SECRET ?? "dev-only"): string {
  return createHmac("sha256", secret).update(raw).digest("hex");
}

/** Local envelope ciphertext stand-in — replace with KMS/envelope encryption in production. */
export function sealEnvelope(payload: unknown): string {
  const json = stableStringify(payload);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function openEnvelope(ciphertext: string): unknown {
  return JSON.parse(Buffer.from(ciphertext, "base64url").toString("utf8"));
}
