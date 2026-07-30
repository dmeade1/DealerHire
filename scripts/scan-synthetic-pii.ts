/**
 * G1-11 guard: intake receipt paths, false inventory, and runtime telemetry PII (INV-37).
 *
 * - Receipt routes must use issueAcceptanceReceipt + G1 normalize.
 * - Runtime: no console.* in intake/API/worker hot paths; safe-event rejects PII keys.
 * - Static: forbid email/phone-like string literals in telemetry module misuse patterns.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const checks: Array<{ file: string; forbid?: RegExp; require?: RegExp; message: string }> = [
  {
    file: "src/app/api/applications/route.ts",
    require: /issueAcceptanceReceipt/,
    message: "applications route must delegate receipts to issueAcceptanceReceipt",
  },
  {
    file: "src/app/api/applications/route.ts",
    require: /synthetic:\s*true/,
    message: "applications route must label G1 payloads SYNTHETIC",
  },
  {
    file: "src/app/api/applications/route.ts",
    require: /if\s*\(\s*!result\.accepted\s*\)/,
    message: "applications route must gate accepted responses on issueAcceptanceReceipt result",
  },
  {
    file: "src/workers/intake-api.ts",
    require: /normalizeG1StructuredPayload/,
    message: "intake-api must normalize/reject G1 structuredPayload before Hyperdrive",
  },
  {
    file: "src/workers/intake-api.ts",
    require: /issueAcceptanceReceipt/,
    message: "intake-api must issue receipts only via issueAcceptanceReceipt",
  },
  {
    file: "src/modules/intake/submit.ts",
    require: /normalizeG1StructuredPayload/,
    message: "issueAcceptanceReceipt must normalize G1 structuredPayload (sole fingerprint step)",
  },
  {
    file: "src/modules/intake/g1-payload.ts",
    require: /client_fingerprint_rejected/,
    message: "G1 normalize must reject client-supplied fingerprint fields",
  },
  {
    file: "src/app/dealer/applicants/page.tsx",
    forbid: /app_demo_001/,
    message: "applicants inventory must not show placeholder app_demo_001 as live data",
  },
  {
    file: "src/platform/telemetry/safe-event.ts",
    require: /telemetry_pii_rejected/,
    message: "safe-event must reject PII before emit",
  },
  {
    file: "src/platform/telemetry/safe-event.ts",
    require: /FORBIDDEN_KEYS/,
    message: "safe-event must maintain forbidden PII key set",
  },
  {
    file: "src/modules/intake/submit.ts",
    require: /emitSafeEvent/,
    message: "acceptance path must emit safe telemetry (not raw console PII)",
  },
  {
    file: "db/seed/synthetic-tenant.sql",
    require: /SYNTHETIC/,
    message: "synthetic tenant seed must label fixtures SYNTHETIC",
  },
  {
    file: "db/seed/synthetic-tenant.sql",
    forbid: /'Fixed Operations'/,
    message: "team name in seed must include SYNTHETIC label",
  },
  {
    file: "src/modules/skeleton/vertical-slice.ts",
    require: /SYNTHETIC/,
    message: "vertical-slice demo listing must be labeled SYNTHETIC",
  },
  {
    file: "src/app/dealer/applicants/demo/page.tsx",
    forbid: /app_demo_001/,
    message: "demo applicant shell must not invent app_demo_001 as live inventory",
  },
  {
    file: "docs/partners/ny-design-partner-dossier.md",
    require: /SYNTHETIC/,
    message: "partner dossier must label SYNTHETIC fixtures (G1-16)",
  },
  {
    file: "docs/partners/ny-design-partner-dossier.md",
    require: /NO LIVE PARTNER SELECTED/,
    message: "partner dossier must not silently claim live partner selection (G1-16)",
  },
];

const RUNTIME_NO_CONSOLE_DIRS = [
  "src/modules/intake",
  "src/app/api/applications",
  "src/workers",
  "src/platform/telemetry",
];

const CONSOLE_RE = /\bconsole\.(log|info|debug|warn|error)\s*\(/;
const EMAIL_IN_SRC = /["'`][^"'`]*[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}[^"'`]*["'`]/i;

async function walkTsFiles(dir: string): Promise<string[]> {
  const abs = path.join(process.cwd(), dir);
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(abs, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const rel = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await walkTsFiles(rel)));
    } else if (ent.isFile() && /\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith(".test.ts")) {
      out.push(rel);
    }
  }
  return out;
}

async function main() {
  let failed = false;
  for (const check of checks) {
    const body = await readFile(path.join(process.cwd(), check.file), "utf8");
    if (check.forbid && check.forbid.test(body)) {
      console.error(`FAIL ${check.file}: ${check.message}`);
      failed = true;
    } else if (check.require && !check.require.test(body)) {
      console.error(`FAIL ${check.file}: ${check.message}`);
      failed = true;
    } else {
      console.log(`OK ${check.file}`);
    }
  }

  for (const dir of RUNTIME_NO_CONSOLE_DIRS) {
    for (const file of await walkTsFiles(dir)) {
      const body = await readFile(path.join(process.cwd(), file), "utf8");
      if (CONSOLE_RE.test(body)) {
        console.error(`FAIL ${file}: console.* forbidden on intake/telemetry hot path (use emitSafeEvent)`);
        failed = true;
      } else {
        console.log(`OK runtime-no-console ${file}`);
      }
    }
  }

  // Telemetry module itself must not embed sample emails.
  const safeBody = await readFile(
    path.join(process.cwd(), "src/platform/telemetry/safe-event.ts"),
    "utf8",
  );
  if (EMAIL_IN_SRC.test(safeBody)) {
    console.error("FAIL safe-event.ts: must not contain email-like string literals");
    failed = true;
  }

  if (failed) process.exit(1);
  console.log("Synthetic PII / false-inventory / runtime telemetry scan passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
