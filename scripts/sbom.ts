#!/usr/bin/env tsx
/**
 * Lightweight dependency SBOM for CI artifacts (G1-14).
 * Uses `pnpm list --depth 0` (direct deps) — avoids unbounded Infinity dumps.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type PnpmPkg = {
  name?: string;
  version?: string;
  private?: boolean;
  dependencies?: Record<string, { version?: string }>;
  devDependencies?: Record<string, { version?: string }>;
};

const pkgs = new Map<string, { name: string; version: string; dev: boolean }>();

function add(name: string, version: string | undefined, dev: boolean): void {
  if (!name || !version) return;
  const key = `${name}@${version}`;
  if (!pkgs.has(key)) pkgs.set(key, { name, version, dev });
}

const raw = execFileSync("pnpm", ["list", "--depth", "0", "--json"], {
  encoding: "utf8",
  maxBuffer: 8 * 1024 * 1024,
});
const parsed = JSON.parse(raw) as PnpmPkg | PnpmPkg[];
const roots = Array.isArray(parsed) ? parsed : [parsed];
for (const root of roots) {
  for (const [name, meta] of Object.entries(root.dependencies ?? {})) {
    add(name, meta.version, false);
  }
  for (const [name, meta] of Object.entries(root.devDependencies ?? {})) {
    add(name, meta.version, true);
  }
}

const components = [...pkgs.values()]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((p) => ({
    type: "library",
    name: p.name,
    version: p.version,
    "bom-ref": `pkg:npm/${p.name}@${p.version}`,
    properties: [{ name: "dealerhire:devDependency", value: String(p.dev) }],
  }));

const bom = {
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    component: {
      type: "application",
      name: "dealerhire",
      version: "0.1.0",
    },
    tools: [{ name: "scripts/sbom.ts", vendor: "DealerHire" }],
  },
  components,
};

const dir = path.join(process.cwd(), "artifacts");
mkdirSync(dir, { recursive: true });
const outPath = path.join(dir, "sbom.cdx.json");
writeFileSync(outPath, JSON.stringify(bom, null, 2));
console.log(`Wrote ${outPath} (${components.length} components)`);
