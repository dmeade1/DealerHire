/**
 * In-memory contract spike for independent ApplicationAcceptanceEnvelope stores (G2-02).
 * Proves conditional-insert / idempotency / fail-closed semantics for DO-shaped and R2+D1-shaped
 * adapters before a Cloudflare deploy selection.
 *
 * Not a production receipt path — interim Postgres remains G1 authority (ADR 0004).
 */

export type SpikeReceipt = {
  accepted: true;
  publicApplicationId: string;
  envelopeId: string;
  idempotentReplay: boolean;
};

export type SpikeDenial = {
  accepted: false;
  error: string;
};

export type SpikeResult = SpikeReceipt | SpikeDenial;

export type SpikeEnvelopeInput = {
  tenantId: string;
  idempotencyKey: string;
  publicApplicationId: string;
  ciphertext: string;
};

export interface EnvelopeSpikeStore {
  readonly name: "durable_object" | "r2_d1";
  insertConditional(input: SpikeEnvelopeInput): Promise<SpikeResult>;
  getByIdempotency(tenantId: string, idempotencyKey: string): Promise<SpikeReceipt | null>;
  /** Simulate binding missing — must never yield accepted:true. */
  setAvailable(available: boolean): void;
}

function keyOf(tenantId: string, idempotencyKey: string): string {
  return `${tenantId}::${idempotencyKey}`;
}

/** DO-shaped: single strongly consistent keyspace with conditional insert. */
export function createDurableObjectSpikeStore(): EnvelopeSpikeStore {
  const rows = new Map<string, SpikeReceipt & { ciphertext: string }>();
  let available = true;
  return {
    name: "durable_object",
    setAvailable(next) {
      available = next;
    },
    async getByIdempotency(tenantId, idempotencyKey) {
      const hit = rows.get(keyOf(tenantId, idempotencyKey));
      if (!hit) return null;
      return {
        accepted: hit.accepted,
        publicApplicationId: hit.publicApplicationId,
        envelopeId: hit.envelopeId,
        idempotentReplay: hit.idempotentReplay,
      };
    },
    async insertConditional(input) {
      if (!available) {
        return { accepted: false, error: "envelope_unavailable" };
      }
      const k = keyOf(input.tenantId, input.idempotencyKey);
      const existing = rows.get(k);
      if (existing) {
        return {
          accepted: existing.accepted,
          publicApplicationId: existing.publicApplicationId,
          envelopeId: existing.envelopeId,
          idempotentReplay: true,
        };
      }
      const receipt: SpikeReceipt & { ciphertext: string } = {
        accepted: true,
        publicApplicationId: input.publicApplicationId,
        envelopeId: `do_${input.idempotencyKey}`,
        idempotentReplay: false,
        ciphertext: input.ciphertext,
      };
      rows.set(k, receipt);
      return {
        accepted: receipt.accepted,
        publicApplicationId: receipt.publicApplicationId,
        envelopeId: receipt.envelopeId,
        idempotentReplay: false,
      };
    },
  };
}

/**
 * R2+D1-shaped: object body + metadata row; conditional on metadata uniqueness.
 * Models "put object then insert metadata; conflict → return existing".
 */
export function createR2D1SpikeStore(): EnvelopeSpikeStore {
  const objects = new Map<string, string>();
  const meta = new Map<string, SpikeReceipt>();
  let available = true;
  return {
    name: "r2_d1",
    setAvailable(next) {
      available = next;
    },
    async getByIdempotency(tenantId, idempotencyKey) {
      return meta.get(keyOf(tenantId, idempotencyKey)) ?? null;
    },
    async insertConditional(input) {
      if (!available) {
        return { accepted: false, error: "envelope_unavailable" };
      }
      const k = keyOf(input.tenantId, input.idempotencyKey);
      const existing = meta.get(k);
      if (existing) {
        return { ...existing, idempotentReplay: true };
      }
      const objectKey = `envelopes/${input.tenantId}/${input.idempotencyKey}`;
      objects.set(objectKey, input.ciphertext);
      const receipt: SpikeReceipt = {
        accepted: true,
        publicApplicationId: input.publicApplicationId,
        envelopeId: `r2_${input.idempotencyKey}`,
        idempotentReplay: false,
      };
      meta.set(k, receipt);
      return receipt;
    },
  };
}

/** Shared checklist proofs used by both adapters. */
export async function proveEnvelopeSpikeContract(store: EnvelopeSpikeStore): Promise<{
  store: string;
  conditionalInsert: boolean;
  idempotentReplay: boolean;
  failClosed: boolean;
}> {
  const base: SpikeEnvelopeInput = {
    tenantId: "00000000-0000-4000-8000-000000000001",
    idempotencyKey: `spike-${store.name}`,
    publicApplicationId: `app_${store.name}_1`,
    ciphertext: "sealed-synthetic",
  };

  const first = await store.insertConditional(base);
  const second = await store.insertConditional({
    ...base,
    publicApplicationId: `app_${store.name}_should_not_win`,
  });
  const conditionalInsert = first.accepted === true && first.idempotentReplay === false;
  const idempotentReplay =
    first.accepted === true &&
    second.accepted === true &&
    second.idempotentReplay === true &&
    second.publicApplicationId === first.publicApplicationId;

  store.setAvailable(false);
  const denied = await store.insertConditional({
    ...base,
    idempotencyKey: `spike-${store.name}-down`,
    publicApplicationId: `app_${store.name}_down`,
  });
  store.setAvailable(true);

  return {
    store: store.name,
    conditionalInsert,
    idempotentReplay,
    failClosed: denied.accepted === false && denied.error === "envelope_unavailable",
  };
}
