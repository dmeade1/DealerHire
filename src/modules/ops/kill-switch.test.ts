import { afterEach, describe, expect, it } from "vitest";
import { assertOpsControlSecret, KILL_SWITCH_SCOPES } from "./kill-switch";

describe("kill switch scopes", () => {
  it("covers intake, campaigns, and all_execution", () => {
    expect(KILL_SWITCH_SCOPES).toEqual(["intake", "campaigns", "all_execution"]);
  });
});

describe("ops control secret gate", () => {
  const prev = process.env.OPS_CONTROL_SECRET;

  afterEach(() => {
    if (prev === undefined) delete process.env.OPS_CONTROL_SECRET;
    else process.env.OPS_CONTROL_SECRET = prev;
  });

  it("fails closed when secret is unconfigured", () => {
    delete process.env.OPS_CONTROL_SECRET;
    expect(() => assertOpsControlSecret("anything")).toThrow(/ops_control_secret_unconfigured/);
  });

  it("rejects mismatch and accepts exact match", () => {
    process.env.OPS_CONTROL_SECRET = "local-ops-secret";
    expect(() => assertOpsControlSecret("wrong")).toThrow(/ops_control_unauthorized/);
    expect(() => assertOpsControlSecret("local-ops-secret")).not.toThrow();
  });
});
