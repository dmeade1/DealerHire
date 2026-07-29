import { describe, expect, it } from "vitest";
import { conditionalInsertEnvelope } from "./envelope-do";

describe("ApplicationAcceptanceEnvelope DO conditional insert", () => {
  it("inserts once and replays the same receipt", () => {
    const input = {
      tenantId: "00000000-0000-4000-8000-000000000001",
      idempotencyKey: "idem-1",
      publicApplicationId: "app_one",
      ciphertext: "sealed",
    };
    const first = conditionalInsertEnvelope({}, input);
    expect(first.result.accepted).toBe(true);
    if (!first.result.accepted) return;
    expect(first.result.idempotentReplay).toBe(false);

    const second = conditionalInsertEnvelope(first.next, {
      ...input,
      publicApplicationId: "app_should_not_win",
    });
    expect(second.result.accepted).toBe(true);
    if (!second.result.accepted) return;
    expect(second.result.idempotentReplay).toBe(true);
    expect(second.result.publicApplicationId).toBe("app_one");
  });

  it("rejects key mismatch on occupied storage", () => {
    const seeded = conditionalInsertEnvelope(
      {},
      {
        tenantId: "t1",
        idempotencyKey: "k1",
        publicApplicationId: "app_a",
        ciphertext: "x",
      },
    );
    const clash = conditionalInsertEnvelope(seeded.next, {
      tenantId: "t2",
      idempotencyKey: "k2",
      publicApplicationId: "app_b",
      ciphertext: "y",
    });
    expect(clash.result.accepted).toBe(false);
  });
});
