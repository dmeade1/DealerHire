import type { ActorContext } from "@/platform/auth/context";
import { withTenantContext } from "@/platform/db/client";

export type ApplicantInventoryRow = {
  publicApplicationId: string;
  acceptedAt: string;
  resumeState: string;
};

/**
 * List acceptance envelopes under the verified dealer actor's tenant/rooftop/purpose.
 * Empty when DATABASE_URL is unset (local UI shells without Postgres).
 */
export async function listApplicantEnvelopes(
  actor: ActorContext,
  connectionString = process.env.DATABASE_URL,
): Promise<ApplicantInventoryRow[]> {
  if (!connectionString) return [];
  return withTenantContext(
    actor,
    async (sql) => {
      const rows = await sql`
        select public_application_id, accepted_at, resume_state
        from subject.application_acceptance_envelopes
        order by accepted_at desc
        limit 50
      `;
      return rows.map((r) => ({
        publicApplicationId: String(r.public_application_id),
        acceptedAt: new Date(r.accepted_at as string | Date).toISOString(),
        resumeState: String(r.resume_state),
      }));
    },
    connectionString,
  );
}
