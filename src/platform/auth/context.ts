import { z } from "zod";

export const PurposeSchema = z.enum([
  "hiring_operations",
  "subject_permission",
  "publication_disclosure",
  "platform_control",
]);

export type Purpose = z.infer<typeof PurposeSchema>;

export const ActorContextSchema = z.object({
  actorSubjectRef: z.string().min(1),
  tenantId: z.string().uuid(),
  rooftopId: z.string().uuid().optional(),
  purpose: PurposeSchema,
  role: z.enum([
    "dealer_hr_owner",
    "hiring_manager",
    "trained_reviewer",
    "dealer_admin",
    "concierge_operator",
    "recovery_operator",
    "system",
  ]),
  delegationId: z.string().uuid().optional(),
  onBehalfOf: z.string().optional(),
  capabilities: z.array(z.string()).default([]),
  sessionId: z.string().min(1),
  expiresAt: z.string().datetime(),
});

export type ActorContext = z.infer<typeof ActorContextSchema>;

export function assertNotExpired(ctx: ActorContext, now = new Date()): void {
  if (new Date(ctx.expiresAt).getTime() <= now.getTime()) {
    throw new Error("actor context expired");
  }
}

export function assertCapability(ctx: ActorContext, capability: string): void {
  if (ctx.role === "system") return;
  if (!ctx.capabilities.includes(capability) && !roleImplies(ctx.role, capability)) {
    throw new Error(`missing capability: ${capability}`);
  }
}

const ROLE_CAPS: Record<string, string[]> = {
  dealer_hr_owner: [
    "listing.write",
    "requirement.approve",
    "pay.approve",
    "rubric.approve",
    "publication.approve",
    "application.review",
    "analytics.read",
  ],
  hiring_manager: ["listing.write", "analytics.read"],
  trained_reviewer: ["application.review", "decision.record", "analytics.read"],
  dealer_admin: ["team.manage", "integration.manage", "analytics.read"],
  concierge_operator: ["listing.write", "campaign.import", "ops.inspect", "analytics.read"],
  recovery_operator: ["ops.inspect", "ops.replay", "ops.pause"],
  system: ["*"],
};

function roleImplies(role: string, capability: string): boolean {
  const caps = ROLE_CAPS[role] ?? [];
  return caps.includes("*") || caps.includes(capability);
}
