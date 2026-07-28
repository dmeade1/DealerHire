import { describe, expect, it } from "vitest";
import { evaluateCommunicationAuthorization } from "./authorization";

describe("communication authorization", () => {
  const base = {
    employerCaller: "North Atlantic Motors",
    tenantId: "00000000-0000-4000-8000-000000000001",
    purpose: "transactional_application_receipt",
    technology: "email_api",
    jurisdiction: "us-ny-state",
    permissionVersion: "email.txn.v1",
    permissionGranted: true,
    withdrawn: false,
    suppressed: false,
  };

  it("allows transactional email", () => {
    const d = evaluateCommunicationAuthorization({ ...base, channel: "email" });
    expect(d.allowed).toBe(true);
  });

  it("blocks SMS until gate", () => {
    const d = evaluateCommunicationAuthorization({
      ...base,
      channel: "sms",
      smsEnabled: false,
    });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("sms_disabled_until_gate");
  });
});
