/**
 * ApplicationAcceptanceEnvelope Durable Object — G2-02 spike candidate.
 *
 * Conditional insert by tenant+idempotency key. Not wired as the live receipt
 * authority until Selected (ADR 0004 interim Postgres remains G1).
 *
 * Storage: DO transactional storage (strongly consistent single-key writes).
 */

export type EnvelopeDoRecord = {
  publicApplicationId: string;
  envelopeId: string;
  tenantId: string;
  idempotencyKey: string;
  ciphertext: string;
  acceptedAt: string;
};

export type EnvelopeDoResult =
  | { accepted: true; publicApplicationId: string; envelopeId: string; idempotentReplay: boolean }
  | { accepted: false; error: string };

type EnvelopeDoState = {
  record?: EnvelopeDoRecord;
};

/** Pure conditional-insert logic — unit-tested without a Cloudflare runtime. */
export function conditionalInsertEnvelope(
  state: EnvelopeDoState,
  input: {
    tenantId: string;
    idempotencyKey: string;
    publicApplicationId: string;
    ciphertext: string;
  },
): { next: EnvelopeDoState; result: EnvelopeDoResult } {
  if (state.record) {
    if (
      state.record.tenantId !== input.tenantId ||
      state.record.idempotencyKey !== input.idempotencyKey
    ) {
      return {
        next: state,
        result: { accepted: false, error: "envelope_key_mismatch" },
      };
    }
    return {
      next: state,
      result: {
        accepted: true,
        publicApplicationId: state.record.publicApplicationId,
        envelopeId: state.record.envelopeId,
        idempotentReplay: true,
      },
    };
  }

  const record: EnvelopeDoRecord = {
    publicApplicationId: input.publicApplicationId,
    envelopeId: `do_${input.idempotencyKey}`,
    tenantId: input.tenantId,
    idempotencyKey: input.idempotencyKey,
    ciphertext: input.ciphertext,
    acceptedAt: new Date().toISOString(),
  };
  return {
    next: { record },
    result: {
      accepted: true,
      publicApplicationId: record.publicApplicationId,
      envelopeId: record.envelopeId,
      idempotentReplay: false,
    },
  };
}

export class ApplicationAcceptanceEnvelopeDo {
  // Cloudflare injects DurableObjectState at runtime when the binding is enabled.
  constructor(private readonly ctx: { storage: DurableObjectStorage }) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return Response.json({ accepted: false, error: "method_not_allowed" }, { status: 405 });
    }
    const body = (await request.json().catch(() => null)) as {
      tenantId?: string;
      idempotencyKey?: string;
      publicApplicationId?: string;
      ciphertext?: string;
    } | null;
    if (
      !body?.tenantId ||
      !body.idempotencyKey ||
      !body.publicApplicationId ||
      !body.ciphertext
    ) {
      return Response.json({ accepted: false, error: "invalid_envelope" }, { status: 400 });
    }

    const state =
      (await this.ctx.storage.get<EnvelopeDoState>("envelope")) ?? ({} as EnvelopeDoState);
    const { next, result } = conditionalInsertEnvelope(state, {
      tenantId: body.tenantId,
      idempotencyKey: body.idempotencyKey,
      publicApplicationId: body.publicApplicationId,
      ciphertext: body.ciphertext,
    });
    if (result.accepted && !result.idempotentReplay) {
      await this.ctx.storage.put("envelope", next);
    }
    return Response.json(result, { status: result.accepted ? 200 : 409 });
  }
}
