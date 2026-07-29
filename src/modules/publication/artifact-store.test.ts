import { describe, expect, it } from "vitest";
import {
  createR2MemoryArtifactStore,
  putPageArtifactBeforeActivate,
} from "./artifact-store";

const ARTIFACT = {
  locale: "en" as const,
  title: "ASE Automotive Technician (SYNTHETIC)",
  bodyHtml: "<p>SYNTHETIC diagnostics role</p>",
  payDisclosure: "$25.00–$45.00 per hour",
  jobControlVersionId: "00000000-0000-4000-8000-00000000000a",
};

describe("R2-shaped page artifact store (G1-04 / ADR 0005)", () => {
  it("puts content-addressed artifact before activate; idempotent on same bytes", async () => {
    const store = createR2MemoryArtifactStore();
    const first = await putPageArtifactBeforeActivate(store, ARTIFACT);
    expect(first.contentAddress).toMatch(/^[a-f0-9]{64}$/);
    expect(first.key).toContain(ARTIFACT.jobControlVersionId);

    const second = await putPageArtifactBeforeActivate(store, ARTIFACT);
    expect(second.contentAddress).toBe(first.contentAddress);

    const got = await store.getByContentAddress(first.contentAddress);
    expect(got?.body.title).toContain("SYNTHETIC");
  });

  it("fail-closed when binding unavailable (no silent activate path)", async () => {
    const store = createR2MemoryArtifactStore();
    store.setAvailable(false);
    await expect(putPageArtifactBeforeActivate(store, ARTIFACT)).rejects.toThrow(
      /artifact_store_unavailable/,
    );
  });
});
