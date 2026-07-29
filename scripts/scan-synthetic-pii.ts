/**
 * G1-11 lightweight guard: fail if application receipt paths embed raw contact fields
 * or if demo inventory invents fake accepted applications.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const checks: Array<{ file: string; forbid?: RegExp; require?: RegExp; message: string }> = [
  {
    file: "src/app/api/applications/route.ts",
    forbid: /structuredPayload:\s*\{[\s\S]*?\bfullName\b/,
    message: "applications route must not store raw fullName in structuredPayload (use fingerprint)",
  },
  {
    file: "src/app/api/applications/route.ts",
    forbid: /structuredPayload:\s*\{[\s\S]*?\bemail\b/,
    message: "applications route must not store raw email in structuredPayload (use fingerprint)",
  },
  {
    file: "src/app/api/applications/route.ts",
    require: /buildG1StructuredPayloadFromContact/,
    message: "applications route must build G1 payloads via buildG1StructuredPayloadFromContact",
  },
  {
    file: "src/workers/intake-api.ts",
    forbid: /structuredPayload:\s*body\.structuredPayload/,
    message: "intake-api must not pass raw body.structuredPayload into acceptance (normalize first)",
  },
  {
    file: "src/workers/intake-api.ts",
    require: /normalizeG1StructuredPayload/,
    message: "intake-api must normalize G1 structuredPayload before acceptance",
  },
  {
    file: "src/modules/intake/submit.ts",
    require: /normalizeG1StructuredPayload/,
    message: "issueAcceptanceReceipt must normalize G1 structuredPayload (defense in depth)",
  },
  {
    file: "src/app/dealer/applicants/page.tsx",
    forbid: /app_demo_001/,
    message: "applicants inventory must not show placeholder app_demo_001 as live data",
  },
];

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
  if (failed) process.exit(1);
  console.log("Synthetic PII / false-inventory scan passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
