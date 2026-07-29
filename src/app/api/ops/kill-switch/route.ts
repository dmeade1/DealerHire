import { NextResponse } from "next/server";
import {
  applyKillSwitch,
  assertOpsControlSecret,
  opsControlSecretFromRequest,
  readKillSwitches,
} from "@/modules/ops/kill-switch";

function unauthorized(detail: string, extras: Record<string, unknown> = {}) {
  const status = detail === "ops_control_secret_unconfigured" ? 503 : 401;
  return NextResponse.json(
    {
      ...extras,
      error: detail,
      message:
        detail === "ops_control_secret_unconfigured"
          ? "No ops control applied. OPS_CONTROL_SECRET must be configured."
          : "No ops control applied. Valid OPS_CONTROL_SECRET required.",
    },
    { status },
  );
}

export async function GET(request: Request) {
  try {
    assertOpsControlSecret(opsControlSecretFromRequest(request));
  } catch (err) {
    return unauthorized(err instanceof Error ? err.message : "ops_control_unauthorized");
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
  let actorSubjectRef = "ops:web";
  let presentedSecret: string | null = null;

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    scope = String(body.scope ?? scope);
    reason = String(body.reason ?? "");
    paused = body.paused === undefined ? true : Boolean(body.paused);
    actorSubjectRef = String(body.actorSubjectRef ?? actorSubjectRef);
    presentedSecret =
      typeof body.opsControlSecret === "string" ? body.opsControlSecret : null;
  } else {
    const form = await request.formData();
    scope = String(form.get("scope") || scope);
    reason = String(form.get("reason") || "");
    paused = String(form.get("paused") || "true") !== "false";
    actorSubjectRef = String(form.get("actorSubjectRef") || actorSubjectRef);
    presentedSecret = String(form.get("opsControlSecret") || "") || null;
  }

  try {
    assertOpsControlSecret(opsControlSecretFromRequest(request, presentedSecret));
  } catch (err) {
    const detail = err instanceof Error ? err.message : "ops_control_unauthorized";
    return unauthorized(detail, { paused: false });
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
      actorSubjectRef,
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
