import type { Sql } from "@/platform/db/client";

function asJson(value: unknown): Parameters<Sql["json"]>[0] {
  return JSON.parse(JSON.stringify(value)) as Parameters<Sql["json"]>[0];
}

export type DeadLetterRow = {
  id: string;
  tenant_id: string;
  rooftop_id: string;
  source: string;
  message_type: string;
  schema_version: number | null;
  payload: unknown;
  reason: string;
  attempts: number;
  quarantined_at: Date;
  resolved_at: Date | null;
  resolved_by: string | null;
};

/** Quarantine a poison / exhausted message (RC-09). */
export async function quarantineDeadLetter(
  sql: Sql,
  input: {
    tenantId: string;
    rooftopId: string;
    source: string;
    messageType: string;
    schemaVersion?: number | null;
    payload: unknown;
    reason: string;
    attempts?: number;
  },
): Promise<DeadLetterRow> {
  const rows = await sql<DeadLetterRow[]>`
    insert into hiring.dead_letter (
      tenant_id, rooftop_id, source, message_type, schema_version,
      payload, reason, attempts
    ) values (
      ${input.tenantId}::uuid,
      ${input.rooftopId}::uuid,
      ${input.source},
      ${input.messageType},
      ${input.schemaVersion ?? null},
      ${sql.json(asJson(input.payload))},
      ${input.reason},
      ${input.attempts ?? 0}
    )
    returning *
  `;
  const row = rows[0];
  if (!row) throw new Error("dead_letter_insert_failed");
  return row;
}

export async function listDeadLetters(
  sql: Sql,
  input: { limit?: number; includeResolved?: boolean } = {},
): Promise<DeadLetterRow[]> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  if (input.includeResolved) {
    return sql<DeadLetterRow[]>`
      select * from hiring.dead_letter
      order by quarantined_at desc
      limit ${limit}
    `;
  }
  return sql<DeadLetterRow[]>`
    select * from hiring.dead_letter
    where resolved_at is null
    order by quarantined_at desc
    limit ${limit}
  `;
}

/**
 * Safe DLQ retry: mark resolved and re-insert a fresh outbox event for dispatch.
 * Never recreates commands under NeedsReconciliation (same guard as outbox replay).
 */
export async function safeRetryDeadLetter(
  sql: Sql,
  input: { deadLetterId: string; actorSubjectRef: string },
): Promise<{ deadLetterId: string; outboxId: string; action: "requeued" }> {
  const rows = await sql<DeadLetterRow[]>`
    select * from hiring.dead_letter
    where id = ${input.deadLetterId}::uuid
    for update
  `;
  const row = rows[0];
  if (!row) throw new Error("dead_letter not found");
  if (row.resolved_at) throw new Error("dead_letter already resolved");

  if (row.message_type === "command.queued") {
    const payload = row.payload as { commandId?: string; aggregateId?: string };
    const commandId = payload.commandId ?? payload.aggregateId;
    if (typeof commandId === "string") {
      const cmds = await sql<{ status: string }[]>`
        select status from hiring.commands where id = ${commandId}::uuid
      `;
      const status = cmds[0]?.status;
      if (status === "needs_reconciliation") {
        throw new Error(
          "safe DLQ retry refused: command is needs_reconciliation — use provider read-back, never re-dispatch create",
        );
      }
    }
  }

  const outbox = await sql<{ id: string }[]>`
    insert into hiring.outbox (
      tenant_id, rooftop_id, aggregate_type, aggregate_id, event_type, payload
    ) values (
      ${row.tenant_id}::uuid,
      ${row.rooftop_id}::uuid,
      'dead_letter',
      ${row.id}::uuid,
      ${row.message_type},
      ${sql.json(asJson(row.payload))}
    )
    returning id
  `;
  const outboxId = outbox[0]?.id;
  if (!outboxId) throw new Error("dead_letter_requeue_failed");

  await sql`
    update hiring.dead_letter
    set resolved_at = now(),
        resolved_by = ${input.actorSubjectRef}
    where id = ${row.id}::uuid
  `;

  await sql`
    insert into hiring.outbox (
      tenant_id, rooftop_id, aggregate_type, aggregate_id, event_type, payload
    ) values (
      ${row.tenant_id}::uuid,
      ${row.rooftop_id}::uuid,
      'ops_audit',
      ${row.id}::uuid,
      'ops.dlq_retry',
      ${sql.json(
        asJson({
          deadLetterId: row.id,
          outboxId,
          messageType: row.message_type,
          actorSubjectRef: input.actorSubjectRef,
        }),
      )}
    )
  `;

  return { deadLetterId: row.id, outboxId, action: "requeued" };
}
