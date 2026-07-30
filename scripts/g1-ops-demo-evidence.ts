#!/usr/bin/env tsx
/**
 * Capture G1-12 ops demo evidence (terminal transcript JSON).
 * Requires local DB + OPS_CONTROL_SECRET (+ CAPABILITY_SECRET for mutations).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "./load-env";

loadEnvFile();

const outDir = path.join(process.cwd(), "docs/gates/evidence");
mkdirSync(outDir, { recursive: true });

function runOps(args: string[]): { ok: boolean; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("pnpm", ["ops", ...args], {
      encoding: "utf8",
      env: process.env,
      maxBuffer: 4 * 1024 * 1024,
    });
    return { ok: true, stdout, stderr: "" };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string; status?: number };
    return {
      ok: false,
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? e.message ?? "failed",
    };
  }
}

const steps: Array<{ name: string; args: string[]; optional?: boolean }> = [
  { name: "health", args: ["health"] },
  { name: "kill-switch-status", args: ["kill-switch:status"], optional: true },
  { name: "liveness", args: ["liveness"] },
  { name: "outbox-inspect", args: ["outbox:inspect", "--limit", "10"], optional: true },
  { name: "dlq-inspect", args: ["dlq:inspect", "--limit", "10"], optional: true },
  { name: "drain-list", args: ["drain", "--limit", "10"], optional: true },
  { name: "publish-demo", args: ["publish:demo"], optional: true },
];

const gitSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const results: {
  capturedAt: string;
  gitSha: string;
  script: string;
  steps: Record<string, { ok: boolean; stdout: string; stderr: string }>;
} = {
  capturedAt: new Date().toISOString(),
  gitSha,
  script: "docs/gates/g1-ops-demo-script.md",
  steps: {},
};

let hardFail = false;
for (const step of steps) {
  const out = runOps(step.args);
  results.steps[step.name] = {
    ok: out.ok,
    stdout: out.stdout.slice(0, 4000),
    stderr: out.stderr.slice(0, 1000),
  };
  if (!out.ok && !step.optional) hardFail = true;
}

const outPath = path.join(outDir, "g1-ops-demo-transcript.json");
writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`Wrote ${outPath}`);
if (hardFail) {
  console.error("Required ops demo steps failed.");
  process.exit(1);
}
console.log("G1 ops demo evidence capture complete (see optional step failures in JSON).");
