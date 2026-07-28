import { contentAddress } from "@/platform/crypto/hash";
import type { Sql } from "@/platform/db/client";

function asJson(value: unknown): Parameters<Sql["json"]>[0] {
  return JSON.parse(JSON.stringify(value)) as Parameters<Sql["json"]>[0];
}

export type PageArtifact = {
  locale: "en";
  title: string;
  bodyHtml: string;
  payDisclosure: string;
  jobControlVersionId: string;
};

/**
 * Upload content-addressed immutable artifacts first (caller), then switch one pointer.
 * R2 is strongly consistent per object — atomicity is the single PageRelease row activation.
 */
export function buildPageManifest(artifact: PageArtifact) {
  const contentAddressValue = contentAddress(artifact);
  return {
    locale: artifact.locale,
    title: artifact.title,
    bodyHtml: artifact.bodyHtml,
    payDisclosure: artifact.payDisclosure,
    jobControlVersionId: artifact.jobControlVersionId,
    contentAddress: contentAddressValue,
    artifactKey: `pages/${artifact.jobControlVersionId}/${contentAddressValue}.json`,
  };
}

export async function activatePageRelease(
  sql: Sql,
  input: {
    tenantId: string;
    rooftopId: string;
    jobControlVersionId: string;
    artifact: PageArtifact;
    previousReleaseId?: string;
  },
) {
  const manifest = buildPageManifest(input.artifact);
  const rows = await sql`
    insert into publication.page_releases (
      tenant_id, rooftop_id, job_control_version_id, locale, manifest,
      content_address, previous_release_id, activated_at
    ) values (
      ${input.tenantId}::uuid, ${input.rooftopId}::uuid, ${input.jobControlVersionId}::uuid,
      'en', ${sql.json(asJson(manifest))}, ${manifest.contentAddress},
      ${input.previousReleaseId ?? null}::uuid, now()
    )
    returning *
  `;
  return { release: rows[0], manifest };
}

export async function rollbackPageRelease(sql: Sql, currentReleaseId: string) {
  const current = await sql`
    select * from publication.page_releases where id = ${currentReleaseId}::uuid
  `;
  const row = current[0];
  if (!row) throw new Error("release not found");
  if (!row.previous_release_id) throw new Error("no previous release to roll back to");

  await sql`
    update publication.page_releases
    set rolled_back_at = now()
    where id = ${currentReleaseId}::uuid
  `;

  await sql`
    update publication.page_releases
    set activated_at = now(), rolled_back_at = null
    where id = ${row.previous_release_id}::uuid
  `;

  return { activeReleaseId: row.previous_release_id as string };
}
