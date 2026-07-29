import type { ActorContext } from "@/platform/auth/context";
import { withTenantContext } from "@/platform/db/client";

export type AnalyticsContextSummary = {
  tenantId: string;
  rooftopId: string;
  purpose: string;
  envelopeCount: number;
  requisitionCount: number;
};

/** Tenant-scoped descriptive counts for the analytics shell (no causal claims). */
export async function loadAnalyticsContext(
  actor: ActorContext,
  connectionString = process.env.DATABASE_URL,
): Promise<AnalyticsContextSummary> {
  if (!connectionString) {
    return {
      tenantId: actor.tenantId,
      rooftopId: actor.rooftopId ?? "",
      purpose: actor.purpose,
      envelopeCount: 0,
      requisitionCount: 0,
    };
  }

  return withTenantContext(
    actor,
    async (sql) => {
      const [envelopes] = await sql<{ n: number }[]>`
        select count(*)::int as n from subject.application_acceptance_envelopes
      `;
      const [requisitions] = await sql<{ n: number }[]>`
        select count(*)::int as n from hiring.requisitions
      `;
      return {
        tenantId: actor.tenantId,
        rooftopId: actor.rooftopId ?? "",
        purpose: actor.purpose,
        envelopeCount: envelopes?.n ?? 0,
        requisitionCount: requisitions?.n ?? 0,
      };
    },
    connectionString,
  );
}
