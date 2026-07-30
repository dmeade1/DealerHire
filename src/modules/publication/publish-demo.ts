/**
 * SYNTHETIC G1-04 operability helper: audit → approve → put-before-activate → PageRelease.
 * Uses the process-local default artifact store (memory until R2 Selected).
 */

import { randomUUID } from "node:crypto";
import { createApprovalCase } from "@/modules/commands/ledger";
import { auditListing } from "@/modules/listings/audit";
import type { ListingPayload } from "@/modules/listings/types";
import {
  effectManifestForPublishPage,
  publishApprovedPage,
} from "@/modules/publication/publish";
import { loadPublicJobBySlug } from "@/modules/publication/public-read";
import type { ActorContext } from "@/platform/auth/context";
import { withTenantContext } from "@/platform/db/client";

const TENANT =
  process.env.SYNTHETIC_TENANT_ID ?? "00000000-0000-4000-8000-000000000001";
const ROOFTOP =
  process.env.SYNTHETIC_ROOFTOP_ID ?? "00000000-0000-4000-8000-000000000002";
const JCV =
  process.env.SYNTHETIC_JOB_CONTROL_VERSION_ID ??
  "00000000-0000-4000-8000-00000000000a";

const SYNTHETIC_LISTING: ListingPayload = {
  title: "ASE Automotive Technician",
  department: "fixed_operations",
  jobFamily: "technician",
  description:
    "Perform diagnostics and repair on vehicles in a dealership fixed ops environment with safety and OEM procedures. SYNTHETIC.",
  schedule: "Tue-Sat",
  locationType: "onsite",
  mustHaveSkills: ["diagnostics"],
  trainableSkills: ["EV"],
  credentials: ["ASE"],
  locale: "en",
};

function actor(purpose: ActorContext["purpose"]): ActorContext {
  return {
    actorSubjectRef: "synthetic:ops-publish-demo",
    tenantId: TENANT,
    rooftopId: ROOFTOP,
    purpose,
    role: "system",
    capabilities: ["*"],
    sessionId: "ops:publish-demo",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

async function supersedePublishCommands(): Promise<void> {
  await withTenantContext(actor("hiring_operations"), async (sql) => {
    await sql`
      update hiring.commands
      set status = 'superseded'
      where tenant_id = ${TENANT}::uuid
        and job_control_version_id = ${JCV}::uuid
        and lever = 'publish'
        and status in ('queued', 'executing', 'needs_reconciliation')
    `;
  });
}

export async function publishSyntheticDemoPage(): Promise<{
  commandId: string;
  releaseId: string;
  contentAddress: string;
  artifactSource: string | null;
  publicPath: string;
}> {
  await supersedePublishCommands();

  const audit = auditListing({
    payload: SYNTHETIC_LISTING,
    payMinCents: 2500,
    payMaxCents: 4500,
    requirements: [
      { proxyReviewed: true, essentialFunction: "Diagnose vehicle faults" },
    ],
    jurisdictionPack: "us-ny-state",
  });
  if (!audit.reviewReady || audit.hardBlockerCount > 0) {
    throw new Error("synthetic_listing_not_review_ready");
  }

  const drillId = randomUUID();
  const effectManifest = effectManifestForPublishPage({
    tenantId: TENANT,
    rooftopId: ROOFTOP,
    jobControlVersionId: JCV,
    landingUrl: `https://jobs.dealerhire.example/demo/${drillId}`,
    title: SYNTHETIC_LISTING.title,
    drillId,
  });

  const hiringActor = actor("hiring_operations");
  const pubActor = actor("publication_disclosure");

  const approval = await withTenantContext(hiringActor, (sql) =>
    createApprovalCase(sql, {
      tenantId: TENANT,
      rooftopId: ROOFTOP,
      jobControlVersionId: JCV,
      effectManifest,
      actor: "synthetic:hr-owner",
      authoritySource: "dealer_hr_owner",
      reason: "SYNTHETIC G1-04 publish:demo",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    }),
  );

  const published = await publishApprovedPage(hiringActor, pubActor, {
    redeem: {
      oneTimeToken: approval.one_time_token as string,
      tenantId: TENANT,
      rooftopId: ROOFTOP,
      jobControlVersionId: JCV,
      lever: "publish",
      payload: effectManifest.adapterNormalizedEffect,
      effectManifest,
    },
    artifact: {
      locale: "en",
      title: SYNTHETIC_LISTING.title,
      bodyHtml: `<p>${SYNTHETIC_LISTING.description}</p>`,
      payDisclosure: "$25.00–$45.00 per hour",
      jobControlVersionId: JCV,
    },
  });

  const publicJob = await loadPublicJobBySlug("demo");
  return {
    commandId: String(published.command.id),
    releaseId: String(published.release.id),
    contentAddress: published.manifest.contentAddress,
    artifactSource: publicJob?.artifactSource ?? null,
    publicPath: "/jobs/demo",
  };
}
