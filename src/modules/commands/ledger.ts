import { contentAddress, randomToken, sha256 } from "@/platform/crypto/hash";
import { runInTransaction, type Sql } from "@/platform/db/client";

// postgres JSONValue typing is strict; serialize to a plain JSON-compatible value.
function asJson(value: unknown): Parameters<Sql["json"]>[0] {
  return JSON.parse(JSON.stringify(value)) as Parameters<Sql["json"]>[0];
}

export type EffectManifest = {
  tenantId: string;
  rooftopId: string;
  jobControlVersionId: string;
  lever: string;
  accountRef?: string;
  audience?: Record<string, unknown>;
  creativeHash?: string;
  landingUrl?: string;
  budget?: Record<string, unknown>;
  policyVersions: Record<string, unknown>;
  adapterNormalizedEffect: Record<string, unknown>;
};

export type RedeemCommandInput = {
  oneTimeToken: string;
  tenantId: string;
  rooftopId: string;
  jobControlVersionId: string;
  lever: string;
  payload: unknown;
  /** Full effect being authorized — hash must match the stored approval manifest. */
  effectManifest: EffectManifest;
  expiresAt?: Date;
};

/**
 * Bind redemption to the approved effect: recompute hash from the requested manifest,
 * compare to the stored hash, and require every material identity field to match.
 */
export function assertApprovalBindsRequestedEffect(
  storedManifest: EffectManifest,
  storedEffectHash: string,
  request: RedeemCommandInput,
): void {
  const requestedHash = contentAddress(request.effectManifest);
  const storedHash = contentAddress(storedManifest);

  if (storedHash !== storedEffectHash) {
    throw new Error("stored effect manifest does not match effect hash — reapproval required");
  }
  if (requestedHash !== storedEffectHash) {
    throw new Error("effect hash mismatch — reapproval required");
  }

  const material: Array<keyof EffectManifest> = [
    "tenantId",
    "rooftopId",
    "jobControlVersionId",
    "lever",
    "accountRef",
    "creativeHash",
    "landingUrl",
  ];
  for (const key of material) {
    if (request.effectManifest[key] !== storedManifest[key]) {
      throw new Error(`effect field mismatch: ${key} — reapproval required`);
    }
  }
  if (contentAddress(request.effectManifest.audience ?? null) !== contentAddress(storedManifest.audience ?? null)) {
    throw new Error("effect field mismatch: audience — reapproval required");
  }
  if (contentAddress(request.effectManifest.budget ?? null) !== contentAddress(storedManifest.budget ?? null)) {
    throw new Error("effect field mismatch: budget — reapproval required");
  }
  if (
    contentAddress(request.effectManifest.policyVersions) !==
    contentAddress(storedManifest.policyVersions)
  ) {
    throw new Error("effect field mismatch: policyVersions — reapproval required");
  }
  if (
    contentAddress(request.effectManifest.adapterNormalizedEffect) !==
    contentAddress(storedManifest.adapterNormalizedEffect)
  ) {
    throw new Error("effect field mismatch: adapterNormalizedEffect — reapproval required");
  }

  if (
    request.tenantId !== storedManifest.tenantId ||
    request.rooftopId !== storedManifest.rooftopId ||
    request.jobControlVersionId !== storedManifest.jobControlVersionId ||
    request.lever !== storedManifest.lever
  ) {
    throw new Error("command identity does not match approved effect — reapproval required");
  }

  if (contentAddress(request.payload) !== contentAddress(storedManifest.adapterNormalizedEffect)) {
    throw new Error("command payload does not match approved effect — reapproval required");
  }
}

export async function createApprovalCase(
  sql: Sql,
  input: {
    tenantId: string;
    rooftopId: string;
    jobControlVersionId: string;
    effectManifest: EffectManifest;
    actor: string;
    authoritySource: string;
    reason: string;
    expiresAt: Date;
  },
) {
  const effectHash = contentAddress(input.effectManifest);
  const oneTimeToken = randomToken();
  const rows = await sql`
    insert into hiring.approval_cases (
      tenant_id, rooftop_id, job_control_version_id, effect_manifest, effect_hash,
      one_time_token, expires_at, actor, authority_source, reason
    ) values (
      ${input.tenantId}::uuid, ${input.rooftopId}::uuid, ${input.jobControlVersionId}::uuid,
      ${sql.json(asJson(input.effectManifest))}, ${effectHash}, ${oneTimeToken},
      ${input.expiresAt}, ${input.actor}, ${input.authoritySource}, ${input.reason}
    )
    returning id, one_time_token, effect_hash
  `;
  return rows[0];
}

async function redeemApprovalAndEnqueueCommandInTx(sql: Sql, input: RedeemCommandInput) {
  const payloadHash = contentAddress(input.payload);
  const idempotencyKey = sha256(
    `${input.tenantId}:${input.jobControlVersionId}:${input.lever}:${payloadHash}`,
  );

  const approvals = await sql`
    select * from hiring.approval_cases
    where one_time_token = ${input.oneTimeToken}
      and tenant_id = ${input.tenantId}::uuid
    for update
  `;
  const approval = approvals[0];
  if (!approval) throw new Error("approval not found");
  if (approval.redeemed_at) throw new Error("approval already redeemed");
  if (new Date(approval.expires_at).getTime() <= Date.now()) throw new Error("approval expired");

  const storedManifest = approval.effect_manifest as EffectManifest;
  assertApprovalBindsRequestedEffect(storedManifest, approval.effect_hash as string, input);

  await sql`
    update hiring.approval_cases
    set redeemed_at = now()
    where id = ${approval.id}::uuid
  `;

  const commands = await sql`
    insert into hiring.commands (
      tenant_id, rooftop_id, job_control_version_id, lever, payload_hash, payload,
      status, approval_case_id, idempotency_key, expires_at
    ) values (
      ${input.tenantId}::uuid, ${input.rooftopId}::uuid, ${input.jobControlVersionId}::uuid,
      ${input.lever}, ${payloadHash}, ${sql.json(asJson(input.payload))},
      'queued', ${approval.id}::uuid, ${idempotencyKey}, ${input.expiresAt ?? null}
    )
    returning *
  `;
  const command = commands[0];

  await sql`
    insert into hiring.outbox (
      tenant_id, rooftop_id, aggregate_type, aggregate_id, event_type, payload
    ) values (
      ${input.tenantId}::uuid, ${input.rooftopId}::uuid, 'command', ${command.id}::uuid,
      'command.queued',
      ${sql.json(asJson({ commandId: command.id, lever: input.lever, payloadHash }))}
    )
  `;

  return { command, approvalId: approval.id as string };
}

/**
 * Atomically redeem approval + insert Command + outbox in one transaction.
 * Opens a transaction on a root client; joins an existing withTenantContext txn.
 * Provider calls must happen OUTSIDE this function.
 */
export async function redeemApprovalAndEnqueueCommand(sql: Sql, input: RedeemCommandInput) {
  return runInTransaction(sql, (tx) => redeemApprovalAndEnqueueCommandInTx(tx, input));
}

export async function markNeedsReconciliation(sql: Sql, commandId: string, detail: unknown) {
  await sql`
    update hiring.commands
    set status = 'needs_reconciliation'
    where id = ${commandId}::uuid
  `;
  await sql`
    insert into hiring.outbox (
      tenant_id, rooftop_id, aggregate_type, aggregate_id, event_type, payload
    )
    select tenant_id, rooftop_id, 'command', id, 'command.needs_reconciliation',
      ${sql.json(asJson(detail))}
    from hiring.commands where id = ${commandId}::uuid
  `;
}

export async function attachActuationReceipt(
  sql: Sql,
  input: {
    tenantId: string;
    rooftopId: string;
    commandId: string;
    provider: string;
    providerRef?: string;
    observedState: unknown;
  },
) {
  const receipts = await sql`
    insert into hiring.actuation_receipts (
      tenant_id, rooftop_id, command_id, provider, provider_ref, observed_state
    ) values (
      ${input.tenantId}::uuid, ${input.rooftopId}::uuid, ${input.commandId}::uuid,
      ${input.provider}, ${input.providerRef ?? null}, ${sql.json(asJson(input.observedState))}
    )
    returning *
  `;
  await sql`
    update hiring.commands set status = 'succeeded' where id = ${input.commandId}::uuid
  `;
  return receipts[0];
}
