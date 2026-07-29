import { describe, expect, it } from "vitest";
import { resolvePublicJobSlug } from "./slugs";

describe("public job slugs", () => {
  it("resolves demo to synthetic tenant/JCV", () => {
    const resolved = resolvePublicJobSlug("Demo");
    expect(resolved?.slug).toBe("demo");
    expect(resolved?.jobControlVersionId).toMatch(
      /^00000000-0000-4000-8000-00000000000a$/,
    );
  });

  it("returns null for unknown slugs", () => {
    expect(resolvePublicJobSlug("nope")).toBeNull();
  });
});
