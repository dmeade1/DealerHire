import { NextResponse } from "next/server";
import { contentAddress } from "@/platform/crypto/hash";
import { isIntakeConfigured, issueAcceptanceReceipt } from "@/modules/intake/submit";

const SYNTHETIC_TENANT =
  process.env.SYNTHETIC_TENANT_ID ?? "00000000-0000-4000-8000-000000000001";
const SYNTHETIC_ROOFTOP =
  process.env.SYNTHETIC_ROOFTOP_ID ?? "00000000-0000-4000-8000-000000000002";
const SYNTHETIC_JCV =
  process.env.SYNTHETIC_JOB_CONTROL_VERSION_ID ?? "00000000-0000-4000-8000-00000000000a";

/**
 * Local/demo apply POST — delegates to the sole receipt authority (issueAcceptanceReceipt).
 * INV-11: accepted:true only after ApplicationAcceptanceEnvelope conditional insert.
 * Production intake prefers intake-api Worker; this route must not invent a second receipt path.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const idempotencyKey = String(form.get("idempotencyKey") || "");
  const fullName = String(form.get("fullName") || "");
  const email = String(form.get("email") || "");
  const phone = String(form.get("phone") || "");
  const workHistory = String(form.get("workHistory") || "");
  const jobControlVersionId = String(form.get("jobControlVersionId") || SYNTHETIC_JCV);
  const noticeTerms = form.get("notice_application_terms");
  const noticePrivacy = form.get("notice_privacy");
  const resume = form.get("resume");

  if (!idempotencyKey || !fullName || !email || !noticeTerms || !noticePrivacy) {
    return NextResponse.json(
      { accepted: false, error: "incomplete_application" },
      { status: 400 },
    );
  }

  if (!isIntakeConfigured()) {
    return NextResponse.json(
      {
        accepted: false,
        error: "intake_not_ready",
        message:
          "No receipt was issued. Application acceptance requires a durable ApplicationAcceptanceEnvelope insert. Retry when intake is enabled; your submission was not accepted.",
      },
      { status: 503 },
    );
  }

  const resumePresent = resume instanceof File && resume.size > 0;
  // Pass raw contact once; issueAcceptanceReceipt → normalizeG1 fingerprints server-side.
  const result = await issueAcceptanceReceipt({
    tenantId: SYNTHETIC_TENANT,
    rooftopId: SYNTHETIC_ROOFTOP,
    jobControlVersionId,
    idempotencyKey,
    structuredPayload: {
      synthetic: true,
      label: "SYNTHETIC",
      contact: { fullName, email, phone },
      workHistory,
    },
    noticeHashes: {
      "notice.app_terms.en.v1": contentAddress("notice.app_terms.en.v1"),
      "notice.privacy.en.v1": contentAddress("notice.privacy.en.v1"),
    },
    choiceHashes: {
      perm_email_transactional: contentAddress(
        form.get("perm_email_transactional") ? "granted" : "absent",
      ),
      perm_recruiting_optional: contentAddress(
        form.get("perm_recruiting_optional") ? "granted" : "absent",
      ),
    },
    jurisdictionSnapshot: { pack: "us-ny-state", synthetic: true },
    communicationAuthority: {
      emailTransactional: Boolean(form.get("perm_email_transactional")),
      recruitingOptional: Boolean(form.get("perm_recruiting_optional")),
    },
    resumeState: resumePresent ? "pending_upload" : "none",
  });

  if (!result.accepted) {
    return NextResponse.json(
      {
        accepted: false,
        error: result.error,
        message: result.message,
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      accepted: true,
      publicApplicationId: result.publicApplicationId,
      resumeState: result.resumeState,
      idempotentReplay: result.idempotentReplay ?? false,
      message:
        result.resumeState === "pending_upload"
          ? "Application accepted. Resume is pending upload/scan and does not block your receipt."
          : "Application accepted.",
      accessHint: "A magic link will be emailed for corrections and status (step-up required).",
      // One-time capability for accountless access — not logged by this handler.
      magicCapability: result.magicCapability,
    },
    { status: result.idempotentReplay ? 200 : 201 },
  );
}
