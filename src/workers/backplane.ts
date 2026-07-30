/**
 * backplane — queues, reconciliation, adapters, shadow AI jobs.
 */

import { parseInboxMessage } from "@/modules/messaging/inbox";
import { applyKillSwitch } from "@/modules/ops/kill-switch";
import {
  assertOpsHttpAuth,
  opsAuthErrorResponse,
  opsAuthFailureDetail,
} from "@/modules/ops/http-auth";

export interface Env {
  CANDIDATE_AI_MODE?: string;
  AD_ACTUATION_ENABLED?: string;
  HYPERDRIVE?: Hyperdrive;
  DATABASE_URL?: string;
  OPS_CONTROL_SECRET?: string;
  CAPABILITY_SECRET?: string;
  ALLOW_UNSIGNED_SYNTHETIC_ACTOR?: string;
  SYNTHETIC_TENANT_ID?: string;
  SYNTHETIC_ROOFTOP_ID?: string;
  /** Selected PageRelease artifact bucket (G1-04) — optional until binding live. */
  PUBLIC_ARTIFACTS?: R2Bucket;
}

const backplane = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "backplane",
        candidateAiMode: env.CANDIDATE_AI_MODE ?? "shadow",
        adActuationEnabled: env.AD_ACTUATION_ENABLED === "true",
      });
    }
    if (url.pathname === "/ops/kill-switch" && request.method === "POST") {
      const connectionString = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;
      if (!connectionString) {
        return Response.json(
          {
            paused: false,
            error: "kill_switch_unavailable",
            message: "No durable pause applied. Hyperdrive/DATABASE_URL required.",
          },
          { status: 503 },
        );
      }
      try {
        if (env.OPS_CONTROL_SECRET) process.env.OPS_CONTROL_SECRET = env.OPS_CONTROL_SECRET;
        if (env.CAPABILITY_SECRET) process.env.CAPABILITY_SECRET = env.CAPABILITY_SECRET;
        if (env.ALLOW_UNSIGNED_SYNTHETIC_ACTOR) {
          process.env.ALLOW_UNSIGNED_SYNTHETIC_ACTOR = env.ALLOW_UNSIGNED_SYNTHETIC_ACTOR;
        }
        if (env.SYNTHETIC_TENANT_ID) process.env.SYNTHETIC_TENANT_ID = env.SYNTHETIC_TENANT_ID;
        if (env.SYNTHETIC_ROOFTOP_ID) process.env.SYNTHETIC_ROOFTOP_ID = env.SYNTHETIC_ROOFTOP_ID;

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const presented =
          typeof body.opsControlSecret === "string" ? body.opsControlSecret : null;
        let actor;
        try {
          actor = assertOpsHttpAuth(request, "ops.pause", {
            presentedSecret: presented,
            actorToken: typeof body.actorToken === "string" ? body.actorToken : null,
            actorSignature: typeof body.actorSignature === "string" ? body.actorSignature : null,
          });
        } catch (authErr) {
          const { body: errBody, status } = opsAuthErrorResponse(
            opsAuthFailureDetail(authErr),
            { paused: false },
          );
          return Response.json(errBody, { status });
        }
        const reason = String(body.reason ?? "");
        if (!reason.trim()) {
          return Response.json(
            { paused: false, error: "reason_required", message: "No durable pause applied." },
            { status: 400 },
          );
        }
        const state = await applyKillSwitch(
          {
            scope: String(body.scope ?? "all_execution"),
            paused: body.paused === undefined ? true : Boolean(body.paused),
            reason,
            actorSubjectRef: actor.actorSubjectRef,
          },
          connectionString,
        );
        return Response.json({ ...state, durable: true });
      } catch (err) {
        const detail = err instanceof Error ? err.message : "unknown";
        return Response.json(
          {
            paused: false,
            error: "kill_switch_persist_failed",
            message: `No durable pause applied (${detail}).`,
          },
          { status: 500 },
        );
      }
    }
    return new Response("Not Found", { status: 404 });
  },

  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      const parsed = parseInboxMessage(msg.body);
      if (!parsed.ok) {
        // Poison: retry until queue max_retries → CF DLQ (INV-39 / RC-09). Never silent-ack.
        msg.retry();
        continue;
      }
      const type = parsed.message.type;
      if (type === "application.accepted") {
        // Projection not implemented — retry/DLQ rather than ack-without-processing (INV-12).
        msg.retry();
        continue;
      }
      if (type === "candidate_ai.shadow") {
        if (env.CANDIDATE_AI_MODE === "live") {
          msg.retry();
          continue;
        }
        msg.ack();
        continue;
      }
      if (type === "ad.actuate") {
        if (env.AD_ACTUATION_ENABLED !== "true") {
          // Fail closed — do not silent-ack as success; retry until drained or flag enabled.
          msg.retry();
          continue;
        }
        // Actuation path not implemented — retry rather than fake success.
        msg.retry();
        continue;
      }
      // Known but not yet handled in this worker — retry (do not drop).
      msg.retry();
    }
  },
};

export default backplane;
