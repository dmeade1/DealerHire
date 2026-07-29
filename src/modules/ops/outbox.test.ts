import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("ops outbox safe replay policy (G1-12)", () => {
  it("module exports inspect + safeReplay with NeedsReconciliation refusal", () => {
    const src = readFileSync(join(process.cwd(), "src/modules/ops/outbox.ts"), "utf8");
    expect(src).toContain("export async function listOutbox");
    expect(src).toContain("export async function safeReplayOutbox");
    expect(src).toMatch(/needs_reconciliation[\s\S]*never re-dispatch create/);
  });
});
