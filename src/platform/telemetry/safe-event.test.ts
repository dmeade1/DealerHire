import { describe, expect, it } from "vitest";
import { assertSafeTelemetryEvent, emitSafeEvent } from "./safe-event";

describe("safe telemetry (INV-37 / G1-11)", () => {
  it("accepts ID/hash/status events", () => {
    expect(() =>
      assertSafeTelemetryEvent({
        name: "intake.accepted",
        tenantId: "00000000-0000-4000-8000-000000000001",
        publicApplicationId: "app_x",
        status: "accepted",
        hashes: { notice: "abc" },
        meta: { synthetic: true },
      }),
    ).not.toThrow();
  });

  it("rejects raw PII keys and email-like values", () => {
    expect(() =>
      assertSafeTelemetryEvent({
        name: "intake.accepted",
        email: "ada@example.com",
      } as never),
    ).toThrow(/telemetry_pii_rejected/);

    expect(() =>
      assertSafeTelemetryEvent({
        name: "intake.accepted",
        meta: { note: "reach ada@example.com" },
      }),
    ).toThrow(/email-like/);
  });

  it("emitSafeEvent writes only after assert", () => {
    expect(() =>
      emitSafeEvent({
        name: "command.needs_reconciliation",
        commandId: "00000000-0000-4000-8000-000000000099",
        status: "needs_reconciliation",
      }),
    ).not.toThrow();
  });
});
