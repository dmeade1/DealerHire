import type { Sql } from "@/platform/db/client";
import { withTenantContext } from "@/platform/db/client";
import type { ActorContext } from "@/platform/auth/context";

export const KILL_SWITCH_SCOPES = ["intake", "campaigns", "all_execution"] as const;
export type KillSwitchScope = (typeof KILL_SWITCH_SCOPES)[number];

/**
 * Gate HTTP/CLI mutation surfaces until real operator auth exists.
 * Fail closed when OPS_CONTROL_SECRET is unset or presented secret mismatches.
 */
export function assertOpsControlSecret(presented: string | null | undefined): void {
  const expected = process.env.OPS_CONTROL_SECRET;
  if (!expected) {
    throw new Error("ops_control_secret_unconfigured");
  }
  if (!presented || presented !== expected) {
    throw new Error("ops_control_unauthorized");
  }
}

export function opsControlSecretFromRequest(request: Request, formSecret?: string | null): string | null {
  const header =
    request.headers.get("x-ops-control-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null;
  if (header) return header;
  return formSecret ?? null;
}

export type KillSwitchState = {
  scope: KillSwitchScope;
  paused: boolean;
  reason: string;
  actorSubjectRef: string;
  updatedAt: string;
};

function asScope(value: string): KillSwitchScope {
  if ((KILL_SWITCH_SCOPES as readonly string[]).includes(value)) {
    return value as KillSwitchScope;
  }
  throw new Error(`invalid kill switch scope: ${value}`);
}

export function platformOpsActor(actorSubjectRef = "system:ops"): ActorContext {
  return {
    actorSubjectRef,
    // Platform-wide flags still require tenant+rooftop session context (INV-07/08).
    tenantId: process.env.SYNTHETIC_TENANT_ID ?? "00000000-0000-4000-8000-000000000001",
    rooftopId: process.env.SYNTHETIC_ROOFTOP_ID ?? "00000000-0000-4000-8000-000000000002",
    purpose: "platform_control",
    role: "recovery_operator",
    capabilities: ["ops.pause", "ops.inspect"],
    sessionId: `ops:${actorSubjectRef}`,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}

function mapRow(row: Record<string, unknown>): KillSwitchState {
  return {
    scope: asScope(String(row.scope)),
    paused: Boolean(row.paused),
    reason: String(row.reason ?? ""),
    actorSubjectRef: String(row.actor_subject_ref ?? ""),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listKillSwitches(sql: Sql): Promise<KillSwitchState[]> {
  const rows = await sql`
    select scope, paused, reason, actor_subject_ref, updated_at
    from platform.execution_kill_switches
    order by scope
  `;
  return rows.map((r) => mapRow(r as Record<string, unknown>));
}

export async function getKillSwitch(sql: Sql, scope: KillSwitchScope): Promise<KillSwitchState | null> {
  const rows = await sql`
    select scope, paused, reason, actor_subject_ref, updated_at
    from platform.execution_kill_switches
    where scope = ${scope}
  `;
  return rows[0] ? mapRow(rows[0] as Record<string, unknown>) : null;
}

/**
 * Persist pause/resume and append an audit row. Returns the durable readback state.
 */
export async function setKillSwitch(
  sql: Sql,
  input: {
    scope: KillSwitchScope;
    paused: boolean;
    reason: string;
    actorSubjectRef: string;
  },
): Promise<KillSwitchState> {
  if (!input.reason.trim()) {
    throw new Error("kill switch reason required");
  }

  const existing = await getKillSwitch(sql, input.scope);
  const rows = await sql`
    insert into platform.execution_kill_switches (
      scope, paused, reason, actor_subject_ref, updated_at
    ) values (
      ${input.scope}, ${input.paused}, ${input.reason.trim()}, ${input.actorSubjectRef}, now()
    )
    on conflict (scope) do update set
      paused = excluded.paused,
      reason = excluded.reason,
      actor_subject_ref = excluded.actor_subject_ref,
      updated_at = now()
    returning scope, paused, reason, actor_subject_ref, updated_at
  `;

  await sql`
    insert into platform.kill_switch_audit (
      scope, paused, previous_paused, reason, actor_subject_ref
    ) values (
      ${input.scope}, ${input.paused}, ${existing?.paused ?? null},
      ${input.reason.trim()}, ${input.actorSubjectRef}
    )
  `;

  return mapRow(rows[0] as Record<string, unknown>);
}

export async function isExecutionPaused(
  sql: Sql,
  scope: Exclude<KillSwitchScope, "all_execution">,
): Promise<boolean> {
  const rows = await sql`
    select scope, paused
    from platform.execution_kill_switches
    where paused = true
      and (scope = ${scope} or scope = 'all_execution')
  `;
  return rows.length > 0;
}

export async function readKillSwitches(connectionString?: string): Promise<KillSwitchState[]> {
  return withTenantContext(platformOpsActor(), (sql) => listKillSwitches(sql), connectionString);
}

export async function applyKillSwitch(
  input: {
    scope: string;
    paused: boolean;
    reason: string;
    actorSubjectRef: string;
  },
  connectionString?: string,
): Promise<KillSwitchState> {
  const scope = asScope(input.scope);
  return withTenantContext(
    platformOpsActor(input.actorSubjectRef),
    (sql) =>
      setKillSwitch(sql, {
        scope,
        paused: input.paused,
        reason: input.reason,
        actorSubjectRef: input.actorSubjectRef,
      }),
    connectionString,
  );
}

export async function assertIntakeNotPaused(connectionString?: string): Promise<void> {
  const paused = await withTenantContext(
    platformOpsActor("system:intake-gate"),
    (sql) => isExecutionPaused(sql, "intake"),
    connectionString,
  );
  if (paused) {
    throw new Error("intake_paused");
  }
}
