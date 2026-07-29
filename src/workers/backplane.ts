/**
 * backplane — queues, reconciliation, adapters, shadow AI jobs.
 */

import {
  applyKillSwitch,
  assertOpsControlSecret,
  opsControlSecretFromRequest,
} from "@/modules/ops/kill-switch";

export interface Env {
  CANDIDATE_AI_MODE?: string;
  AD_ACTUATION_ENABLED?: string;
  HYPERDRIVE?: Hyperdrive;
  DATABASE_URL?: string;
}

type QueueMessage = {
  type: string;
  [key: string]: unknown;
};

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
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const presented =
          typeof body.opsControlSecret === "string" ? body.opsControlSecret : null;
        try {
          assertOpsControlSecret(opsControlSecretFromRequest(request, presented));
        } catch (authErr) {
          const detail = authErr instanceof Error ? authErr.message : "ops_control_unauthorized";
          return Response.json(
            {
              paused: false,
              error: detail,
              message:
                detail === "ops_control_secret_unconfigured"
                  ? "No durable pause applied. OPS_CONTROL_SECRET must be configured."
                  : "No durable pause applied. Valid OPS_CONTROL_SECRET required.",
            },
            { status: detail === "ops_control_secret_unconfigured" ? 503 : 401 },
          );
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
            actorSubjectRef: String(body.actorSubjectRef ?? "ops:backplane"),
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

  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      if (msg.body.type === "application.accepted") {
        // Projection not implemented — retry/DLQ rather than ack-without-processing (INV-12).
        msg.retry();
        continue;
      }
      if (msg.body.type === "candidate_ai.shadow") {
        if (env.CANDIDATE_AI_MODE === "live") {
          msg.retry();
          continue;
        }
        msg.ack();
        continue;
      }
      if (msg.body.type === "ad.actuate") {
        if (env.AD_ACTUATION_ENABLED !== "true") {
          // Fail closed — do not silent-ack as success; retry until drained or flag enabled.
          msg.retry();
          continue;
        }
        // Actuation path not implemented — retry rather than fake success.
        msg.retry();
        continue;
      }
      msg.retry();
    }
  },
};

export default backplane;
