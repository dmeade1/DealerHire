import type { ActorContext } from "@/platform/auth/context";
import { withTenantContext } from "@/platform/db/client";
import {
  acceptApplication,
  type AcceptApplicationInput,
  type ResumeState,
} from "@/modules/intake/envelope";
import { normalizeG1StructuredPayload } from "@/modules/intake/g1-payload";
import { assertIntakeNotPaused } from "@/modules/ops/kill-switch";

export type AcceptanceReceipt = {
  accepted: true;
  publicApplicationId: string;
  envelopeId: string;
  resumeState: ResumeState;
  magicCapability: string | null;
  idempotentReplay?: boolean;
};

export type AcceptanceDenial = {
  accepted: false;
  error: string;
  message: string;
  status: number;
};

export type AcceptanceResult = AcceptanceReceipt | AcceptanceDenial;

function denial(status: number, error: string, message: string): AcceptanceDenial {
  return { accepted: false, error, message, status };
}

function intakeActor(input: AcceptApplicationInput): ActorContext {
  return {
    actorSubjectRef: "system:intake",
    tenantId: input.tenantId,
    rooftopId: input.rooftopId,
    purpose: "subject_permission",
    role: "system",
    capabilities: ["*"],
    sessionId: `intake:${input.idempotencyKey}`,
    expiresAt: new Date(Date.now() + 120_000).toISOString(),
  };
}

/**
 * Sole HTTP/application receipt authority.
 * Returns accepted:true only after acceptApplication's conditional envelope insert succeeds.
 */
export async function issueAcceptanceReceipt(
  input: AcceptApplicationInput,
  options?: {
    connectionString?: string;
    envelopeBinding?: string;
    capabilitySecret?: string;
  },
): Promise<AcceptanceResult> {
  const sanitized = normalizeG1StructuredPayload(input.structuredPayload);
  if (!sanitized.ok) {
    return denial(400, sanitized.error, sanitized.message);
  }
  const safeInput: AcceptApplicationInput = {
    ...input,
    structuredPayload: sanitized.payload,
  };

  const envelopeBinding =
    options?.envelopeBinding ?? process.env.ACCEPTANCE_ENVELOPE_BINDING;
  const capabilitySecret = options?.capabilitySecret ?? process.env.CAPABILITY_SECRET;

  if (envelopeBinding !== "local") {
    return denial(
      503,
      "envelope_unavailable",
      "No receipt was issued. Envelope binding is not enabled for durable acceptance (INV-11).",
    );
  }
  if (!capabilitySecret) {
    return denial(
      503,
      "envelope_unavailable",
      "No receipt was issued. CAPABILITY_SECRET is required before acceptance (INV-11).",
    );
  }

  const connectionString = options?.connectionString ?? process.env.DATABASE_URL;
  if (!connectionString) {
    return denial(
      503,
      "envelope_unavailable",
      "No receipt was issued. Durable ApplicationAcceptanceEnvelope store is unavailable (INV-11).",
    );
  }

  const previousSecret = process.env.CAPABILITY_SECRET;
  process.env.CAPABILITY_SECRET = capabilitySecret;
  try {
    try {
      await assertIntakeNotPaused(connectionString);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "unknown";
      if (detail === "intake_paused") {
        return denial(
          503,
          "intake_paused",
          "No receipt was issued. Intake is paused by kill switch (INV-51).",
        );
      }
      // Kill-switch table missing / unreadable → fail closed on intake.
      return denial(
        503,
        "intake_paused",
        "No receipt was issued. Kill switch state could not be read; fail closed (INV-51).",
      );
    }

    const result = await withTenantContext(
      intakeActor(safeInput),
      (sql) => acceptApplication(sql, safeInput),
      connectionString,
    );

    if (!result.accepted || !result.publicApplicationId) {
      return denial(500, "intake_failed", "No receipt was issued. Acceptance did not produce an ID.");
    }

    return {
      accepted: true,
      publicApplicationId: result.publicApplicationId,
      envelopeId: result.envelopeId,
      resumeState: result.resumeState,
      magicCapability: result.magicCapability,
      idempotentReplay: result.idempotentReplay,
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    return denial(
      500,
      "intake_failed",
      `No receipt was issued. Envelope insert failed before acceptance (${detail}).`,
    );
  } finally {
    if (previousSecret === undefined) delete process.env.CAPABILITY_SECRET;
    else process.env.CAPABILITY_SECRET = previousSecret;
  }
}

export function isIntakeConfigured(connectionString?: string): boolean {
  return (
    process.env.ACCEPTANCE_ENVELOPE_BINDING === "local" &&
    Boolean(process.env.CAPABILITY_SECRET) &&
    Boolean(connectionString ?? process.env.DATABASE_URL)
  );
}
