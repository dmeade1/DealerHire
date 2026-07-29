import { headers } from "next/headers";
import {
  assertActorAuthorized,
  assertSurfaceRole,
  requireActorFromHeaders,
  resolveActor,
} from "@/platform/auth/actor";
import type { Purpose } from "@/platform/auth/context";

export {
  AuthError,
  assertActorAuthorized,
  assertAuthModeCeiling,
  assertSurfaceRole,
  mintSignedActor,
  requireActorFromHeaders,
  resolveActor,
  verifySignedActor,
} from "@/platform/auth/actor";

export async function resolveRequestActor(kind: "dealer" | "ops" = "dealer") {
  const h = await headers();
  return resolveActor(kind, h.get("x-dh-actor"), h.get("x-dh-actor-sig"));
}

export async function requireActor(input: {
  capability: string | string[];
  purpose?: Purpose | Purpose[];
  kind?: "dealer" | "ops";
  actorToken?: string | null;
  actorSignature?: string | null;
  headerBag?: Headers;
}) {
  const kind = input.kind ?? "dealer";
  if (input.headerBag || input.actorToken != null || input.actorSignature != null) {
    return requireActorFromHeaders(input.headerBag ?? new Headers(), { ...input, kind });
  }
  const ctx = await resolveRequestActor(kind);
  assertSurfaceRole(ctx, kind);
  return assertActorAuthorized(ctx, input);
}
