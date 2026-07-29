import type { Sql } from "@/platform/db/client";

export type LivenessState = "fresh" | "observed_zero" | "missing" | "stale";

export function deriveLivenessState(input: {
  lastHeartbeatAt: Date | null;
  expectedCadenceSeconds: number;
  observedZero: boolean;
  now?: Date;
}): LivenessState {
  const now = input.now ?? new Date();
  if (!input.lastHeartbeatAt) return "missing";
  const ageSec = (now.getTime() - input.lastHeartbeatAt.getTime()) / 1000;
  if (ageSec > input.expectedCadenceSeconds * 2) return "stale";
  if (input.observedZero) return "observed_zero";
  return "fresh";
}

export function advisoryDecision(state: LivenessState): "advise" | "abstain" {
  return state === "fresh" || state === "observed_zero" ? "advise" : "abstain";
}

export function executionDecision(
  safetyCriticalState: LivenessState,
): "continue" | "pause" {
  return safetyCriticalState === "fresh" || safetyCriticalState === "observed_zero"
    ? "continue"
    : "pause";
}

export async function upsertSourceLiveness(
  sql: Sql,
  input: {
    tenantId: string;
    rooftopId: string;
    sourceKey: string;
    expectedCadenceSeconds: number;
    lastHeartbeatAt: Date | null;
    observedZero: boolean;
  },
) {
  const state = deriveLivenessState(input);
  // Unique key is (tenant_id, rooftop_id, source_key) after 0005_isolation_tighten.
  const rows = await sql`
    insert into hiring.source_liveness (
      tenant_id, rooftop_id, source_key, expected_cadence_seconds, last_heartbeat_at, state, updated_at
    ) values (
      ${input.tenantId}::uuid, ${input.rooftopId}::uuid, ${input.sourceKey},
      ${input.expectedCadenceSeconds}, ${input.lastHeartbeatAt}, ${state}, now()
    )
    on conflict (tenant_id, rooftop_id, source_key) do update set
      expected_cadence_seconds = excluded.expected_cadence_seconds,
      last_heartbeat_at = excluded.last_heartbeat_at,
      state = excluded.state,
      updated_at = now()
    returning *
  `;
  return rows[0];
}

export type SourceLivenessRow = {
  source_key: string;
  state: LivenessState;
  expected_cadence_seconds: number;
  last_heartbeat_at: Date | null;
  updated_at: Date;
};

/** Ops inspect: current source_liveness rows for the session rooftop (G1-10). */
export async function listSourceLiveness(sql: Sql): Promise<SourceLivenessRow[]> {
  return sql<SourceLivenessRow[]>`
    select source_key, state, expected_cadence_seconds, last_heartbeat_at, updated_at
    from hiring.source_liveness
    order by source_key
  `;
}
