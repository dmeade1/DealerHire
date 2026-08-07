import { describe, expect, it } from "vitest";
import {
  createR2BucketArtifactStore,
  createR2MemoryArtifactStore,
  getDefaultArtifactStore,
  putPageArtifactBeforeActivate,
  resetDefaultArtifactStoreForTests,
  setDefaultArtifactStore,
  wireArtifactStoreFromEnv,
  type R2LikeBucket,
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

  it("setDefaultArtifactStore shares publish/read singleton", async () => {
    resetDefaultArtifactStoreForTests();
    const injected = createR2MemoryArtifactStore();
    setDefaultArtifactStore(injected);
    expect(getDefaultArtifactStore()).toBe(injected);
    const stored = await putPageArtifactBeforeActivate(getDefaultArtifactStore(), ARTIFACT);
    const got = await injected.getByContentAddress(stored.contentAddress);
    expect(got?.body.title).toContain("SYNTHETIC");
    resetDefaultArtifactStoreForTests();
  });

  it("wireArtifactStoreFromEnv no-ops without binding; wires R2 when present", async () => {
    resetDefaultArtifactStoreForTests();
    expect(wireArtifactStoreFromEnv({})).toBe(false);
    expect(getDefaultArtifactStore().name).toBe("r2_memory");

    const objects = new Map<string, string>();
    const bucket: R2LikeBucket = {
      async put(key, value) {
        objects.set(key, value);
      },
      async get(key) {
        const value = objects.get(key);
        if (value === undefined) return null;
        return { text: async () => value };
      },
    };
    expect(wireArtifactStoreFromEnv({ PUBLIC_ARTIFACTS: bucket })).toBe(true);
    expect(getDefaultArtifactStore().name).toBe("r2_bucket");
    const stored = await putPageArtifactBeforeActivate(getDefaultArtifactStore(), ARTIFACT);
    expect(objects.has(`pages/by-hash/${stored.contentAddress}.json`)).toBe(true);
    resetDefaultArtifactStoreForTests();
  });

  it("R2 bucket adapter honors put-before-activate + content-address get", async () => {
    const objects = new Map<string, string>();
    const bucket: R2LikeBucket = {
      async put(key, value) {
        objects.set(key, value);
      },
      async get(key) {
        const value = objects.get(key);
        if (value === undefined) return null;
        return { text: async () => value };
      },
    };
    const store = createR2BucketArtifactStore(bucket);
    expect(store.name).toBe("r2_bucket");
    const stored = await putPageArtifactBeforeActivate(store, ARTIFACT);
    expect(objects.has(`pages/by-hash/${stored.contentAddress}.json`)).toBe(true);
    expect(objects.has(stored.key)).toBe(true);
    const got = await store.getByContentAddress(stored.contentAddress);
    expect(got?.body.title).toContain("SYNTHETIC");
  });
});
