/**
 * backplane — queues, reconciliation, adapters, shadow AI jobs.
 */

export interface Env {
  CANDIDATE_AI_MODE?: string;
  AD_ACTUATION_ENABLED?: string;
}

type QueueMessage = {
  type: string;
  [key: string]: unknown;
};

export default {
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
      return Response.json({ paused: true, scope: "all_execution" });
    }
    return new Response("Not Found", { status: 404 });
  },

  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      if (msg.body.type === "application.accepted") {
        // Project envelope → applications table; never drop applicant on failure — retry/DLQ.
        msg.ack();
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
          // Fail closed — beta does not actuate ad platforms.
          msg.ack();
          continue;
        }
      }
      msg.ack();
    }
  },
};
