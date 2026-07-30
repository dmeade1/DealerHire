import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  drainUnprojectedEnvelopes,
  listUnprojectedEnvelopes,
} from "@/modules/intake/drain";
import { issueAcceptanceReceipt } from "@/modules/intake/submit";
import { isIngestQueueAvailable } from "@/modules/intake/project";
import { contentAddress } from "@/platform/crypto/hash";
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

describe("G1-08 ops envelope drain board", () => {
  const previousQueue = process.env.INGEST_QUEUE_AVAILABLE;

  beforeAll(async () => {
    requireIntegrationDb();
    await setupIntegrationDb();
  }, 60_000);

  afterAll(async () => {
    if (previousQueue === undefined) delete process.env.INGEST_QUEUE_AVAILABLE;
    else process.env.INGEST_QUEUE_AVAILABLE = previousQueue;
    await teardownIntegrationDb();
  });

  it("lists unprojected envelopes and drains with zero duplicates", async () => {
    process.env.INGEST_QUEUE_AVAILABLE = "false";
    expect(isIngestQueueAvailable()).toBe(false);

    const receipt = await issueAcceptanceReceipt({
      tenantId: TENANT_A,
      rooftopId: ROOFTOP_A,
      jobControlVersionId: JCV,
      idempotencyKey: `drain-${randomUUID()}`,
      structuredPayload: { synthetic: true, label: "SYNTHETIC" },
      noticeHashes: {
        "notice.app_terms.en.v1": contentAddress("notice.app_terms.en.v1"),
      },
      choiceHashes: {},
      jurisdictionSnapshot: { pack: "us-ny-state", synthetic: true },
      communicationAuthority: {},
    });
    expect(receipt.accepted).toBe(true);
    if (!receipt.accepted) return;

    const pending = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"),
      (sql) => listUnprojectedEnvelopes(sql, { limit: 50 }),
    );
    expect(pending.some((r) => r.id === receipt.envelopeId)).toBe(true);

    const drained = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "subject_permission"),
      (sql) =>
        drainUnprojectedEnvelopes(sql, {
          tenantId: TENANT_A,
          limit: 50,
        }),
    );
    expect(drained.created).toBeGreaterThanOrEqual(1);

    const again = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "hiring_operations"),
      (sql) => listUnprojectedEnvelopes(sql, { limit: 50 }),
    );
    expect(again.some((r) => r.id === receipt.envelopeId)).toBe(false);
  });
});
