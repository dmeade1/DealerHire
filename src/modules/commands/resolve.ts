import { attachActuationReceipt } from "@/modules/commands/ledger";
import type { Sql } from "@/platform/db/client";
import { runInTransaction } from "@/platform/db/client";
import { emitSafeEvent } from "@/platform/telemetry/safe-event";

function asJson(value: unknown): Parameters<Sql["json"]>[0] {
  return JSON.parse(JSON.stringify(value)) as Parameters<Sql["json"]>[0];
}

export type ResolveNeedsReconciliationInput = {
  tenantId: string;
  rooftopId: string;
  commandId: string;
  actorSubjectRef: string;
} & (
  | {
      resolution: "receipted";
      provider: string;
      providerRef?: string;
      observedState: unknown;
    }
  | {
      resolution: "superseded";
      reason: string;
    }
);

/**
 * INV-21 / RC-08: operator resolve after provider read-back.
 * Never creates a second command — receipt the existing one or supersede it.
 */
export async function resolveNeedsReconciliation(
  sql: Sql,
  input: ResolveNeedsReconciliationInput,
) {
  const current = await sql<{ status: string }[]>`
    select status from hiring.commands
    where id = ${input.commandId}::uuid
      and tenant_id = ${input.tenantId}::uuid
  `;
  if (!current[0]) throw new Error("command not found");
  if (current[0].status !== "needs_reconciliation") {
    throw new Error(`command not in needs_reconciliation (status=${current[0].status})`);
  }

  if (input.resolution === "receipted") {
    const receipt = await attachActuationReceipt(sql, {
      tenantId: input.tenantId,
      rooftopId: input.rooftopId,
      commandId: input.commandId,
      provider: input.provider,
      providerRef: input.providerRef,
      observedState: input.observedState,
    });
    emitSafeEvent({
      name: "ops.reconciliation_resolved",
      tenantId: input.tenantId,
      rooftopId: input.rooftopId,
      commandId: input.commandId,
      status: "succeeded",
      meta: { resolution: "receipted", actor: input.actorSubjectRef },
    });
    return { status: "succeeded" as const, receiptId: receipt.id as string };
  }

  await runInTransaction(sql, async (tx) => {
    await tx`
      update hiring.commands
      set status = 'superseded'
      where id = ${input.commandId}::uuid
        and status = 'needs_reconciliation'
    `;
    await tx`
      insert into hiring.outbox (
        tenant_id, rooftop_id, aggregate_type, aggregate_id, event_type, payload
      ) values (
        ${input.tenantId}::uuid, ${input.rooftopId}::uuid, 'command', ${input.commandId}::uuid,
        'command.superseded',
        ${tx.json(
          asJson({
            reason: input.reason,
            actorSubjectRef: input.actorSubjectRef,
            synthetic: true,
          }),
        )}
      )
    `;
  });

  emitSafeEvent({
    name: "ops.reconciliation_resolved",
    tenantId: input.tenantId,
    rooftopId: input.rooftopId,
    commandId: input.commandId,
    status: "superseded",
    meta: { resolution: "superseded", actor: input.actorSubjectRef },
  });

  return { status: "superseded" as const };
}
