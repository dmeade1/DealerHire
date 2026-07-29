import { describe, expect, it } from "vitest";
import worker from "./intake-api";

describe("intake-api INV-11 fail-closed without Hyperdrive", () => {
  it("never returns accepted=true without envelope insert", async () => {
    const response = await worker.fetch(
      new Request("https://intake.example/v1/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "idem-1",
          noticeHashes: { "notice.app_terms.en.v1": "abc" },
          structuredPayload: { synthetic: true, label: "SYNTHETIC" },
          tenantId: "00000000-0000-4000-8000-000000000001",
          rooftopId: "00000000-0000-4000-8000-000000000002",
          jobControlVersionId: "00000000-0000-4000-8000-00000000000a",
          choiceHashes: {},
          jurisdictionSnapshot: { pack: "us-ny-state" },
          communicationAuthority: {},
        }),
      }),
      {},
    );

    expect(response.status).toBe(503);
    const body = (await response.json()) as { accepted: boolean; error: string };
    expect(body.accepted).toBe(false);
    expect(body.error).toBe("envelope_unavailable");
  });

  it("rejects incomplete applications without a receipt", async () => {
    const response = await worker.fetch(
      new Request("https://intake.example/v1/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idempotencyKey: "" }),
      }),
      {},
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { accepted: boolean };
    expect(body.accepted).toBe(false);
  });

  it("rejects raw PII structuredPayload before Hyperdrive (no receipt)", async () => {
    const response = await worker.fetch(
      new Request("https://intake.example/v1/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "idem-pii",
          noticeHashes: { "notice.app_terms.en.v1": "abc" },
          structuredPayload: {
            synthetic: true,
            label: "SYNTHETIC",
            ssn: "123-45-6789",
          },
          tenantId: "00000000-0000-4000-8000-000000000001",
          rooftopId: "00000000-0000-4000-8000-000000000002",
          jobControlVersionId: "00000000-0000-4000-8000-00000000000a",
          jurisdictionSnapshot: { pack: "us-ny-state" },
        }),
      }),
      {},
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { accepted: boolean; error: string };
    expect(body.accepted).toBe(false);
    expect(body.error).toBe("raw_pii_rejected");
  });

  it("rejects unlabeled payloads before Hyperdrive", async () => {
    const response = await worker.fetch(
      new Request("https://intake.example/v1/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "idem-label",
          noticeHashes: { "notice.app_terms.en.v1": "abc" },
          structuredPayload: { email: "unlabeled@example.test" },
          tenantId: "00000000-0000-4000-8000-000000000001",
          rooftopId: "00000000-0000-4000-8000-000000000002",
          jobControlVersionId: "00000000-0000-4000-8000-00000000000a",
          jurisdictionSnapshot: { pack: "us-ny-state" },
        }),
      }),
      {},
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { accepted: boolean; error: string };
    expect(body.accepted).toBe(false);
    expect(body.error).toBe("synthetic_label_required");
  });
});
