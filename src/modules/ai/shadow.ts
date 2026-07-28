import type { Sql } from "@/platform/db/client";

export type ShadowExtraction = {
  skills: Array<{ label: string; confidence: number; sourceExcerptId: string }>;
  unknowns: string[];
  classifications: Array<{ kind: "confirmed" | "transferable" | "gap"; label: string }>;
};

/**
 * Candidate AI is shadow-only in beta. Outputs must not be returned to reviewers,
 * applicants, campaigns, communications, or analytics consumers.
 */
export async function runShadowExtraction(
  sql: Sql,
  input: {
    tenantId: string;
    rooftopId: string;
    authorityVersion: string;
    fieldManifest: string[];
    redactedEvidence: string;
    modelRoute: string;
  },
): Promise<{ inferenceUseId: string; sealed: true }> {
  if (process.env.CANDIDATE_AI_MODE === "live") {
    throw new Error("live candidate AI is gated; EmploymentAIUse release required");
  }

  // Deterministic stub — no external call with identifiable resume content.
  const _shadow: ShadowExtraction = {
    skills: [],
    unknowns: ["external_model_disabled_in_skeleton"],
    classifications: [],
  };
  void input.redactedEvidence;
  void _shadow;

  const rows = await sql`
    insert into platform.inference_uses (
      tenant_id, rooftop_id, purpose, authority_version, model_route,
      field_manifest, output_destinations, mode
    ) values (
      ${input.tenantId}::uuid, ${input.rooftopId}::uuid, 'hiring_operations',
      ${input.authorityVersion}, ${input.modelRoute},
      ${sql.json(JSON.parse(JSON.stringify(input.fieldManifest)))}, ${sql.json(JSON.parse(JSON.stringify([])))}, 'shadow'
    )
    returning id
  `;

  return { inferenceUseId: rows[0].id as string, sealed: true };
}

export function assertShadowInaccessibleToDecisionMakers(destinations: string[]): void {
  const forbidden = ["reviewer_ui", "applicant_ui", "campaign_controller", "analytics_consumer"];
  for (const d of destinations) {
    if (forbidden.includes(d)) {
      throw new Error(`shadow AI cannot write to ${d}`);
    }
  }
}
