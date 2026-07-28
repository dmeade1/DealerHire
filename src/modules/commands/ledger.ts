import { contentAddress, randomToken, sha256 } from "@/platform/crypto/hash";
import type { Sql } from "@/platform/db/client";

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

/**
 * Atomically redeem approval + insert Command + outbox in one transaction.
 * Provider calls must happen OUTSIDE this function.
 */
export async function redeemApprovalAndEnqueueCommand(
  sql: Sql,
  input: {
    oneTimeToken: string;
    expectedEffectHash: string;
    tenantId: string;
    rooftopId: string;
    jobControlVersionId: string;
    lever: string;
    payload: unknown;
    expiresAt?: Date;
  },
) {
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
  if (approval.effect_hash !== input.expectedEffectHash) {
    throw new Error("effect hash mismatch — reapproval required");
  }

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
    insert into hiring.outbox (tenant_id, aggregate_type, aggregate_id, event_type, payload)
    values (
      ${input.tenantId}::uuid, 'command', ${command.id}::uuid, 'command.queued',
      ${sql.json(asJson({ commandId: command.id, lever: input.lever, payloadHash }))}
    )
  `;

  return { command, approvalId: approval.id as string };
}

export async function markNeedsReconciliation(sql: Sql, commandId: string, detail: unknown) {
  await sql`
    update hiring.commands
    set status = 'needs_reconciliation'
    where id = ${commandId}::uuid
  `;
  await sql`
    insert into hiring.outbox (tenant_id, aggregate_type, aggregate_id, event_type, payload)
    select tenant_id, 'command', id, 'command.needs_reconciliation', ${sql.json(asJson(detail))}
    from hiring.commands where id = ${commandId}::uuid
  `;
}

export async function attachActuationReceipt(
  sql: Sql,
  input: {
    tenantId: string;
    commandId: string;
    provider: string;
    providerRef?: string;
    observedState: unknown;
  },
) {
  const receipts = await sql`
    insert into hiring.actuation_receipts (
      tenant_id, command_id, provider, provider_ref, observed_state
    ) values (
      ${input.tenantId}::uuid, ${input.commandId}::uuid, ${input.provider},
      ${input.providerRef ?? null}, ${sql.json(asJson(input.observedState))}
    )
    returning *
  `;
  await sql`
    update hiring.commands set status = 'succeeded' where id = ${input.commandId}::uuid
  `;
  return receipts[0];
}
