import { nanoid } from "nanoid";
import { contentAddress, hashCapability, randomToken, sealEnvelope } from "@/platform/crypto/hash";
import { runInTransaction, type Sql } from "@/platform/db/client";

function asJson(value: unknown): Parameters<Sql["json"]>[0] {
  return JSON.parse(JSON.stringify(value)) as Parameters<Sql["json"]>[0];
}

export type ResumeState =
  | "none"
  | "pending_upload"
  | "quarantined"
  | "scanned_clean"
  | "scanned_blocked"
  | "attached";

export type AcceptApplicationInput = {
  tenantId: string;
  rooftopId: string;
  jobControlVersionId: string;
  pageReleaseId?: string;
  idempotencyKey: string;
  structuredPayload: Record<string, unknown>;
  noticeHashes: Record<string, string>;
  choiceHashes: Record<string, string>;
  jurisdictionSnapshot: Record<string, unknown>;
  communicationAuthority: Record<string, unknown>;
  resumeState?: ResumeState;
  resumeHash?: string;
};

export type AcceptApplicationResult = {
  accepted: true;
  publicApplicationId: string;
  envelopeId: string;
  resumeState: ResumeState;
  magicCapability: string | null;
  contentHash: string;
  idempotentReplay?: boolean;
};

async function acceptApplicationInTx(
  sql: Sql,
  input: AcceptApplicationInput,
): Promise<AcceptApplicationResult> {
  if (!input.noticeHashes || Object.keys(input.noticeHashes).length === 0) {
    throw new Error("notice hashes required in acceptance envelope");
  }
  if (!input.jurisdictionSnapshot) {
    throw new Error("jurisdiction snapshot required");
  }

  const publicApplicationId = `app_${nanoid(16)}`;
  const envelopeBody = {
    ...input,
    publicApplicationId,
    acceptedAt: new Date().toISOString(),
  };
  const envelopeCiphertext = sealEnvelope(envelopeBody);
  const resumeState = input.resumeState ?? "none";

  // ON CONFLICT avoids aborting the transaction on idempotent replay (INV-11/12).
  const rows = await sql`
    insert into subject.application_acceptance_envelopes (
      tenant_id, rooftop_id, public_application_id, idempotency_key,
      job_control_version_id, page_release_id, structured_payload,
      notice_hashes, choice_hashes, jurisdiction_snapshot, communication_authority,
      resume_state, resume_hash, envelope_ciphertext
    ) values (
      ${input.tenantId}::uuid, ${input.rooftopId}::uuid, ${publicApplicationId},
      ${input.idempotencyKey}, ${input.jobControlVersionId}::uuid,
      ${input.pageReleaseId ?? null}::uuid, ${sql.json(asJson(input.structuredPayload))},
      ${sql.json(asJson(input.noticeHashes))}, ${sql.json(asJson(input.choiceHashes))},
      ${sql.json(asJson(input.jurisdictionSnapshot))}, ${sql.json(asJson(input.communicationAuthority))},
      ${resumeState}, ${input.resumeHash ?? null}, ${envelopeCiphertext}
    )
    on conflict (tenant_id, idempotency_key) do nothing
    returning *
  `;

  if (!rows[0]) {
    const existing = await sql`
      select public_application_id, resume_state, id
      from subject.application_acceptance_envelopes
      where tenant_id = ${input.tenantId}::uuid
        and idempotency_key = ${input.idempotencyKey}
    `;
    if (!existing[0]) {
      throw new Error("acceptance envelope conflict without existing row");
    }
    return {
      accepted: true as const,
      publicApplicationId: existing[0].public_application_id as string,
      envelopeId: existing[0].id as string,
      resumeState: existing[0].resume_state as ResumeState,
      magicCapability: null,
      contentHash: contentAddress({ idempotent: true }),
      idempotentReplay: true,
    };
  }

  const envelope = rows[0];
  const rawCapability = randomToken();
  const capabilityHash = hashCapability(rawCapability);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await sql`
    insert into subject.access_capabilities (
      tenant_id, envelope_id, capability_hash, expires_at
    ) values (
      ${input.tenantId}::uuid, ${envelope.id}::uuid, ${capabilityHash}, ${expiresAt}
    )
  `;

  for (const [noticeId, textHash] of Object.entries(input.noticeHashes)) {
    await sql`
      insert into subject.notice_receipts (
        tenant_id, envelope_id, notice_id, text_hash, locale, shown_at, eligible_at
      ) values (
        ${input.tenantId}::uuid, ${envelope.id}::uuid, ${noticeId}, ${textHash},
        'en', now(), now()
      )
    `;
  }

  return {
    accepted: true as const,
    publicApplicationId,
    envelopeId: envelope.id as string,
    resumeState,
    magicCapability: rawCapability,
    contentHash: contentAddress(envelopeBody),
  };
}

/**
 * Canonical acceptance point. Receipt is issued only after this conditional insert succeeds.
 * Opens a transaction when given a root client; joins the caller txn when already inside one
 * (e.g. withTenantContext). Queue publication is non-gating and happens after.
 */
export async function acceptApplication(
  sql: Sql,
  input: AcceptApplicationInput,
): Promise<AcceptApplicationResult> {
  return runInTransaction(sql, (tx) => acceptApplicationInTx(tx, input));
}

export async function markResumeState(
  sql: Sql,
  envelopeId: string,
  state: ResumeState,
  resumeHash?: string,
) {
  await sql`
    update subject.application_acceptance_envelopes
    set resume_state = ${state}, resume_hash = coalesce(${resumeHash ?? null}, resume_hash)
    where id = ${envelopeId}::uuid
  `;
}

export function isReceiptValid(result: { accepted: boolean; publicApplicationId: string }): boolean {
  return result.accepted && Boolean(result.publicApplicationId);
}
