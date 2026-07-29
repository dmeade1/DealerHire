import { createHmac, timingSafeEqual } from "node:crypto";
import {
  ActorContextSchema,
  assertCapability,
  assertNotExpired,
  type ActorContext,
  type Purpose,
} from "@/platform/auth/context";
import { requireCapabilitySecret } from "@/platform/crypto/hash";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/**
 * G1 auth ceiling:
 * - `hmac-g1` (default outside production): signed x-dh-actor HMAC stand-in
 * - `idp` (default in production): requires IDENTITY_ISSUER; verification not wired → fail closed
 * Production HMAC only with explicit ALLOW_HMAC_ACTOR_IN_PRODUCTION=true (skeleton preview).
 */
export function assertAuthModeCeiling(): void {
  const mode =
    process.env.DH_AUTH_MODE ??
    (process.env.NODE_ENV === "production" ? "idp" : "hmac-g1");

  if (mode === "hmac-g1") {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_HMAC_ACTOR_IN_PRODUCTION !== "true"
    ) {
      throw new AuthError(
        "hmac_actor_blocked_in_production (set DH_AUTH_MODE=idp + IDENTITY_ISSUER, or ALLOW_HMAC_ACTOR_IN_PRODUCTION=true for G1 preview only)",
        503,
      );
    }
    return;
  }

  if (mode === "idp") {
    if (!process.env.IDENTITY_ISSUER) {
      throw new AuthError(
        "identity_provider_required (IDENTITY_ISSUER unset; IdP not Selected — G1 ceiling)",
        503,
      );
    }
    // Selected IdP session mapping is not implemented yet — fail closed rather than fake auth.
    throw new AuthError(
      "identity_provider_not_wired (IDENTITY_ISSUER set but session mapping pending IdP selection)",
      503,
    );
  }

  throw new AuthError(`unknown_auth_mode: ${mode}`, 503);
}

const DEALER_ROLES = new Set([
  "dealer_hr_owner",
  "hiring_manager",
  "trained_reviewer",
  "dealer_admin",
  "concierge_operator",
]);

const OPS_ROLES = new Set(["recovery_operator", "concierge_operator", "system"]);

export function assertSurfaceRole(ctx: ActorContext, kind: "dealer" | "ops"): void {
  if (ctx.role === "system") return;
  if (kind === "dealer" && !DEALER_ROLES.has(ctx.role)) {
    throw new AuthError(`role not allowed on dealer surface: ${ctx.role}`, 403);
  }
  if (kind === "ops" && !OPS_ROLES.has(ctx.role)) {
    throw new AuthError(`role not allowed on ops surface: ${ctx.role}`, 403);
  }
}

function signActorPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function mintSignedActor(
  ctx: ActorContext,
  secret = process.env.CAPABILITY_SECRET,
): { token: string; signature: string } {
  const payload = Buffer.from(JSON.stringify(ctx), "utf8").toString("base64url");
  const signature = signActorPayload(payload, requireCapabilitySecret(secret));
  return { token: payload, signature };
}

export function verifySignedActor(
  token: string,
  signature: string,
  secret = process.env.CAPABILITY_SECRET,
): ActorContext {
  const expected = signActorPayload(token, requireCapabilitySecret(secret));
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new AuthError("invalid actor signature");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
  } catch {
    throw new AuthError("invalid actor token");
  }
  const ctx = ActorContextSchema.parse(parsed);
  assertNotExpired(ctx);
  return ctx;
}

function syntheticDevActor(): ActorContext | null {
  if (process.env.ALLOW_UNSIGNED_SYNTHETIC_ACTOR !== "true") return null;
  if (process.env.NODE_ENV === "production") return null;
  const tenantId = process.env.SYNTHETIC_TENANT_ID;
  const rooftopId = process.env.SYNTHETIC_ROOFTOP_ID;
  if (!tenantId || !rooftopId) return null;
  return {
    actorSubjectRef: "synthetic:dev-actor",
    tenantId,
    rooftopId,
    purpose: "hiring_operations",
    role: "dealer_hr_owner",
    capabilities: [],
    sessionId: "synthetic-dev-session",
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}

function syntheticOpsActor(): ActorContext | null {
  if (process.env.ALLOW_UNSIGNED_SYNTHETIC_ACTOR !== "true") return null;
  if (process.env.NODE_ENV === "production") return null;
  const tenantId = process.env.SYNTHETIC_TENANT_ID;
  const rooftopId = process.env.SYNTHETIC_ROOFTOP_ID;
  if (!tenantId || !rooftopId) return null;
  return {
    actorSubjectRef: "synthetic:dev-ops",
    tenantId,
    rooftopId,
    purpose: "platform_control",
    role: "recovery_operator",
    capabilities: [],
    sessionId: "synthetic-dev-ops-session",
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}

/** Resolve actor from explicit token/sig (Workers, form posts) without next/headers. */
export function resolveActor(
  kind: "dealer" | "ops" = "dealer",
  token?: string | null,
  signature?: string | null,
): ActorContext {
  assertAuthModeCeiling();
  if (token && signature) {
    return verifySignedActor(token, signature);
  }
  const fallback = kind === "ops" ? syntheticOpsActor() : syntheticDevActor();
  if (fallback) return fallback;
  throw new AuthError("missing signed actor context (x-dh-actor + x-dh-actor-sig)");
}

export function assertActorAuthorized(
  ctx: ActorContext,
  input: {
    capability: string | string[];
    purpose?: Purpose | Purpose[];
  },
): ActorContext {
  if (input.purpose) {
    const allowed = Array.isArray(input.purpose) ? input.purpose : [input.purpose];
    if (!allowed.includes(ctx.purpose)) {
      throw new AuthError(`purpose not allowed: ${ctx.purpose}`, 403);
    }
  }
  const caps = Array.isArray(input.capability) ? input.capability : [input.capability];
  let lastErr: Error | undefined;
  for (const cap of caps) {
    try {
      assertCapability(ctx, cap);
      return ctx;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw new AuthError(lastErr?.message ?? "missing capability", 403);
}

export function requireActorFromHeaders(
  headerBag: Headers,
  input: {
    capability: string | string[];
    purpose?: Purpose | Purpose[];
    kind?: "dealer" | "ops";
    /** Optional body/form overrides when browsers cannot set custom headers. */
    actorToken?: string | null;
    actorSignature?: string | null;
  },
): ActorContext {
  const kind = input.kind ?? "dealer";
  const token = input.actorToken ?? headerBag.get("x-dh-actor");
  const signature = input.actorSignature ?? headerBag.get("x-dh-actor-sig");
  const ctx = resolveActor(kind, token, signature);
  assertSurfaceRole(ctx, kind);
  return assertActorAuthorized(ctx, input);
}
