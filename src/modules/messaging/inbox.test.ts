import { describe, expect, it } from "vitest";
import {
  encodeInboxMessageV1,
  messageCompatMatrix,
  parseInboxMessage,
  SUPPORTED_INBOX_SCHEMA_VERSIONS,
} from "./inbox";

describe("G1-09 inbox schema N/N−1 compatibility", () => {
  it("exposes current N and N−1 in the compatibility matrix", () => {
    const matrix = messageCompatMatrix();
    expect(matrix.current).toBe(1);
    expect(matrix.supported).toEqual([0, 1]);
    expect(SUPPORTED_INBOX_SCHEMA_VERSIONS).toContain(matrix.current - 1);
    expect(matrix.types).toContain("application.accepted");
  });

  it("accepts v1 envelopes", () => {
    const body = encodeInboxMessageV1({
      type: "application.accepted",
      tenantId: "t1",
      rooftopId: "r1",
      payload: { envelopeId: "e1" },
    });
    const parsed = parseInboxMessage(body);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.message.schemaVersion).toBe(1);
    expect(parsed.message.type).toBe("application.accepted");
    expect(parsed.message.payload.envelopeId).toBe("e1");
  });

  it("accepts v0 (N−1) bare type bodies used by existing workers", () => {
    const parsed = parseInboxMessage({
      type: "command.queued",
      commandId: "c1",
      lever: "page_publish",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.message.schemaVersion).toBe(0);
    expect(parsed.message.payload.commandId).toBe("c1");
  });

  it("poisons unknown types and unsupported schema versions (no silent ack)", () => {
    expect(parseInboxMessage({ type: "totally.unknown" }).ok).toBe(false);
    expect(parseInboxMessage({ type: "ad.actuate", schemaVersion: 99 }).ok).toBe(false);
    expect(parseInboxMessage(null).ok).toBe(false);
    const poison = parseInboxMessage({ type: "future.event", schemaVersion: 1 });
    expect(poison).toMatchObject({ ok: false, poison: true, reason: "inbox_unknown_type" });
  });

  it("rejects v1 without payload object", () => {
    const parsed = parseInboxMessage({
      schemaVersion: 1,
      type: "candidate_ai.shadow",
      payload: "nope",
    });
    expect(parsed.ok).toBe(false);
  });
});
