import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { auditListing } from "@/modules/listings/audit";
import type { ListingPayload } from "@/modules/listings/types";
import { createApprovalCase } from "@/modules/commands/ledger";
import {
  activatePageRelease,
  fetchActivePageRelease,
  rollbackPageRelease,
} from "@/modules/publication/release";
import {
  getDefaultArtifactStore,
  resetDefaultArtifactStoreForTests,
} from "@/modules/publication/artifact-store";
import {
  effectManifestForPublishPage,
  publishApprovedPage,
} from "@/modules/publication/publish";
import { loadPublicJobBySlug } from "@/modules/publication/public-read";
import {
  ROOFTOP_A,
  TENANT_A,
  actorFor,
  requireIntegrationDb,
  setupIntegrationDb,
  teardownIntegrationDb,
  withTenantContext,
} from "./helpers/db";

const JCV = "00000000-0000-4000-8000-00000000000a";

/** SYNTHETIC listing payload matching seed technician role (G1-04). */
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

async function clearPublishCommands() {
  await withTenantContext(actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"), async (sql) => {
    await sql`
      update hiring.commands
      set status = 'superseded'
      where tenant_id = ${TENANT_A}::uuid
        and job_control_version_id = ${JCV}::uuid
        and lever = 'publish'
        and status in ('queued', 'executing', 'needs_reconciliation')
    `;
  });
}

describe("G1-04 listing → audit → approve → PageRelease → public fetch", () => {
  beforeAll(async () => {
    requireIntegrationDb();
    await setupIntegrationDb();
    resetDefaultArtifactStoreForTests();
    await clearPublishCommands();
  }, 60_000);

  afterAll(async () => {
    resetDefaultArtifactStoreForTests();
    await teardownIntegrationDb();
  });

  it("redeems command+outbox before PageRelease; /jobs/demo reads shared artifact store", async () => {
    const audit = auditListing({
      payload: SYNTHETIC_LISTING,
      payMinCents: 2500,
      payMaxCents: 4500,
      requirements: [{ proxyReviewed: true, essentialFunction: "Diagnose vehicle faults" }],
      jurisdictionPack: "us-ny-state",
    });
    expect(audit.reviewReady).toBe(true);
    expect(audit.hardBlockerCount).toBe(0);

    const drillId = randomUUID();
    const effectManifest = effectManifestForPublishPage({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      landingUrl: `https://jobs.dealerhire.example/demo/${drillId}`,
      title: SYNTHETIC_LISTING.title,
      drillId,
    });

    const approval = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"),
      (sql) =>
        createApprovalCase(sql, {
          tenantId: TENANT_A,
          rooftopId: ROOFTOP_A,
          jobControlVersionId: JCV,
          effectManifest,
          actor: "synthetic:hr-owner",
          authoritySource: "dealer_hr_owner",
          reason: "SYNTHETIC G1-04 publish drill",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        }),
    );

    const hiringActor = actorFor(TENANT_A, ROOFTOP_A, "hiring_operations");
    const pubActor = actorFor(TENANT_A, ROOFTOP_A, "publication_disclosure");
    const artifactStore = getDefaultArtifactStore();

    const published = await publishApprovedPage(hiringActor, pubActor, {
      redeem: {
        oneTimeToken: approval.one_time_token as string,
        tenantId: TENANT_A,
        rooftopId: ROOFTOP_A,
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

    expect(published.command.status).toBe("queued");
    expect(published.manifest.contentAddress).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(published.manifest)).toMatch(/SYNTHETIC/);
    expect(published.artifact?.contentAddress).toBe(published.manifest.contentAddress);
    expect(
      (await artifactStore.getByContentAddress(published.manifest.contentAddress))?.body.title,
    ).toBe(SYNTHETIC_LISTING.title);

    const ledger = await withTenantContext(hiringActor, async (sql) => {
      const outbox = await sql<{ event_type: string }[]>`
        select event_type from hiring.outbox
        where aggregate_id = ${published.command.id}::uuid
          and event_type = 'command.queued'
      `;
      return outbox;
    });
    expect(ledger).toHaveLength(1);

    const publicJob = await loadPublicJobBySlug("demo");
    expect(publicJob).toBeTruthy();
    expect(publicJob?.title).toBe(SYNTHETIC_LISTING.title);
    expect(publicJob?.payDisclosure).toMatch(/\$25/);
    expect(publicJob?.bodyHtml).toMatch(/SYNTHETIC/);
    expect(publicJob?.contentAddress).toBe(published.manifest.contentAddress);
    expect(publicJob?.artifactSource).toBe("r2_memory");
  });

  it("G1-05 rolls PageRelease back to prior manifest", async () => {
    const pubActor = actorFor(TENANT_A, ROOFTOP_A, "publication_disclosure");

    const first = await withTenantContext(pubActor, (sql) =>
      activatePageRelease(sql, {
        tenantId: TENANT_A,
        rooftopId: ROOFTOP_A,
        jobControlVersionId: JCV,
        artifact: {
          locale: "en",
          title: "SYNTHETIC Tech v1",
          bodyHtml: "<p>Version one SYNTHETIC</p>",
          payDisclosure: "$25.00–$40.00 per hour",
          jobControlVersionId: JCV,
        },
      }),
    );

    const second = await withTenantContext(pubActor, (sql) =>
      activatePageRelease(sql, {
        tenantId: TENANT_A,
        rooftopId: ROOFTOP_A,
        jobControlVersionId: JCV,
        previousReleaseId: first.release.id as string,
        artifact: {
          locale: "en",
          title: "SYNTHETIC Tech v2",
          bodyHtml: "<p>Version two SYNTHETIC</p>",
          payDisclosure: "$26.00–$42.00 per hour",
          jobControlVersionId: JCV,
        },
      }),
    );

    expect(second.manifest.title).toBe("SYNTHETIC Tech v2");

    const rolled = await withTenantContext(pubActor, (sql) =>
      rollbackPageRelease(sql, second.release.id as string),
    );
    expect(rolled.activeReleaseId).toBe(first.release.id);

    const active = await withTenantContext(pubActor, (sql) =>
      fetchActivePageRelease(sql, {
        tenantId: TENANT_A,
        rooftopId: ROOFTOP_A,
        jobControlVersionId: JCV,
      }),
    );
    expect(active?.id).toBe(first.release.id);
    expect((active?.manifest as { title?: string })?.title).toBe("SYNTHETIC Tech v1");

    const publicJob = await loadPublicJobBySlug("demo");
    expect(publicJob?.title).toBe("SYNTHETIC Tech v1");
  });
});
