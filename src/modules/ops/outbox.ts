import type { Sql } from "@/platform/db/client";

function asJson(value: unknown): Parameters<Sql["json"]>[0] {
  return JSON.parse(JSON.stringify(value)) as Parameters<Sql["json"]>[0];
}

export type OutboxRow = {
  id: string;
  tenant_id: string;
  rooftop_id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: unknown;
  created_at: Date;
  published_at: Date | null;
};

/** Inspect recent outbox rows (INV-38). */
export async function listOutbox(
  sql: Sql,
  input: { limit?: number } = {},
): Promise<OutboxRow[]> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  return sql<OutboxRow[]>`
    select id, tenant_id, rooftop_id, aggregate_type, aggregate_id,
           event_type, payload, created_at, published_at
    from hiring.outbox
    order by created_at desc
    limit ${limit}
  `;
}

/**
 * Safe outbox replay: clear published_at so a worker can re-dispatch the same event.
 * Refuses command.queued when the command is NeedsReconciliation (INV-21 / no blind recreate).
 */
export async function safeReplayOutbox(
  sql: Sql,
  input: { outboxId: string; actorSubjectRef: string },
): Promise<{ outboxId: string; eventType: string; action: "requeued" }> {
  const rows = await sql<OutboxRow[]>`
    select id, tenant_id, rooftop_id, aggregate_type, aggregate_id,
           event_type, payload, created_at, published_at
    from hiring.outbox
    where id = ${input.outboxId}::uuid
    for update
  `;
  const row = rows[0];
  if (!row) throw new Error("outbox event not found");

  if (row.event_type === "command.queued" && row.aggregate_type === "command") {
    const cmds = await sql<{ status: string }[]>`
      select status from hiring.commands where id = ${row.aggregate_id}::uuid
    `;
    const status = cmds[0]?.status;
    if (status === "needs_reconciliation") {
      throw new Error(
        "safe replay refused: command is needs_reconciliation — use provider read-back, never re-dispatch create",
      );
    }
    if (status && !["queued", "executing"].includes(status)) {
      throw new Error(`safe replay refused: command status is ${status}`);
    }
  }

  await sql`
    update hiring.outbox
    set published_at = null
    where id = ${row.id}::uuid
  `;

  await sql`
    insert into hiring.outbox (
      tenant_id, rooftop_id, aggregate_type, aggregate_id, event_type, payload
    ) values (
      ${row.tenant_id}::uuid, ${row.rooftop_id}::uuid, 'ops_audit', ${row.id}::uuid,
      'ops.outbox_replay',
      ${sql.json(
        asJson({
          replayedOutboxId: row.id,
          eventType: row.event_type,
          actorSubjectRef: input.actorSubjectRef,
        }),
      )}
    )
  `;

  return { outboxId: row.id, eventType: row.event_type, action: "requeued" };
}
