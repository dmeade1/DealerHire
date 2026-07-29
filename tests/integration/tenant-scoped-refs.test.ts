import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { contentAddress } from "@/platform/crypto/hash";
import { issueAcceptanceReceipt } from "@/modules/intake/submit";
import {
  ROOFTOP_A,
  ROOFTOP_B,
  TENANT_A,
  TENANT_B,
  requireIntegrationDb,
  setupIntegrationDb,
  teardownIntegrationDb,
} from "./helpers/db";

const JCV_A = "00000000-0000-4000-8000-00000000000a";
const JCV_B = "00000000-0000-4000-8000-00000000000b";

describe("composite tenant-scoped intake references", () => {
  let adminUrl: string;

  beforeAll(async () => {
    requireIntegrationDb();
    const urls = await setupIntegrationDb();
    adminUrl = urls.adminUrl;
    process.env.ACCEPTANCE_ENVELOPE_BINDING = "local";
    process.env.CAPABILITY_SECRET = "test-only-capability-secret";

    const admin = postgres(adminUrl, { max: 1 });
    try {
      // Minimal published JCV under tenant B for cross-tenant application FK probes.
      await admin`
        insert into hiring.requisitions (
          id, tenant_id, rooftop_id, department, job_family, title, status
        ) values (
          ${"00000000-0000-4000-8000-000000000021"}::uuid,
          ${TENANT_B}::uuid, ${ROOFTOP_B}::uuid,
          'fixed_operations', 'technician', 'SYNTHETIC Tech B', 'published'
        )
        on conflict (id) do nothing
      `;
      await admin`
        insert into hiring.listing_revisions (
          id, tenant_id, rooftop_id, requisition_id, revision_no, payload, content_hash, created_by
        ) values (
          ${"00000000-0000-4000-8000-000000000022"}::uuid,
          ${TENANT_B}::uuid, ${ROOFTOP_B}::uuid,
          ${"00000000-0000-4000-8000-000000000021"}::uuid,
          1,
          '{"title":"SYNTHETIC Tech B","synthetic":true}'::jsonb,
          'synthetic-listing-hash-b-v1',
          'synthetic:seed'
        )
        on conflict (id) do nothing
      `;
      await admin`
        insert into hiring.job_control_versions (
          id, tenant_id, rooftop_id, requisition_id, listing_revision_id, version_no,
          pay_min_cents, pay_max_cents, pay_unit, qualification_rubric, policy_pack_versions, status
        ) values (
          ${JCV_B}::uuid, ${TENANT_B}::uuid, ${ROOFTOP_B}::uuid,
          ${"00000000-0000-4000-8000-000000000021"}::uuid,
          ${"00000000-0000-4000-8000-000000000022"}::uuid,
          1, 2500, 4500, 'hour',
          '{"mustHave":["diagnostics"]}'::jsonb,
          '{"pack":"us-ny-state"}'::jsonb,
          'published'
        )
        on conflict (id) do nothing
      `;
    } finally {
      await admin.end({ timeout: 5 });
    }
  }, 60_000);

  afterAll(async () => {
    await teardownIntegrationDb();
  });

  it("rejects envelope when rooftop belongs to another tenant", async () => {
    const result = await issueAcceptanceReceipt({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_B,
      jobControlVersionId: JCV_A,
      idempotencyKey: `idem-${randomUUID()}`,
      structuredPayload: { synthetic: true, label: "SYNTHETIC" },
      noticeHashes: { "notice.app_terms.en.v1": contentAddress("notice.app_terms.en.v1") },
      choiceHashes: {},
      jurisdictionSnapshot: { pack: "us-ny-state", synthetic: true },
      communicationAuthority: {},
    });
    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.message).toMatch(/rooftop not in tenant|foreign key|intake_failed/i);
  });

  it("rejects envelope when JCV is not published for that tenant rooftop", async () => {
    const result = await issueAcceptanceReceipt({
      tenantId: TENANT_B,
      rooftopId: ROOFTOP_B,
      jobControlVersionId: JCV_A, // published under tenant A only
      idempotencyKey: `idem-${randomUUID()}`,
      structuredPayload: { synthetic: true, label: "SYNTHETIC" },
      noticeHashes: { "notice.app_terms.en.v1": contentAddress("notice.app_terms.en.v1") },
      choiceHashes: {},
      jurisdictionSnapshot: { pack: "us-ny-state", synthetic: true },
      communicationAuthority: {},
    });
    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.message).toMatch(
      /job_control_version not eligible|foreign key|rooftop not in tenant|intake_failed/i,
    );
  });

  it("rejects application linking an envelope owned by another tenant", async () => {
    // Keep projection off so envelope_id is free; prove composite tenant FK (not unique dup).
    const previousQueue = process.env.INGEST_QUEUE_AVAILABLE;
    process.env.INGEST_QUEUE_AVAILABLE = "false";
    const receipt = await issueAcceptanceReceipt({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV_A,
      idempotencyKey: `idem-${randomUUID()}`,
      structuredPayload: { synthetic: true, label: "SYNTHETIC" },
      noticeHashes: { "notice.app_terms.en.v1": contentAddress("notice.app_terms.en.v1") },
      choiceHashes: {},
      jurisdictionSnapshot: { pack: "us-ny-state", synthetic: true },
      communicationAuthority: {},
    });
    if (previousQueue === undefined) delete process.env.INGEST_QUEUE_AVAILABLE;
    else process.env.INGEST_QUEUE_AVAILABLE = previousQueue;

    expect(receipt.accepted).toBe(true);
    if (!receipt.accepted) return;

    const admin = postgres(adminUrl, { max: 1 });
    try {
      await expect(
        admin`
          insert into subject.applications (
            tenant_id, rooftop_id, envelope_id, job_control_version_id, status
          ) values (
            ${TENANT_B}::uuid,
            ${ROOFTOP_B}::uuid,
            ${receipt.envelopeId}::uuid,
            ${JCV_B}::uuid,
            'received'
          )
        `,
      ).rejects.toThrow(/foreign key|applications_tenant_envelope/i);
    } finally {
      await admin.end({ timeout: 5 });
    }
  });
});
