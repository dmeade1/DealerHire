import { NextResponse } from "next/server";
import { applyKillSwitch, readKillSwitches } from "@/modules/ops/kill-switch";
import {
  assertOpsHttpAuth,
  opsAuthErrorResponse,
  opsAuthFailureDetail,
} from "@/modules/ops/http-auth";

export async function GET(request: Request) {
  try {
    assertOpsHttpAuth(request, "ops.inspect");
  } catch (err) {
    const { body, status } = opsAuthErrorResponse(opsAuthFailureDetail(err));
    return NextResponse.json(body, { status });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "kill_switch_unavailable", message: "DATABASE_URL required for durable readback" },
      { status: 503 },
    );
  }
  try {
    const switches = await readKillSwitches();
    return NextResponse.json({ switches });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "kill_switch_read_failed", message: detail },
      { status: 500 },
    );
  }
}

/**
 * Persist emergency pause/resume and return durable readback (INV-51).
 * Never reports paused=true unless the row was written and re-read.
 */
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        paused: false,
        error: "kill_switch_unavailable",
        message: "No durable pause applied. DATABASE_URL required.",
      },
      { status: 503 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let scope = "all_execution";
  let reason = "";
  let paused = true;
  let presentedSecret: string | null = null;
  let actorToken: string | null = null;
  let actorSignature: string | null = null;

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    scope = String(body.scope ?? scope);
    reason = String(body.reason ?? "");
    paused = body.paused === undefined ? true : Boolean(body.paused);
    presentedSecret =
      typeof body.opsControlSecret === "string" ? body.opsControlSecret : null;
    actorToken = typeof body.actorToken === "string" ? body.actorToken : null;
    actorSignature = typeof body.actorSignature === "string" ? body.actorSignature : null;
  } else {
    const form = await request.formData();
    scope = String(form.get("scope") || scope);
    reason = String(form.get("reason") || "");
    paused = String(form.get("paused") || "true") !== "false";
    presentedSecret = String(form.get("opsControlSecret") || "") || null;
    actorToken = String(form.get("actorToken") || "") || null;
    actorSignature = String(form.get("actorSignature") || "") || null;
  }

  let actor;
  try {
    actor = assertOpsHttpAuth(request, "ops.pause", {
      presentedSecret,
      actorToken,
      actorSignature,
    });
  } catch (err) {
    const { body, status } = opsAuthErrorResponse(opsAuthFailureDetail(err), {
      paused: false,
    });
    return NextResponse.json(body, { status });
  }

  if (!reason.trim()) {
    return NextResponse.json(
      { paused: false, error: "reason_required", message: "No durable pause applied." },
      { status: 400 },
    );
  }

  try {
    const state = await applyKillSwitch({
      scope,
      paused,
      reason,
      // Bound to verified actor only — never trust body/form spoofing.
      actorSubjectRef: actor.actorSubjectRef,
    });
    return NextResponse.json({
      paused: state.paused,
      scope: state.scope,
      reason: state.reason,
      actorSubjectRef: state.actorSubjectRef,
      updatedAt: state.updatedAt,
      durable: true,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      {
        paused: false,
        error: "kill_switch_persist_failed",
        message: `No durable pause applied (${detail}).`,
      },
      { status: 500 },
    );
  }
}
