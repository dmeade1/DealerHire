/**
 * intake-api — durable application receipt Worker.
 * No dependency on Next.js, AI, Meta/Google, ATS, or control-plane request path.
 */

export interface Env {
  PRIVATE_ARTIFACTS?: R2Bucket;
  APPLICANT_INGEST?: Queue;
  TURNSTILE_MODE?: string;
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, service: "intake-api" });
    }

    if (request.method === "POST" && url.pathname === "/v1/applications") {
      try {
        const body = (await request.json()) as IntakeBody;
        if (!body.idempotencyKey || !body.noticeHashes || !body.structuredPayload) {
          return Response.json({ error: "invalid_application" }, { status: 400 });
        }

        // In production: call acceptApplication inside tenant DB transaction via Hyperdrive.
        // Skeleton returns the acceptance contract shape for contract tests.
        const publicApplicationId = `app_pending_${body.idempotencyKey.slice(0, 12)}`;
        const resumeState = body.resumePresent ? "pending_upload" : "none";

        const receipt = {
          accepted: true,
          publicApplicationId,
          resumeState,
          message:
            resumeState === "pending_upload"
              ? "Application accepted. Resume upload is pending or quarantined for scanning."
              : "Application accepted.",
        };

        // Queue is non-gating
        if (env.APPLICANT_INGEST) {
          try {
            await env.APPLICANT_INGEST.send({
              type: "application.accepted",
              publicApplicationId,
              idempotencyKey: body.idempotencyKey,
            });
          } catch {
            // non-gating
          }
        }

        return Response.json(receipt, { status: 201 });
      } catch {
        return Response.json({ error: "intake_failed" }, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
