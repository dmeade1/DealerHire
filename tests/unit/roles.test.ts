import { describe, expect, it } from "vitest";
import { ROLE_CATALOG, allRolesAccepted, betaBlockedReason } from "@/modules/roles/catalog";

describe("role catalog gate", () => {
  it("blocks beta until every family is accepted", () => {
    expect(allRolesAccepted()).toBe(false);
    expect(betaBlockedReason()).toMatch(/Beta blocked/);
    expect(ROLE_CATALOG.length).toBeGreaterThanOrEqual(10);
  });
});
