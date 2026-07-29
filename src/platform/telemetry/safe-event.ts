/**
 * INV-37: immutable telemetry may carry IDs, hashes, status, timing, cost —
 * never raw applicant PII or free-text contact fields.
 */

const FORBIDDEN_KEYS = new Set([
  "fullName",
  "firstName",
  "lastName",
  "email",
  "phone",
  "mobile",
  "cell",
  "ssn",
  "socialSecurityNumber",
  "dateOfBirth",
  "dob",
  "address",
  "street",
  "city",
  "postalCode",
  "zip",
  "workHistory",
  "resumeText",
  "contact",
  "resume",
  "rawPayload",
  "structuredPayload",
]);

const EMAIL_LIKE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_LIKE = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;

export type SafeTelemetryEvent = {
  name: string;
  tenantId?: string;
  rooftopId?: string;
  publicApplicationId?: string;
  commandId?: string;
  envelopeId?: string;
  status?: string;
  errorCode?: string;
  durationMs?: number;
  /** Content hashes / fingerprints only — never raw contact. */
  hashes?: Record<string, string>;
  meta?: Record<string, string | number | boolean | null>;
};

function walkForbidden(value: unknown, path: string): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    if (EMAIL_LIKE.test(value)) return `${path}: email-like string`;
    if (PHONE_LIKE.test(value) && value.replace(/\D/g, "").length >= 10) {
      return `${path}: phone-like string`;
    }
    return null;
  }
  if (typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = walkForbidden(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(k)) return `${path}.${k}: forbidden PII key`;
    const hit = walkForbidden(v, `${path}.${k}`);
    if (hit) return hit;
  }
  return null;
}

/** Throws if event would violate zero-PII telemetry (INV-37). */
export function assertSafeTelemetryEvent(event: SafeTelemetryEvent): void {
  if (!event.name || !/^[a-z][a-z0-9_.]*$/.test(event.name)) {
    throw new Error("telemetry_invalid_name");
  }
  const hit = walkForbidden(event, "event");
  if (hit) throw new Error(`telemetry_pii_rejected: ${hit}`);
}

/**
 * Emit a structured telemetry line. Fail closed on PII — never best-effort log raw fields.
 * Sink is stdout JSON for G1; replace with platform sink later without widening payload.
 */
export function emitSafeEvent(event: SafeTelemetryEvent): void {
  assertSafeTelemetryEvent(event);
  // Single JSON object — scanners treat this as the allowlisted telemetry shape.
  process.stdout.write(`${JSON.stringify({ telemetry: true, ...event })}\n`);
}
