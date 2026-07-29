/**
 * G1 public slug → synthetic PageRelease pointer.
 * Custom domains / multi-tenant routing are post-beta.
 */
export type PublicJobSlug = {
  slug: string;
  tenantId: string;
  rooftopId: string;
  jobControlVersionId: string;
};

const SYNTHETIC_TENANT =
  process.env.SYNTHETIC_TENANT_ID ?? "00000000-0000-4000-8000-000000000001";
const SYNTHETIC_ROOFTOP =
  process.env.SYNTHETIC_ROOFTOP_ID ?? "00000000-0000-4000-8000-000000000002";
const SYNTHETIC_JCV =
  process.env.SYNTHETIC_JOB_CONTROL_VERSION_ID ?? "00000000-0000-4000-8000-00000000000a";

const SLUGS: Record<string, PublicJobSlug> = {
  demo: {
    slug: "demo",
    tenantId: SYNTHETIC_TENANT,
    rooftopId: SYNTHETIC_ROOFTOP,
    jobControlVersionId: SYNTHETIC_JCV,
  },
};

export function resolvePublicJobSlug(slug: string): PublicJobSlug | null {
  const key = slug.trim().toLowerCase();
  return SLUGS[key] ?? null;
}
