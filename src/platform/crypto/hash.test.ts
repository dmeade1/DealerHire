import { afterEach, describe, expect, it } from "vitest";
import { hashCapability, openEnvelope, sealEnvelope } from "./hash";

const originalBinding = process.env.ACCEPTANCE_ENVELOPE_BINDING;
const originalSecret = process.env.CAPABILITY_SECRET;

afterEach(() => {
  process.env.ACCEPTANCE_ENVELOPE_BINDING = originalBinding;
  process.env.CAPABILITY_SECRET = originalSecret;
});

describe("crypto fail-closed", () => {
  it("requires CAPABILITY_SECRET", () => {
    delete process.env.CAPABILITY_SECRET;
    expect(() => hashCapability("raw")).toThrow(/CAPABILITY_SECRET/);
  });

  it("blocks insecure envelope sealing outside local binding", () => {
    process.env.ACCEPTANCE_ENVELOPE_BINDING = "kms";
    expect(() => sealEnvelope({ a: 1 })).toThrow(/ACCEPTANCE_ENVELOPE_BINDING=local/);
  });

  it("allows local stand-in encode/decode only", () => {
    process.env.ACCEPTANCE_ENVELOPE_BINDING = "local";
    const sealed = sealEnvelope({ synthetic: true });
    expect(openEnvelope(sealed)).toEqual({ synthetic: true });
  });
});
