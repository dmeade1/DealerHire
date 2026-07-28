import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRACKER_POLICY,
  assertPageAllowsThirdPartyScripts,
  filterServerEvent,
} from "./policy";

describe("tracker policy", () => {
  it("forbids third-party scripts on application pages", () => {
    expect(() =>
      assertPageAllowsThirdPartyScripts("application", {
        ...DEFAULT_TRACKER_POLICY,
        thirdPartyScriptsAllowed: true,
      }),
    ).toThrow();
  });

  it("strips tokens and honors GPC", () => {
    const filtered = filterServerEvent(
      "application_accepted",
      { applicationToken: "secret", path: "/apply" },
      DEFAULT_TRACKER_POLICY,
      true,
    );
    expect(filtered).toEqual({ eventName: "application_accepted", bucket: "unattributed" });
  });
});
