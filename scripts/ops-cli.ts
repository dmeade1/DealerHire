#!/usr/bin/env tsx
/**
 * Audited operator CLI — inspect / reconcile / pause.
 * Recovery must never require direct database edits.
 */

function help() {
  console.log(`DealerHire ops CLI

Commands:
  health              Print local health summary
  kill-switch         Persist emergency pause/resume (requires DATABASE_URL)
  kill-switch:status  Read durable kill-switch state
  liveness            Show source liveness semantics
  roles               Show role acceptance blocker

kill-switch flags:
  --scope intake|campaigns|all_execution
  --reason "text"          (required to change state)
  --resume                 clear pause (default arms pause)
  --actor ref              actor subject ref (default ops:cli)
`);
}

function flag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

async function main() {
  const args = process.argv.slice(2);
  const [cmd] = args;
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

  if (cmd === "kill-switch:status" || (cmd === "kill-switch" && args.includes("--status"))) {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL required");
      process.exit(1);
    }
    const { readKillSwitches } = await import("../src/modules/ops/kill-switch");
    const switches = await readKillSwitches();
    console.log(JSON.stringify({ switches, durable: true }, null, 2));
    return;
  }

  if (cmd === "kill-switch") {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL required for durable kill switch");
      process.exit(1);
    }
    const scope = flag(args, "--scope") ?? "all_execution";
    const reason = flag(args, "--reason");
    const actor = flag(args, "--actor") ?? "ops:cli";
    const paused = !args.includes("--resume");
    if (!reason) {
      console.error("--reason is required (no durable change applied)");
      process.exit(1);
    }
    const { applyKillSwitch } = await import("../src/modules/ops/kill-switch");
    const state = await applyKillSwitch({
      scope,
      paused,
      reason,
      actorSubjectRef: actor,
    });
    console.log(JSON.stringify({ ...state, durable: true }, null, 2));
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
