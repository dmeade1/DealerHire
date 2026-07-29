/**
 * intake-api — durable application receipt Worker.
 * No dependency on Next.js, AI, Meta/Google, ATS, or control-plane request path.
 * INV-11: receipt iff ApplicationAcceptanceEnvelope conditional insert succeeds.
 */

import { normalizeG1StructuredPayload } from "@/modules/intake/g1-payload";
import { isIntakeConfigured, issueAcceptanceReceipt } from "@/modules/intake/submit";

export interface Env {
  PRIVATE_ARTIFACTS?: R2Bucket;
  APPLICANT_INGEST?: Queue;
  HYPERDRIVE?: Hyperdrive;
  TURNSTILE_MODE?: string;
  ACCEPTANCE_ENVELOPE_BINDING?: string;
  CAPABILITY_SECRET?: string;
}

type IntakeBody = {
  tenantId: string;
  rooftopId: string;
  jobControlVersionId: string;
  pageReleaseId?: string;
  idempotencyKey: string;
  structuredPayload: Record<string, unknown>;
  noticeHashes: Record<string, string>;
  choiceHashes: Record<string, string>;
  jurisdictionSnapshot: Record<string, unknown>;
  communicationAuthority: Record<string, unknown>;
  resumePresent?: boolean;
};

function notAccepted(status: number, error: string, message: string): Response {
  return Response.json({ accepted: false, error, message }, { status });
}

const intakeApi = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, service: "intake-api" });
    }

    if (request.method === "POST" && url.pathname === "/v1/applications") {
      try {
        const body = (await request.json()) as IntakeBody;
        if (
          !body.idempotencyKey ||
          !body.noticeHashes ||
          !body.structuredPayload ||
          !body.tenantId ||
          !body.rooftopId ||
          !body.jobControlVersionId ||
          !body.jurisdictionSnapshot
        ) {
          return notAccepted(400, "invalid_application", "Application was not accepted.");
        }

        // G1 privacy gate before durable store / Hyperdrive (INV-37).
        // Validate only — pass raw payload so issueAcceptanceReceipt is the sole fingerprint step.
        const sanitized = normalizeG1StructuredPayload(body.structuredPayload);
        if (!sanitized.ok) {
          return notAccepted(400, sanitized.error, sanitized.message);
        }

        // Worker secrets/vars override process.env for the receipt gate.
        if (env.ACCEPTANCE_ENVELOPE_BINDING) {
          process.env.ACCEPTANCE_ENVELOPE_BINDING = env.ACCEPTANCE_ENVELOPE_BINDING;
        }
        if (env.CAPABILITY_SECRET) {
          process.env.CAPABILITY_SECRET = env.CAPABILITY_SECRET;
        }

        const connectionString = env.HYPERDRIVE?.connectionString;
        if (!connectionString || !isIntakeConfigured(connectionString)) {
          return notAccepted(
            503,
            "envelope_unavailable",
            "No receipt was issued. Durable ApplicationAcceptanceEnvelope insert is unavailable (INV-11).",
          );
        }

        const result = await issueAcceptanceReceipt(
          {
            tenantId: body.tenantId,
            rooftopId: body.rooftopId,
            jobControlVersionId: body.jobControlVersionId,
            pageReleaseId: body.pageReleaseId,
            idempotencyKey: body.idempotencyKey,
            structuredPayload: body.structuredPayload,
            noticeHashes: body.noticeHashes,
            choiceHashes: body.choiceHashes ?? {},
            jurisdictionSnapshot: body.jurisdictionSnapshot,
            communicationAuthority: body.communicationAuthority ?? {},
            resumeState: body.resumePresent ? "pending_upload" : "none",
          },
          { connectionString },
        );

        if (!result.accepted) {
          return notAccepted(result.status, result.error, result.message);
        }

        // Queue is non-gating (INV-12).
        if (env.APPLICANT_INGEST) {
          try {
            await env.APPLICANT_INGEST.send({
              type: "application.accepted",
              publicApplicationId: result.publicApplicationId,
              envelopeId: result.envelopeId,
              idempotencyKey: body.idempotencyKey,
            });
          } catch {
            // non-gating
          }
        }

        return Response.json(
          {
            accepted: true,
            publicApplicationId: result.publicApplicationId,
            resumeState: result.resumeState,
            idempotentReplay: result.idempotentReplay ?? false,
            magicCapability: result.magicCapability,
            message:
              result.resumeState === "pending_upload"
                ? "Application accepted. Resume upload is pending or quarantined for scanning."
                : "Application accepted.",
          },
          { status: result.idempotentReplay ? 200 : 201 },
        );
      } catch {
        return notAccepted(
          500,
          "intake_failed",
          "No receipt was issued. Intake failed before acceptance.",
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};

export default intakeApi;
