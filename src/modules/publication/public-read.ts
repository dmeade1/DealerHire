import { getDefaultArtifactStore } from "@/modules/publication/artifact-store";
import { fetchActivePageRelease } from "@/modules/publication/release";
import { resolvePublicJobSlug } from "@/modules/publication/slugs";
import type { ActorContext } from "@/platform/auth/context";
import { withTenantContext } from "@/platform/db/client";

function publicationReaderActor(tenantId: string, rooftopId: string): ActorContext {
  return {
    actorSubjectRef: "system:public-jobs-reader",
    tenantId,
    rooftopId,
    purpose: "publication_disclosure",
    role: "system",
    capabilities: [],
    sessionId: "public:jobs-reader",
    expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
  };
}

export type PublicJobView = {
  slug: string;
  title: string;
  payDisclosure: string;
  bodyHtml: string;
  contentAddress: string;
  jobControlVersionId: string;
  releaseId: string;
  /** Present when content-addressed artifact store has the object (ADR 0005). */
  artifactKey?: string;
  artifactSource: "r2_memory" | "page_release_manifest";
};

/**
 * Public fetch: PageRelease pointer is authoritative for which contentAddress is active.
 * Prefer content-addressed artifact body when the G1 store has it; else manifest (Postgres stand-in).
 */
export async function loadPublicJobBySlug(slug: string): Promise<PublicJobView | null> {
  const resolved = resolvePublicJobSlug(slug);
  if (!resolved) return null;

  const actor = publicationReaderActor(resolved.tenantId, resolved.rooftopId);
  const row = await withTenantContext(actor, (sql) =>
    fetchActivePageRelease(sql, {
      tenantId: resolved.tenantId,
      rooftopId: resolved.rooftopId,
      jobControlVersionId: resolved.jobControlVersionId,
    }),
  );
  if (!row) return null;

  const manifest = row.manifest as {
    title?: string;
    bodyHtml?: string;
    payDisclosure?: string;
    jobControlVersionId?: string;
    artifactKey?: string;
    contentAddress?: string;
  };

  const contentAddress = String(row.content_address);
  let bodyHtml = manifest.bodyHtml ?? "";
  let artifactKey = manifest.artifactKey;
  let artifactSource: PublicJobView["artifactSource"] = "page_release_manifest";

  try {
    const stored = await getDefaultArtifactStore().getByContentAddress(contentAddress);
    if (stored && stored.contentAddress === contentAddress) {
      bodyHtml = stored.body.bodyHtml;
      artifactKey = stored.key;
      artifactSource = "r2_memory";
    }
  } catch {
    // Store unavailable → fail open to manifest for G1 (public page still serves pointer facts).
  }

  return {
    slug: resolved.slug,
    title: manifest.title ?? "Job",
    payDisclosure: manifest.payDisclosure ?? "",
    bodyHtml,
    contentAddress,
    jobControlVersionId: manifest.jobControlVersionId ?? resolved.jobControlVersionId,
    releaseId: String(row.id),
    artifactKey,
    artifactSource,
  };
}
