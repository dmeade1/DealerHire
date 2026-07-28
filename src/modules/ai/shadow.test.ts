import { describe, expect, it } from "vitest";
import { assertShadowInaccessibleToDecisionMakers } from "./shadow";

describe("shadow AI isolation", () => {
  it("rejects reviewer destinations", () => {
    expect(() =>
      assertShadowInaccessibleToDecisionMakers(["reviewer_ui"]),
    ).toThrow(/shadow AI/);
  });

  it("allows empty sealed destinations", () => {
    expect(() => assertShadowInaccessibleToDecisionMakers([])).not.toThrow();
  });
});
