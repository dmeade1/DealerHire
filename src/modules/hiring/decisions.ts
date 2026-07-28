import type { Sql } from "@/platform/db/client";

export async function recordDecision(
  sql: Sql,
  input: {
    tenantId: string;
    rooftopId: string;
    applicationId: string;
    reviewerSubjectRef: string;
    primaryEvidenceReviewed: boolean;
    independentRationale: string;
    systemReliance?: "none" | "advisory" | "primary";
    disposition: string;
  },
) {
  if (!input.primaryEvidenceReviewed) {
    throw new Error("primary evidence review is required for a DecisionRecord");
  }
  if (!input.independentRationale || input.independentRationale.trim().length < 10) {
    throw new Error("independent rationale required");
  }
  if (input.systemReliance === "primary") {
    throw new Error("system may not be primary for employment decisions in beta");
  }

  const rows = await sql`
    insert into hiring.decision_records (
      tenant_id, rooftop_id, application_id, reviewer_subject_ref,
      primary_evidence_reviewed, independent_rationale, system_reliance, disposition
    ) values (
      ${input.tenantId}::uuid, ${input.rooftopId}::uuid, ${input.applicationId}::uuid,
      ${input.reviewerSubjectRef}, ${input.primaryEvidenceReviewed},
      ${input.independentRationale}, ${input.systemReliance ?? "none"}, ${input.disposition}
    )
    returning *
  `;
  return rows[0];
}

export function isQualifiedHire(input: {
  qualifiedConfirmedAt: Date | null;
  startConfirmedAt: Date | null;
}): boolean {
  return Boolean(input.qualifiedConfirmedAt && input.startConfirmedAt);
}

export function computeTimeToFillHours(input: {
  jobControlApprovedAt: Date;
  startConfirmedAt: Date;
}): number {
  return (input.startConfirmedAt.getTime() - input.jobControlApprovedAt.getTime()) / 3_600_000;
}
