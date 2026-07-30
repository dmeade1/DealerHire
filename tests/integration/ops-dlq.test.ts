import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  listDeadLetters,
  quarantineDeadLetter,
  safeRetryDeadLetter,
} from "@/modules/ops/dlq";
import {
  ROOFTOP_A,
  TENANT_A,
  actorFor,
  requireIntegrationDb,
  setupIntegrationDb,
  teardownIntegrationDb,
  withTenantContext,
} from "./helpers/db";

describe("G1-12 audited DLQ quarantine + safe retry", () => {
  beforeAll(async () => {
    requireIntegrationDb();
    await setupIntegrationDb();
  }, 60_000);

  afterAll(async () => {
    await teardownIntegrationDb();
  });

  it("quarantines poison message, lists it, and safe-retries to outbox", async () => {
    const actor = actorFor(TENANT_A, ROOFTOP_A, "hiring_operations");
    const result = await withTenantContext(actor, async (sql) => {
      const row = await quarantineDeadLetter(sql, {
        tenantId: TENANT_A,
        rooftopId: ROOFTOP_A,
        source: "applicant-ingest",
        messageType: "application.accepted",
        schemaVersion: 1,
        payload: { envelopeId: "00000000-0000-4000-8000-00000000dl01", SYNTHETIC: true },
        reason: "inbox_unknown_handler_SYNTHETIC",
        attempts: 5,
      });

      const open = await listDeadLetters(sql, { limit: 20 });
      expect(open.some((r) => r.id === row.id)).toBe(true);

      const retried = await safeRetryDeadLetter(sql, {
        deadLetterId: row.id,
        actorSubjectRef: "ops:integration-dlq",
      });

      const after = await listDeadLetters(sql, { limit: 50 });
      expect(after.some((r) => r.id === row.id)).toBe(false);

      const outbox = await sql<{ event_type: string }[]>`
        select event_type from hiring.outbox
        where id = ${retried.outboxId}::uuid
      `;
      return { retried, outboxType: outbox[0]?.event_type };
    });

    expect(result.retried.action).toBe("requeued");
    expect(result.outboxType).toBe("application.accepted");
  });
});
