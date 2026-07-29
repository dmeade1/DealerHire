/**
 * R2-shaped content-addressed page artifact store (ADR 0005 / G1-04 spike).
 * Put immutable JSON by content address, then switch PageRelease pointer.
 * Not Selected for production yet — in-memory proves put-before-activate + fail-closed.
 */

import type { PageArtifact } from "@/modules/publication/release";
import { buildPageManifest } from "@/modules/publication/release";

export type StoredPageArtifact = {
  key: string;
  contentAddress: string;
  body: PageArtifact;
  putAt: string;
};

export interface PageArtifactStore {
  readonly name: "r2_memory";
  putImmutable(artifact: PageArtifact): Promise<StoredPageArtifact>;
  getByContentAddress(contentAddress: string): Promise<StoredPageArtifact | null>;
  setAvailable(available: boolean): void;
}

export function createR2MemoryArtifactStore(): PageArtifactStore {
  const objects = new Map<string, StoredPageArtifact>();
  let available = true;

  return {
    name: "r2_memory",
    setAvailable(next) {
      available = next;
    },
    async putImmutable(artifact) {
      if (!available) {
        throw new Error("artifact_store_unavailable");
      }
      const manifest = buildPageManifest(artifact);
      const existing = objects.get(manifest.contentAddress);
      if (existing) {
        // Content-addressed: identical bytes are a no-op (idempotent put).
        return existing;
      }
      const stored: StoredPageArtifact = {
        key: manifest.artifactKey,
        contentAddress: manifest.contentAddress,
        body: artifact,
        putAt: new Date().toISOString(),
      };
      objects.set(manifest.contentAddress, stored);
      return stored;
    },
    async getByContentAddress(contentAddress) {
      if (!available) {
        throw new Error("artifact_store_unavailable");
      }
      return objects.get(contentAddress) ?? null;
    },
  };
}

/** Process-local G1 default (stand-in until live R2 Selected). Shared by publish + public-read. */
let defaultStore: PageArtifactStore | null = null;

export function getDefaultArtifactStore(): PageArtifactStore {
  if (!defaultStore) defaultStore = createR2MemoryArtifactStore();
  return defaultStore;
}

/**
 * ADR 0005 order: upload immutable artifact first, verify, then activate pointer.
 * Activation is caller's responsibility (Postgres PageRelease) after put succeeds.
 */
export async function putPageArtifactBeforeActivate(
  store: PageArtifactStore,
  artifact: PageArtifact,
): Promise<StoredPageArtifact> {
  const stored = await store.putImmutable(artifact);
  const verified = await store.getByContentAddress(stored.contentAddress);
  if (!verified || verified.contentAddress !== stored.contentAddress) {
    throw new Error("artifact_verify_failed");
  }
  return verified;
}
