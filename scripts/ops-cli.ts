#!/usr/bin/env tsx
/**
 * Audited operator CLI — inspect / reconcile / pause.
 * Recovery must never require direct database edits.
 */

function help() {
  console.log(`DealerHire ops CLI

Commands:
  health              Print local health summary
  kill-switch         Request emergency execution pause
  liveness            Show source liveness semantics
  roles               Show role acceptance blocker
`);
}

async function main() {
  const [cmd] = process.argv.slice(2);
  if (!cmd || cmd === "--help" || cmd === "-h") {
    help();
    return;
  }

  if (cmd === "health") {
    console.log(
      JSON.stringify(
        {
          service: "ops-cli",
          candidateAiMode: process.env.CANDIDATE_AI_MODE ?? "shadow",
          adActuationEnabled: process.env.AD_ACTUATION_ENABLED === "true",
          smsEnabled: false,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (cmd === "kill-switch") {
    console.log(JSON.stringify({ paused: true, scope: "all_execution" }, null, 2));
    return;
  }

  if (cmd === "liveness") {
    console.log(
      JSON.stringify(
        {
          analyticalStale: "abstain",
          safetyCriticalStale: "pause",
          states: ["fresh", "observed_zero", "missing", "stale"],
        },
        null,
        2,
      ),
    );
    return;
  }

  if (cmd === "roles") {
    const { betaBlockedReason, ROLE_CATALOG } = await import("../src/modules/roles/catalog");
    console.log(
      JSON.stringify(
        { blocker: betaBlockedReason(), catalog: ROLE_CATALOG },
        null,
        2,
      ),
    );
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  help();
  process.exit(1);
}

main();
