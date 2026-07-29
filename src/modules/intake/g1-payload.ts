import { contentAddress } from "@/platform/crypto/hash";

/** Top-level keys that must never land in a G1 envelope body as raw values. */
const RAW_PII_KEYS = new Set([
  "fullnameName",
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

/**
 * Build the G1-safe structured payload from contact form fields (Next demo apply).
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
    contactFingerprint: contentAddress({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? "",
    }),
    workHistoryChars: workHistory.length,
    workHistoryFingerprint: workHistory ? contentAddress(workHistory) : null,
  };
}

/**
 * Normalize/reject intake structuredPayload for G1 (no live PII in envelope body).
 * Fingerprints known contact bags; rejects leftover raw PII keys.
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

  // Optional nested contact bag → fingerprint then strip.
  if (isPlainObject(working.contact)) {
    const contact = working.contact;
    working.contactFingerprint =
      typeof working.contactFingerprint === "string"
        ? working.contactFingerprint
        : contentAddress({
            fullName: String(contact.fullName ?? contact.name ?? ""),
            email: String(contact.email ?? ""),
            phone: String(contact.phone ?? contact.mobile ?? ""),
          });
    delete working.contact;
  }

  // Top-level raw contact fields → fingerprint then strip.
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
    working.contactFingerprint =
      typeof working.contactFingerprint === "string"
        ? working.contactFingerprint
        : contentAddress({
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
    working.workHistoryFingerprint =
      typeof working.workHistoryFingerprint === "string"
        ? working.workHistoryFingerprint
        : text
          ? contentAddress(text)
          : null;
    delete working.workHistory;
  }

  if (typeof working.resumeText === "string") {
    working.resumeFingerprint =
      typeof working.resumeFingerprint === "string"
        ? working.resumeFingerprint
        : contentAddress(working.resumeText);
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

  // G1 requires explicit synthetic labeling (live PII is a G2 gate).
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
      contactFingerprint:
        typeof working.contactFingerprint === "string" ? working.contactFingerprint : undefined,
      workHistoryChars:
        typeof working.workHistoryChars === "number" ? working.workHistoryChars : undefined,
      workHistoryFingerprint:
        working.workHistoryFingerprint === null ||
        typeof working.workHistoryFingerprint === "string"
          ? (working.workHistoryFingerprint as string | null)
          : undefined,
      resumeFingerprint:
        working.resumeFingerprint === null || typeof working.resumeFingerprint === "string"
          ? (working.resumeFingerprint as string | null)
          : undefined,
    },
  };
}
