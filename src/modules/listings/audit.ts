import type { ListingPayload } from "./types";

export type FindingClass = "hard_blocker" | "required_human_action" | "advisory";

export type Finding = {
  code: string;
  class: FindingClass;
  message: string;
  field?: string;
};

export type AuditResult = {
  findings: Finding[];
  hardBlockerCount: number;
  reviewReady: boolean;
};

export function auditListing(input: {
  payload: ListingPayload;
  payMinCents: number;
  payMaxCents: number;
  requirements: Array<{ proxyReviewed: boolean; essentialFunction: string }>;
  jurisdictionPack: string;
}): AuditResult {
  const findings: Finding[] = [];

  if (input.payload.locationType !== "onsite") {
    findings.push({
      code: "REMOTE_EXCLUDED",
      class: "hard_blocker",
      message: "Beta excludes remote and multi-state jobs.",
      field: "locationType",
    });
  }

  if (input.payMinCents <= 0 || input.payMaxCents < input.payMinCents) {
    findings.push({
      code: "PAY_RANGE_REQUIRED",
      class: "hard_blocker",
      message: "Approved minimum/maximum pay range is required for every published role.",
      field: "pay",
    });
  }

  if (input.requirements.length === 0) {
    findings.push({
      code: "REQUIREMENTS_MISSING",
      class: "hard_blocker",
      message: "At least one approved requirement version is required.",
    });
  }

  for (const req of input.requirements) {
    if (!req.proxyReviewed) {
      findings.push({
        code: "PROXY_REVIEW_REQUIRED",
        class: "hard_blocker",
        message: `Requirement lacks protected-proxy review: ${req.essentialFunction}`,
      });
    }
  }

  if (input.payload.description.length < 80) {
    findings.push({
      code: "DESCRIPTION_THIN",
      class: "required_human_action",
      message: "Expand the description for conversion readiness and clarity.",
      field: "description",
    });
  }

  if (!input.jurisdictionPack.startsWith("us-ny")) {
    findings.push({
      code: "JURISDICTION_NOT_ENABLED",
      class: "hard_blocker",
      message: "Only allowlisted New York jurisdiction packs may publish in beta.",
      field: "jurisdiction",
    });
  }

  if (input.payload.locale !== "en") {
    findings.push({
      code: "LOCALE_NOT_ENABLED",
      class: "hard_blocker",
      message: "Beta publishes English only until a Spanish parity release.",
      field: "locale",
    });
  }

  const hardBlockerCount = findings.filter((f) => f.class === "hard_blocker").length;
  return {
    findings,
    hardBlockerCount,
    reviewReady: hardBlockerCount === 0,
  };
}
