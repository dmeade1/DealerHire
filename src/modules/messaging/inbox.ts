/**
 * Inbox message schema N/N−1 compatibility (INV-39 / G1-09).
 * Current schema version is N; consumers MUST accept N and N−1.
 * Unknown types / unsupported versions → poison (DLQ), never silent ack.
 */

export const INBOX_SCHEMA_VERSION = 1;
/** Inclusive: current N and prior N−1. */
export const SUPPORTED_INBOX_SCHEMA_VERSIONS = [0, 1] as const;

export const KNOWN_INBOX_MESSAGE_TYPES = [
  "application.accepted",
  "command.queued",
  "command.needs_reconciliation",
  "candidate_ai.shadow",
  "ad.actuate",
  "ops.outbox_replay",
] as const;

export type KnownInboxMessageType = (typeof KNOWN_INBOX_MESSAGE_TYPES)[number];

export type InboxEnvelopeV1 = {
  schemaVersion: 1;
  type: KnownInboxMessageType;
  tenantId?: string;
  rooftopId?: string;
  payload: Record<string, unknown>;
};

/** N−1: bare queue body with `type` and optional fields (pre-envelope). */
export type InboxEnvelopeV0 = {
  schemaVersion: 0;
  type: KnownInboxMessageType;
  tenantId?: string;
  rooftopId?: string;
  payload: Record<string, unknown>;
};

export type ParsedInboxMessage = InboxEnvelopeV0 | InboxEnvelopeV1;

export type InboxParseResult =
  | { ok: true; message: ParsedInboxMessage }
  | { ok: false; poison: true; reason: string; rawType?: string; schemaVersion?: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isKnownType(type: string): type is KnownInboxMessageType {
  return (KNOWN_INBOX_MESSAGE_TYPES as readonly string[]).includes(type);
}

/**
 * Parse a queue/outbox body. Accepts:
 * - v1: `{ schemaVersion: 1, type, payload, … }`
 * - v0 (N−1): `{ type, … }` with remaining fields as payload
 */
export function parseInboxMessage(raw: unknown): InboxParseResult {
  if (!isRecord(raw)) {
    return { ok: false, poison: true, reason: "inbox_body_not_object" };
  }

  const typeVal = raw.type;
  if (typeof typeVal !== "string" || !typeVal.trim()) {
    return { ok: false, poison: true, reason: "inbox_missing_type" };
  }
  if (!isKnownType(typeVal)) {
    return {
      ok: false,
      poison: true,
      reason: "inbox_unknown_type",
      rawType: typeVal,
    };
  }

  const versionRaw = raw.schemaVersion ?? raw.schema_version;
  let schemaVersion: number;
  if (versionRaw === undefined) {
    schemaVersion = 0;
  } else if (typeof versionRaw === "number" && Number.isInteger(versionRaw)) {
    schemaVersion = versionRaw;
  } else {
    return {
      ok: false,
      poison: true,
      reason: "inbox_invalid_schema_version",
      rawType: typeVal,
    };
  }

  if (
    !(SUPPORTED_INBOX_SCHEMA_VERSIONS as readonly number[]).includes(schemaVersion)
  ) {
    return {
      ok: false,
      poison: true,
      reason: "inbox_unsupported_schema_version",
      rawType: typeVal,
      schemaVersion,
    };
  }

  const tenantId = typeof raw.tenantId === "string" ? raw.tenantId : undefined;
  const rooftopId = typeof raw.rooftopId === "string" ? raw.rooftopId : undefined;

  if (schemaVersion === 1) {
    if (!isRecord(raw.payload)) {
      return {
        ok: false,
        poison: true,
        reason: "inbox_v1_missing_payload",
        rawType: typeVal,
        schemaVersion: 1,
      };
    }
    return {
      ok: true,
      message: {
        schemaVersion: 1,
        type: typeVal,
        tenantId,
        rooftopId,
        payload: raw.payload,
      },
    };
  }

  // v0: everything except type / schemaVersion is payload
  const payload: Record<string, unknown> = { ...raw };
  delete payload.type;
  delete payload.schemaVersion;
  delete payload.schema_version;
  return {
    ok: true,
    message: {
      schemaVersion: 0,
      type: typeVal,
      tenantId,
      rooftopId,
      payload,
    },
  };
}

/** Build a v1 body for producers (N). */
export function encodeInboxMessageV1(input: {
  type: KnownInboxMessageType;
  payload: Record<string, unknown>;
  tenantId?: string;
  rooftopId?: string;
}): InboxEnvelopeV1 {
  return {
    schemaVersion: INBOX_SCHEMA_VERSION,
    type: input.type,
    tenantId: input.tenantId,
    rooftopId: input.rooftopId,
    payload: input.payload,
  };
}

export function messageCompatMatrix(): {
  current: number;
  supported: readonly number[];
  types: readonly string[];
} {
  return {
    current: INBOX_SCHEMA_VERSION,
    supported: SUPPORTED_INBOX_SCHEMA_VERSIONS,
    types: KNOWN_INBOX_MESSAGE_TYPES,
  };
}
