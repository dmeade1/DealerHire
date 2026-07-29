import type { Sql } from "@/platform/db/client";

export type ProjectEnvelopeResult = {
  applicationId: string;
  envelopeId: string;
  created: boolean;
};

/**
 * RC-03 / INV-12–13: drain ingest from the durable envelope.
 * Idempotent on envelope_id — queue-down replay must not duplicate applications.
 * Non-gating relative to acceptance receipt (INV-11).
 */
export async function projectEnvelopeToApplication(
  sql: Sql,
  input: { tenantId: string; envelopeId: string },
): Promise<ProjectEnvelopeResult> {
  const envelopes = await sql<{
    id: string;
    rooftop_id: string;
    job_control_version_id: string;
  }[]>`
    select id, rooftop_id, job_control_version_id
    from subject.application_acceptance_envelopes
    where tenant_id = ${input.tenantId}::uuid
      and id = ${input.envelopeId}::uuid
  `;
  const envelope = envelopes[0];
  if (!envelope) {
    throw new Error("envelope not found for projection");
  }

  const inserted = await sql<{ id: string }[]>`
    insert into subject.applications (
      tenant_id, rooftop_id, envelope_id, job_control_version_id, status
    ) values (
      ${input.tenantId}::uuid,
      ${envelope.rooftop_id}::uuid,
      ${envelope.id}::uuid,
      ${envelope.job_control_version_id}::uuid,
      'received'
    )
    on conflict (envelope_id) do nothing
    returning id
  `;

  if (inserted[0]) {
    await sql`
      update subject.application_acceptance_envelopes
      set reconciled_at = coalesce(reconciled_at, now())
      where id = ${envelope.id}::uuid
    `;
    return {
      applicationId: inserted[0].id,
      envelopeId: envelope.id,
      created: true,
    };
  }

  const existing = await sql<{ id: string }[]>`
    select id from subject.applications
    where tenant_id = ${input.tenantId}::uuid
      and envelope_id = ${envelope.id}::uuid
  `;
  if (!existing[0]) {
    throw new Error("application conflict without existing row");
  }
  return {
    applicationId: existing[0].id,
    envelopeId: envelope.id,
    created: false,
  };
}

/** Simulate ingest queue unavailable — projection intentionally skipped after accept. */
export function isIngestQueueAvailable(flag = process.env.INGEST_QUEUE_AVAILABLE): boolean {
  if (flag === undefined || flag === "") return true;
  return flag === "true" || flag === "1";
}
