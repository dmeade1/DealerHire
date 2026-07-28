import { NextResponse } from "next/server";
import { contentAddress } from "@/platform/crypto/hash";

/**
 * Control-plane-adjacent application POST for local demo.
 * Production intake prefers the dedicated intake-api Worker + acceptance envelope.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const idempotencyKey = String(form.get("idempotencyKey") || "");
  const fullName = String(form.get("fullName") || "");
  const email = String(form.get("email") || "");
  const noticeTerms = form.get("notice_application_terms");
  const noticePrivacy = form.get("notice_privacy");
  const resume = form.get("resume");

  if (!idempotencyKey || !fullName || !email || !noticeTerms || !noticePrivacy) {
    return NextResponse.json({ error: "incomplete_application" }, { status: 400 });
  }

  const resumePresent = resume instanceof File && resume.size > 0;
  const publicApplicationId = `app_${contentAddress(idempotencyKey).slice(0, 16)}`;

  return NextResponse.json(
    {
      accepted: true,
      publicApplicationId,
      resumeState: resumePresent ? "pending_upload" : "none",
      message: resumePresent
        ? "Application accepted. Resume is pending upload/scan and does not block your receipt."
        : "Application accepted.",
      accessHint: "A magic link will be emailed for corrections and status (step-up required).",
    },
    { status: 201 },
  );
}
