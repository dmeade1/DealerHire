import { afterEach, describe, expect, it } from "vitest";
import {
  assertAuthModeCeiling,
  mintSignedActor,
  requireActorFromHeaders,
  verifySignedActor,
} from "./actor";
import type { ActorContext } from "./context";

const secret = "test-only-capability-secret";

function sampleActor(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    actorSubjectRef: "synthetic:tester",
    tenantId: "00000000-0000-4000-8000-000000000001",
    rooftopId: "00000000-0000-4000-8000-000000000002",
    purpose: "hiring_operations",
    role: "dealer_hr_owner",
    capabilities: [],
    sessionId: "s1",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ...overrides,
  };
}

describe("signed actor mint/verify", () => {
  it("round-trips a valid actor", () => {
    const { token, signature } = mintSignedActor(sampleActor(), secret);
    const ctx = verifySignedActor(token, signature, secret);
    expect(ctx.actorSubjectRef).toBe("synthetic:tester");
    expect(ctx.role).toBe("dealer_hr_owner");
  });

  it("rejects tampered tokens", () => {
    const { token, signature } = mintSignedActor(sampleActor(), secret);
    expect(() => verifySignedActor(token.slice(0, -1) + "x", signature, secret)).toThrow(
      /invalid actor/,
    );
  });

  it("rejects expired actors", () => {
    const { token, signature } = mintSignedActor(
      sampleActor({ expiresAt: new Date(Date.now() - 1000).toISOString() }),
      secret,
    );
    expect(() => verifySignedActor(token, signature, secret)).toThrow(/expired/);
  });

  it("accepts actor token overrides from form-style headers bag", () => {
    const ops = sampleActor({
      purpose: "platform_control",
      role: "recovery_operator",
    });
    const { token, signature } = mintSignedActor(ops, secret);
    const ctx = requireActorFromHeaders(new Headers(), {
      kind: "ops",
      purpose: "platform_control",
      capability: "ops.pause",
      actorToken: token,
      actorSignature: signature,
    });
    expect(ctx.role).toBe("recovery_operator");
  });
});

describe("assertAuthModeCeiling", () => {
  const env = process.env as Record<string, string | undefined>;
  const prev = {
    mode: env.DH_AUTH_MODE,
    node: env.NODE_ENV,
    allow: env.ALLOW_HMAC_ACTOR_IN_PRODUCTION,
    issuer: env.IDENTITY_ISSUER,
  };

  afterEach(() => {
    if (prev.mode === undefined) delete env.DH_AUTH_MODE;
    else env.DH_AUTH_MODE = prev.mode;
    if (prev.node === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = prev.node;
    if (prev.allow === undefined) delete env.ALLOW_HMAC_ACTOR_IN_PRODUCTION;
    else env.ALLOW_HMAC_ACTOR_IN_PRODUCTION = prev.allow;
    if (prev.issuer === undefined) delete env.IDENTITY_ISSUER;
    else env.IDENTITY_ISSUER = prev.issuer;
  });

  it("allows hmac-g1 outside production", () => {
    env.DH_AUTH_MODE = "hmac-g1";
    env.NODE_ENV = "test";
    expect(() => assertAuthModeCeiling()).not.toThrow();
  });

  it("blocks hmac-g1 in production without explicit allow", () => {
    env.DH_AUTH_MODE = "hmac-g1";
    env.NODE_ENV = "production";
    delete env.ALLOW_HMAC_ACTOR_IN_PRODUCTION;
    expect(() => assertAuthModeCeiling()).toThrow(/hmac_actor_blocked_in_production/);
  });

  it("fails closed for idp until session mapping is wired", () => {
    env.DH_AUTH_MODE = "idp";
    env.IDENTITY_ISSUER = "https://issuer.example";
    expect(() => assertAuthModeCeiling()).toThrow(/identity_provider_not_wired/);
  });
});
