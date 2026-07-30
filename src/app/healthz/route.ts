import { NextResponse } from "next/server";

/**
 * Local / Next liveness (IA healthz). No PII. DB presence is advisory only.
 * Worker stubs expose `/health` separately for G1-02 preview deploys.
 */
export function GET() {
  const databaseConfigured = Boolean(
    process.env.DATABASE_URL || process.env.DATABASE_URL_ADMIN,
  );
  return NextResponse.json({
    ok: true,
    service: "platform-web-next",
    candidateAiMode: process.env.CANDIDATE_AI_MODE ?? "shadow",
    adActuationEnabled: process.env.AD_ACTUATION_ENABLED === "true",
    databaseConfigured,
  });
}
