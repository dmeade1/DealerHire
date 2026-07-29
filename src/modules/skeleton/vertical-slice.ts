import { auditListing } from "@/modules/listings/audit";
import type { ListingPayload } from "@/modules/listings/types";
import { buildPageManifest } from "@/modules/publication/release";
import { contentAddress } from "@/platform/crypto/hash";
import { advisoryDecision, deriveLivenessState, executionDecision } from "@/modules/liveness/sources";
import { evaluateCommunicationAuthorization } from "@/modules/comms/authorization";
import { isQualifiedHire } from "@/modules/hiring/decisions";
import { betaBlockedReason } from "@/modules/roles/catalog";

/**
 * In-memory vertical slice for the no-PII walking skeleton demonstration.
 * Proves control flow without requiring a live database.
 */
export function runSyntheticVerticalSlice() {
  const payload: ListingPayload = {
    title: "ASE Automotive Technician (SYNTHETIC)",
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

  const audit = auditListing({
    payload,
    payMinCents: 2500,
    payMaxCents: 4500,
    requirements: [{ proxyReviewed: true, essentialFunction: "Diagnose vehicle faults" }],
    jurisdictionPack: "us-ny-state",
  });

  const effectManifest = {
    tenantId: "00000000-0000-4000-8000-000000000001",
    rooftopId: "00000000-0000-4000-8000-000000000002",
    jobControlVersionId: "00000000-0000-4000-8000-00000000000a",
    lever: "publish",
    landingUrl: "https://jobs.dealerhire.example/demo",
    policyVersions: { pack: "us-ny-state" },
    adapterNormalizedEffect: { action: "publish_page" },
  };

  const page = buildPageManifest({
    locale: "en",
    title: payload.title,
    bodyHtml: `<p>${payload.description}</p>`,
    payDisclosure: "$25.00–$45.00 per hour",
    jobControlVersionId: "00000000-0000-4000-8000-00000000000a",
  });

  const liveness = deriveLivenessState({
    lastHeartbeatAt: new Date(),
    expectedCadenceSeconds: 300,
    observedZero: false,
  });

  const emailAuth = evaluateCommunicationAuthorization({
    channel: "email",
    purpose: "transactional_application_receipt",
    permissionGranted: true,
    withdrawn: false,
    suppressed: false,
    employerCaller: "North Atlantic Motors (SYNTHETIC)",
    tenantId: effectManifest.tenantId,
    technology: "email_api",
    jurisdiction: "us-ny-state",
    permissionVersion: "email.txn.v1",
  });

  return {
    auditReviewReady: audit.reviewReady,
    effectHash: contentAddress(effectManifest),
    pageContentAddress: page.contentAddress,
    advisory: advisoryDecision(liveness),
    execution: executionDecision(liveness),
    emailAllowed: emailAuth.allowed,
    smsBlocked: !evaluateCommunicationAuthorization({
      ...emailAuth,
      channel: "sms",
      smsEnabled: false,
      permissionGranted: true,
      withdrawn: false,
      suppressed: false,
      purpose: "transactional_application_receipt",
      employerCaller: emailAuth.employerCaller,
      tenantId: emailAuth.tenantId,
      technology: "sms_api",
      jurisdiction: emailAuth.jurisdiction,
      permissionVersion: "sms.txn.v1",
    }).allowed,
    qualifiedHireExample: isQualifiedHire({
      qualifiedConfirmedAt: new Date(),
      startConfirmedAt: new Date(),
    }),
    betaBlockedByRoles: betaBlockedReason(),
    candidateAiMode: "shadow",
    adActuationEnabled: false,
  };
}
