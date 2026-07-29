import type { Sql } from "@/platform/db/client";

export type NeedsReconciliationCommand = {
  id: string;
  lever: string;
  status: string;
  job_control_version_id: string;
  created_at: Date;
  idempotency_key: string;
};

/** Open NeedsReconciliation commands for the current tenant/rooftop (G1-07 board). */
export async function listNeedsReconciliationCommands(
  sql: Sql,
  input: { limit?: number } = {},
): Promise<NeedsReconciliationCommand[]> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  return sql<NeedsReconciliationCommand[]>`
    select id, lever, status, job_control_version_id, created_at, idempotency_key
    from hiring.commands
    where status = 'needs_reconciliation'
    order by created_at desc
    limit ${limit}
  `;
}
