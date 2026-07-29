import type { ReactNode } from "react";
import { forbidden, unauthorized } from "next/navigation";
import { AuthError, resolveRequestActor } from "@/platform/auth/guard";
import { assertSurfaceRole } from "@/platform/auth/actor";

/**
 * Ops shell: authenticated ops role + platform_control or hiring_operations purpose.
 * Destructive actions (kill switch) re-check ops.pause via assertOpsHttpAuth.
 */
export default async function OpsLayout({ children }: { children: ReactNode }) {
  try {
    const ctx = await resolveRequestActor("ops");
    assertSurfaceRole(ctx, "ops");
    if (ctx.purpose !== "platform_control" && ctx.purpose !== "hiring_operations") {
      throw new AuthError(`purpose not allowed: ${ctx.purpose}`, 403);
    }
  } catch (err) {
    if (err instanceof AuthError && err.status === 403) forbidden();
    unauthorized();
  }
  return children;
}
