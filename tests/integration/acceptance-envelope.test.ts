import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { contentAddress } from "@/platform/crypto/hash";
import { isReceiptValid } from "@/modules/intake/envelope";
import {
  isIngestQueueAvailable,
  projectEnvelopeToApplication,
} from "@/modules/intake/project";
import { issueAcceptanceReceipt } from "@/modules/intake/submit";
import {
  ROOFTOP_A,
  TENANT_A,
  requireIntegrationDb,
  setupIntegrationDb,
  teardownIntegrationDb,
  withTenantContext,
  actorFor,
} from "./helpers/db";

const JCV = "00000000-0000-4000-8000-00000000000a";

describe("G1-08 / INV-11 acceptance envelope receipt", () => {
  beforeAll(async () => {
    requireIntegrationDb();
    await setupIntegrationDb();
    process.env.ACCEPTANCE_ENVELOPE_BINDING = "local";
    process.env.CAPABILITY_SECRET = "test-only-capability-secret";
  }, 60_000);

  afterAll(async () => {
    await teardownIntegrationDb();
  });

  it("issues accepted receipt only after durable envelope insert", async () => {
    const idempotencyKey = `idem-${randomUUID()}`;
    const result = await issueAcceptanceReceipt({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      idempotencyKey,
      structuredPayload: { synthetic: true, label: "SYNTHETIC" },
      noticeHashes: {
        "notice.app_terms.en.v1": contentAddress("notice.app_terms.en.v1"),
        "notice.privacy.en.v1": contentAddress("notice.privacy.en.v1"),
      },
      choiceHashes: {},
      jurisdictionSnapshot: { pack: "us-ny-state", synthetic: true },
      communicationAuthority: { emailTransactional: true },
      resumeState: "none",
    });

    if (!result.accepted) {
      expect.fail(`${result.error}: ${result.message}`);
    }
    expect(isReceiptValid(result)).toBe(true);
    expect(result.publicApplicationId).toMatch(/^app_/);
    expect(result.magicCapability).toBeTruthy();

    const rows = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "subject_permission"),
      async (sql) =>
        sql<{ public_application_id: string; idempotency_key: string }[]>`
          select public_application_id, idempotency_key
          from subject.application_acceptance_envelopes
          where public_application_id = ${result.publicApplicationId}
        `,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.idempotency_key).toBe(idempotencyKey);
  });

  it("idempotent replay returns same publicApplicationId without a second envelope", async () => {
    const idempotencyKey = `idem-${randomUUID()}`;
    const input = {
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      idempotencyKey,
      structuredPayload: { synthetic: true, label: "SYNTHETIC" },
      noticeHashes: {
        "notice.app_terms.en.v1": contentAddress("notice.app_terms.en.v1"),
      },
      choiceHashes: {},
      jurisdictionSnapshot: { pack: "us-ny-state", synthetic: true },
      communicationAuthority: {},
    };

    const first = await issueAcceptanceReceipt(input);
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;

    const second = await issueAcceptanceReceipt(input);
    expect(second.accepted).toBe(true);
    if (!second.accepted) return;
    expect(second.idempotentReplay).toBe(true);
    expect(second.publicApplicationId).toBe(first.publicApplicationId);
    expect(second.magicCapability).toBeNull();

    const count = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "subject_permission"),
      async (sql) =>
        sql<{ n: number }[]>`
          select count(*)::int as n
          from subject.application_acceptance_envelopes
          where idempotency_key = ${idempotencyKey}
        `,
    );
    expect(count[0]!.n).toBe(1);
  });

  it("denies receipt when envelope store is not configured", async () => {
    const result = await issueAcceptanceReceipt(
      {
        tenantId: TENANT_A,
        rooftopId: ROOFTOP_A,
        jobControlVersionId: JCV,
        idempotencyKey: `idem-${randomUUID()}`,
        structuredPayload: { synthetic: true, label: "SYNTHETIC" },
        noticeHashes: { n: "h" },
        choiceHashes: {},
        jurisdictionSnapshot: { pack: "us-ny-state" },
        communicationAuthority: {},
      },
      { envelopeBinding: "kms", connectionString: process.env.DATABASE_URL },
    );
    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.error).toBe("envelope_unavailable");
  });

  it("RC-03 queue-down: receipt stays valid; delayed project converges with zero dupes", async () => {
    // Simulate ingest queue unavailable after accept (non-gating).
    const previousQueue = process.env.INGEST_QUEUE_AVAILABLE;
    process.env.INGEST_QUEUE_AVAILABLE = "false";
    expect(isIngestQueueAvailable()).toBe(false);

    const receipt = await issueAcceptanceReceipt({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      idempotencyKey: `idem-queue-down-${randomUUID()}`,
      structuredPayload: { synthetic: true, label: "SYNTHETIC" },
      noticeHashes: {
        "notice.app_terms.en.v1": contentAddress("notice.app_terms.en.v1"),
      },
      choiceHashes: {},
      jurisdictionSnapshot: { pack: "us-ny-state", synthetic: true },
      communicationAuthority: {},
    });
    if (previousQueue === undefined) delete process.env.INGEST_QUEUE_AVAILABLE;
    else process.env.INGEST_QUEUE_AVAILABLE = previousQueue;

    expect(receipt.accepted).toBe(true);
    if (!receipt.accepted) return;
    expect(isReceiptValid(receipt)).toBe(true);

    // Queue down: no application row yet.
    const before = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "subject_permission"),
      async (sql) =>
        sql<{ n: number }[]>`
          select count(*)::int as n from subject.applications
          where envelope_id = ${receipt.envelopeId}::uuid
        `,
    );
    expect(before[0]!.n).toBe(0);

    // Drain / replay from envelope (queue recovers).
    const first = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "subject_permission"),
      (sql) =>
        projectEnvelopeToApplication(sql, {
          tenantId: TENANT_A,
          envelopeId: receipt.envelopeId,
        }),
    );
    expect(first.created).toBe(true);

    const second = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "subject_permission"),
      (sql) =>
        projectEnvelopeToApplication(sql, {
          tenantId: TENANT_A,
          envelopeId: receipt.envelopeId,
        }),
    );
    expect(second.created).toBe(false);
    expect(second.applicationId).toBe(first.applicationId);

    const after = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "subject_permission"),
      async (sql) => {
        const apps = await sql<{ n: number }[]>`
          select count(*)::int as n from subject.applications
          where envelope_id = ${receipt.envelopeId}::uuid
        `;
        const env = await sql<{ reconciled_at: Date | null }[]>`
          select reconciled_at from subject.application_acceptance_envelopes
          where id = ${receipt.envelopeId}::uuid
        `;
        return { apps: apps[0]!.n, reconciled: env[0]?.reconciled_at };
      },
    );
    expect(after.apps).toBe(1);
    expect(after.reconciled).toBeTruthy();
  });
});
