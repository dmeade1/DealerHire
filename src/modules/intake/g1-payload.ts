import { fingerprintG1, isG1Fingerprint } from "@/platform/crypto/hash";

/** Top-level keys that must never land in a G1 envelope body as raw values. */
const RAW_PII_KEYS = new Set([
  "fullName",
  "firstName",
  "lastName",
  "name",
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
]);

const FINGERPRINT_KEYS = new Set([
  "contactFingerprint",
  "workHistoryFingerprint",
  "resumeFingerprint",
]);

const ALLOWED_KEYS = new Set([
  "synthetic",
  "label",
  "contactFingerprint",
  "workHistoryChars",
  "workHistoryFingerprint",
  "resumeFingerprint",
]);

export type G1StructuredPayload = {
  synthetic: true;
  label: "SYNTHETIC";
  contactFingerprint?: string;
  workHistoryChars?: number;
  workHistoryFingerprint?: string | null;
  resumeFingerprint?: string | null;
};

export type G1PayloadResult =
  | { ok: true; payload: G1StructuredPayload }
  | { ok: false; error: string; message: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function rejectClientFingerprint(field: string): G1PayloadResult {
  return {
    ok: false,
    error: "client_fingerprint_rejected",
    message: `No receipt was issued. Client-supplied ${field} is not accepted; fingerprints are generated server-side only (G1).`,
  };
}

/**
 * Build the G1-safe structured payload from contact form fields (Next demo apply).
 * Fingerprints are keyed HMACs — raw PII never enters the returned object.
 * Prefer passing raw contact through normalizeG1StructuredPayload on intake paths.
 */
export function buildG1StructuredPayloadFromContact(input: {
  fullName: string;
  email: string;
  phone?: string;
  workHistory?: string;
}): G1StructuredPayload {
  const workHistory = input.workHistory ?? "";
  return {
    synthetic: true,
    label: "SYNTHETIC",
    contactFingerprint: fingerprintG1({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? "",
    }),
    workHistoryChars: workHistory.length,
    workHistoryFingerprint: workHistory ? fingerprintG1(workHistory) : null,
  };
}

/**
 * Normalize/reject intake structuredPayload for G1 (no live PII in envelope body).
 *
 * Rules:
 * - Raw contact / workHistory / resumeText may be present once; they are fingerprinted
 *   server-side with a keyed HMAC and then stripped.
 * - Any client-supplied fingerprint field is rejected (including format-valid fp_* tokens).
 * - Synthetic-only payloads without contact are allowed for fixture drills.
 */
export function normalizeG1StructuredPayload(raw: unknown): G1PayloadResult {
  if (!isPlainObject(raw)) {
    return {
      ok: false,
      error: "invalid_structured_payload",
      message: "No receipt was issued. structuredPayload must be an object.",
    };
  }

  const working: Record<string, unknown> = { ...raw };

  // Fail closed: never accept client-supplied fingerprint tokens.
  for (const key of FINGERPRINT_KEYS) {
    if (key in working) {
      return rejectClientFingerprint(key);
    }
  }

  if (isPlainObject(working.contact)) {
    const contact = working.contact;
    working.contactFingerprint = fingerprintG1({
      fullName: String(contact.fullName ?? contact.name ?? ""),
      email: String(contact.email ?? ""),
      phone: String(contact.phone ?? contact.mobile ?? ""),
    });
    delete working.contact;
  }

  const hasTopLevelContact = [
    "fullName",
    "email",
    "phone",
    "firstName",
    "lastName",
    "name",
    "mobile",
    "cell",
  ].some((k) => k in working);
  if (hasTopLevelContact) {
    working.contactFingerprint = fingerprintG1({
      fullName: String(working.fullName ?? working.name ?? ""),
      email: String(working.email ?? ""),
      phone: String(working.phone ?? working.mobile ?? working.cell ?? ""),
    });
    for (const key of [
      "fullName",
      "firstName",
      "lastName",
      "name",
      "email",
      "phone",
      "mobile",
      "cell",
    ]) {
      delete working[key];
    }
  }

  if (typeof working.workHistory === "string") {
    const text = working.workHistory;
    working.workHistoryChars =
      typeof working.workHistoryChars === "number" ? working.workHistoryChars : text.length;
    working.workHistoryFingerprint = text ? fingerprintG1(text) : null;
    delete working.workHistory;
  }

  if (typeof working.resumeText === "string") {
    working.resumeFingerprint = fingerprintG1(working.resumeText);
    delete working.resumeText;
  }

  for (const key of Object.keys(working)) {
    if (RAW_PII_KEYS.has(key)) {
      return {
        ok: false,
        error: "raw_pii_rejected",
        message: `No receipt was issued. Raw field "${key}" is not allowed in G1 structuredPayload (fingerprint only).`,
      };
    }
    if (!ALLOWED_KEYS.has(key)) {
      return {
        ok: false,
        error: "raw_pii_rejected",
        message: `No receipt was issued. Field "${key}" is not allowlisted for G1 structuredPayload.`,
      };
    }
  }

  if (working.synthetic !== true || working.label !== "SYNTHETIC") {
    return {
      ok: false,
      error: "synthetic_label_required",
      message:
        "No receipt was issued. G1 intake requires structuredPayload.synthetic=true and label=\"SYNTHETIC\".",
    };
  }

  return {
    ok: true,
    payload: {
      synthetic: true,
      label: "SYNTHETIC",
      contactFingerprint: isG1Fingerprint(working.contactFingerprint)
        ? working.contactFingerprint
        : undefined,
      workHistoryChars:
        typeof working.workHistoryChars === "number" ? working.workHistoryChars : undefined,
      workHistoryFingerprint:
        working.workHistoryFingerprint === null || isG1Fingerprint(working.workHistoryFingerprint)
          ? (working.workHistoryFingerprint as string | null)
          : undefined,
      resumeFingerprint:
        working.resumeFingerprint === null || isG1Fingerprint(working.resumeFingerprint)
          ? (working.resumeFingerprint as string | null)
          : undefined,
    },
  };
}
