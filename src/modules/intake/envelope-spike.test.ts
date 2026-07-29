import { describe, expect, it } from "vitest";
import {
  createDurableObjectSpikeStore,
  createR2D1SpikeStore,
  proveEnvelopeSpikeContract,
} from "./envelope-spike";

describe("envelope provider spike contracts (G2-02 harness)", () => {
  it("Durable Object shape: conditional insert, replay, fail-closed", async () => {
    const proof = await proveEnvelopeSpikeContract(createDurableObjectSpikeStore());
    expect(proof.conditionalInsert).toBe(true);
    expect(proof.idempotentReplay).toBe(true);
    expect(proof.failClosed).toBe(true);
  });

  it("R2 + D1 shape: conditional insert, replay, fail-closed", async () => {
    const proof = await proveEnvelopeSpikeContract(createR2D1SpikeStore());
    expect(proof.conditionalInsert).toBe(true);
    expect(proof.idempotentReplay).toBe(true);
    expect(proof.failClosed).toBe(true);
  });
});
