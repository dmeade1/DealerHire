import { projectEnvelopeToApplication } from "@/modules/intake/project";
import type { Sql } from "@/platform/db/client";

export type UnprojectedEnvelope = {
  id: string;
  rooftop_id: string;
  job_control_version_id: string;
  accepted_at: Date;
};

/** Envelopes with receipt but no application row yet (RC-03 queue-down backlog). */
export async function listUnprojectedEnvelopes(
  sql: Sql,
  input: { limit?: number } = {},
): Promise<UnprojectedEnvelope[]> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  return sql<UnprojectedEnvelope[]>`
    select e.id, e.rooftop_id, e.job_control_version_id, e.accepted_at
    from subject.application_acceptance_envelopes e
    left join subject.applications a
      on a.envelope_id = e.id
     and a.tenant_id = e.tenant_id
    where a.id is null
    order by e.accepted_at asc
    limit ${limit}
  `;
}

/**
 * Drain backlog by projecting each envelope idempotently (INV-12–13 / G1-08).
 * Returns per-envelope created|exists outcomes; never duplicates applications.
 */
export async function drainUnprojectedEnvelopes(
  sql: Sql,
  input: { tenantId: string; limit?: number },
): Promise<{
  drained: number;
  created: number;
  alreadyPresent: number;
  results: Array<{ envelopeId: string; applicationId: string; created: boolean }>;
}> {
  const pending = await listUnprojectedEnvelopes(sql, { limit: input.limit ?? 50 });
  const results: Array<{ envelopeId: string; applicationId: string; created: boolean }> = [];
  let created = 0;
  let alreadyPresent = 0;
  for (const row of pending) {
    const projected = await projectEnvelopeToApplication(sql, {
      tenantId: input.tenantId,
      envelopeId: row.id,
    });
    results.push({
      envelopeId: projected.envelopeId,
      applicationId: projected.applicationId,
      created: projected.created,
    });
    if (projected.created) created += 1;
    else alreadyPresent += 1;
  }
  return { drained: results.length, created, alreadyPresent, results };
}
