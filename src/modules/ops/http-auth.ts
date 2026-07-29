import {
  assertOpsControlSecret,
  opsControlSecretFromRequest,
} from "@/modules/ops/kill-switch";
import { AuthError, requireActorFromHeaders } from "@/platform/auth/actor";
import type { ActorContext } from "@/platform/auth/context";

export function assertOpsHttpAuth(
  request: Request,
  capability: "ops.inspect" | "ops.pause",
  options?: {
    presentedSecret?: string | null;
    actorToken?: string | null;
    actorSignature?: string | null;
  },
): ActorContext {
  assertOpsControlSecret(
    opsControlSecretFromRequest(request, options?.presentedSecret),
  );
  return requireActorFromHeaders(request.headers, {
    kind: "ops",
    purpose: ["platform_control", "hiring_operations"],
    capability,
    actorToken: options?.actorToken,
    actorSignature: options?.actorSignature,
  });
}

export function opsAuthErrorResponse(
  detail: string,
  extras: Record<string, unknown> = {},
): { body: Record<string, unknown>; status: number } {
  const status =
    detail === "ops_control_secret_unconfigured"
      ? 503
      : detail.startsWith("missing capability") || detail.includes("purpose not allowed")
        ? 403
        : 401;
  return {
    status,
    body: {
      ...extras,
      error: detail,
      message:
        detail === "ops_control_secret_unconfigured"
          ? "No ops control applied. OPS_CONTROL_SECRET must be configured."
          : "No ops control applied. Valid OPS_CONTROL_SECRET and signed ops actor required.",
    },
  };
}

export function opsAuthFailureDetail(err: unknown): string {
  if (err instanceof AuthError) return err.message;
  if (err instanceof Error) return err.message;
  return "ops_control_unauthorized";
}
