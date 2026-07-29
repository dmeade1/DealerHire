import {
  redeemApprovalAndEnqueueCommand,
  type EffectManifest,
  type RedeemCommandInput,
} from "@/modules/commands/ledger";
import {
  getDefaultArtifactStore,
  putPageArtifactBeforeActivate,
  type PageArtifactStore,
} from "@/modules/publication/artifact-store";
import {
  activatePageRelease,
  type PageArtifact,
} from "@/modules/publication/release";
import type { ActorContext } from "@/platform/auth/context";
import { withTenantContext } from "@/platform/db/client";

export type PublishApprovedPageInput = {
  redeem: RedeemCommandInput;
  artifact: PageArtifact;
  previousReleaseId?: string;
  /** R2-shaped store — defaults to process-local G1 store (ADR 0005 put-before-activate). */
  artifactStore?: PageArtifactStore;
};

/**
 * G1-04 / INV-19–20: redeem approval + Command + outbox atomically and commit,
 * put content-addressed artifact, then activate PageRelease (effect side).
 * Never activate before the command ledger row exists.
 */
export async function publishApprovedPage(
  hiringActor: ActorContext,
  publicationActor: ActorContext,
  input: PublishApprovedPageInput,
) {
  const redeemed = await withTenantContext(hiringActor, (sql) =>
    redeemApprovalAndEnqueueCommand(sql, input.redeem),
  );

  const store = input.artifactStore ?? getDefaultArtifactStore();
  const storedArtifact = await putPageArtifactBeforeActivate(store, input.artifact);

  // Publication effect — after redeem txn committed (INV-20).
  const activated = await withTenantContext(publicationActor, (sql) =>
    activatePageRelease(sql, {
      tenantId: input.redeem.tenantId,
      rooftopId: input.redeem.rooftopId,
      jobControlVersionId: input.redeem.jobControlVersionId,
      artifact: input.artifact,
      previousReleaseId: input.previousReleaseId,
    }),
  );

  if (storedArtifact.contentAddress !== activated.manifest.contentAddress) {
    throw new Error("artifact content address diverged from PageRelease manifest");
  }

  return {
    command: redeemed.command,
    approvalId: redeemed.approvalId,
    release: activated.release,
    manifest: activated.manifest,
    artifact: storedArtifact,
  };
}

export function effectManifestForPublishPage(input: {
  tenantId: string;
  rooftopId: string;
  jobControlVersionId: string;
  landingUrl: string;
  title: string;
  drillId?: string;
}): EffectManifest {
  return {
    tenantId: input.tenantId,
    rooftopId: input.rooftopId,
    jobControlVersionId: input.jobControlVersionId,
    lever: "publish",
    landingUrl: input.landingUrl,
    policyVersions: { pack: "us-ny-state", synthetic: true },
    adapterNormalizedEffect: {
      action: "publish_page",
      synthetic: true,
      title: input.title,
      ...(input.drillId ? { drillId: input.drillId } : {}),
    },
  };
}
