import type { ReactNode } from "react";
import { forbidden, unauthorized } from "next/navigation";
import { AuthError, resolveRequestActor } from "@/platform/auth/guard";
import { assertSurfaceRole } from "@/platform/auth/actor";

/**
 * Dealer shell: authenticated hiring_operations dealer role only.
 * Page-level routes call requireActor with a specific capability (no tree-wide OR).
 */
export default async function DealerLayout({ children }: { children: ReactNode }) {
  try {
    const ctx = await resolveRequestActor("dealer");
    assertSurfaceRole(ctx, "dealer");
    if (ctx.purpose !== "hiring_operations") {
      throw new AuthError(`purpose not allowed: ${ctx.purpose}`, 403);
    }
  } catch (err) {
    if (err instanceof AuthError && err.status === 403) forbidden();
    unauthorized();
  }
  return children;
}
