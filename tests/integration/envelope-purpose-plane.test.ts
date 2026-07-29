import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { contentAddress } from "@/platform/crypto/hash";
import { issueAcceptanceReceipt } from "@/modules/intake/submit";
import {
  ROOFTOP_A,
  TENANT_A,
  actorFor,
  requireIntegrationDb,
  setupIntegrationDb,
  teardownIntegrationDb,
  withTenantContext,
} from "./helpers/db";

const JCV = "00000000-0000-4000-8000-00000000000a";

describe("envelope purpose plane: hiring_ops SELECT-only", () => {
  beforeAll(async () => {
    requireIntegrationDb();
    await setupIntegrationDb();
    process.env.ACCEPTANCE_ENVELOPE_BINDING = "local";
    process.env.CAPABILITY_SECRET = "test-only-capability-secret";
  }, 60_000);

  afterAll(async () => {
    await teardownIntegrationDb();
  });

  it("hiring_operations can SELECT envelopes but cannot INSERT", async () => {
    const accepted = await issueAcceptanceReceipt({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      idempotencyKey: `idem-${randomUUID()}`,
      structuredPayload: { synthetic: true, label: "SYNTHETIC" },
      noticeHashes: { "notice.app_terms.en.v1": contentAddress("notice.app_terms.en.v1") },
      choiceHashes: {},
      jurisdictionSnapshot: { pack: "us-ny-state", synthetic: true },
      communicationAuthority: {},
    });
    expect(accepted.accepted).toBe(true);
    if (!accepted.accepted) return;

    const hiring = actorFor(TENANT_A, ROOFTOP_A, "hiring_operations");
    const visible = await withTenantContext(hiring, async (sql) => {
      return sql<{ public_application_id: string }[]>`
        select public_application_id
        from subject.application_acceptance_envelopes
        where public_application_id = ${accepted.publicApplicationId}
      `;
    });
    expect(visible.map((r) => r.public_application_id)).toContain(accepted.publicApplicationId);

    await expect(
      withTenantContext(hiring, async (sql) => {
        await sql`
          insert into subject.application_acceptance_envelopes (
            tenant_id, rooftop_id, public_application_id, idempotency_key,
            job_control_version_id, structured_payload, notice_hashes, choice_hashes,
            jurisdiction_snapshot, communication_authority, resume_state, envelope_ciphertext
          ) values (
            ${TENANT_A}::uuid, ${ROOFTOP_A}::uuid, ${`app_bogus_${randomUUID()}`},
            ${`idem-bogus-${randomUUID()}`}, ${JCV}::uuid,
            '{"synthetic":true,"label":"SYNTHETIC"}'::jsonb,
            '{}'::jsonb, '{}'::jsonb, '{"synthetic":true}'::jsonb, '{}'::jsonb,
            'none', 'not-a-real-envelope'
          )
        `;
      }),
    ).rejects.toThrow(/row-level security|violates/i);
  });

  it("hiring_operations cannot DELETE envelopes", async () => {
    const accepted = await issueAcceptanceReceipt({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      idempotencyKey: `idem-${randomUUID()}`,
      structuredPayload: { synthetic: true, label: "SYNTHETIC" },
      noticeHashes: { "notice.app_terms.en.v1": contentAddress("notice.app_terms.en.v1") },
      choiceHashes: {},
      jurisdictionSnapshot: { pack: "us-ny-state", synthetic: true },
      communicationAuthority: {},
    });
    expect(accepted.accepted).toBe(true);
    if (!accepted.accepted) return;

    const hiring = actorFor(TENANT_A, ROOFTOP_A, "hiring_operations");
    const deleted = await withTenantContext(hiring, async (sql) => {
      return sql`
        delete from subject.application_acceptance_envelopes
        where public_application_id = ${accepted.publicApplicationId}
        returning id
      `;
    });
    expect(deleted).toEqual([]);

    const stillThere = await withTenantContext(hiring, async (sql) => {
      return sql<{ public_application_id: string }[]>`
        select public_application_id
        from subject.application_acceptance_envelopes
        where public_application_id = ${accepted.publicApplicationId}
      `;
    });
    expect(stillThere).toHaveLength(1);
  });
});
