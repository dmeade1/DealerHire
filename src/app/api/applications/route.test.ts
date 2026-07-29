import { afterEach, describe, expect, it } from "vitest";
import { POST } from "./route";

const originalDb = process.env.DATABASE_URL;

afterEach(() => {
  if (originalDb === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDb;
});

describe("applications route INV-11", () => {
  it("fails closed without accepted=true when intake is not configured", async () => {
    delete process.env.DATABASE_URL;

    const form = new FormData();
    form.set("idempotencyKey", "idem-1");
    form.set("fullName", "SYNTHETIC Applicant");
    form.set("email", "synthetic@example.test");
    form.set("notice_application_terms", "on");
    form.set("notice_privacy", "on");

    const response = await POST(
      new Request("http://localhost/api/applications", { method: "POST", body: form }),
    );
    expect(response.status).toBe(503);
    const body = (await response.json()) as { accepted: boolean; error: string };
    expect(body.accepted).toBe(false);
    expect(body.error).toBe("intake_not_ready");
  });
});
