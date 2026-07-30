#!/usr/bin/env tsx
/**
 * Audited operator CLI — inspect / reconcile / pause.
 * Recovery must never require direct database edits.
 *
 * Kill-switch mutations require OPS_CONTROL_SECRET plus a signed ops actor
 * (DH_ACTOR_TOKEN + DH_ACTOR_SIG, or --actor-token / --actor-sig).
 * Break-glass: --break-glass allows freeform --actor when secret is present;
 * the audit line records break_glass=true (INV-51).
 */

import { loadEnvFile } from "./load-env";

loadEnvFile();

function help() {
  console.log(`DealerHire ops CLI

Commands:
  health              Print local health summary (+ DB / demo PageRelease when DATABASE_URL set)
  publish:demo        SYNTHETIC G1-04: audit → approve → PageRelease → /jobs/demo
  kill-switch         Persist emergency pause/resume (requires DATABASE_URL)
  kill-switch:status  Read durable kill-switch state
  outbox:inspect      List recent outbox events (OPS_CONTROL_SECRET; signed actor optional)
  outbox:replay       Safe requeue (requires signed actor; --break-glass emergency only)
  dlq:inspect         List open dead-letter rows (OPS_CONTROL_SECRET)
  dlq:retry           Safe DLQ retry → outbox (signed actor; --break-glass emergency only)
  drain               List/project unprojected envelopes (OPS_CONTROL_SECRET; --apply to drain)
  liveness            Show source liveness semantics (+ DB rows if DATABASE_URL set)
  roles               Show role acceptance blocker

kill-switch / replay flags:
  --scope intake|campaigns|all_execution
  --reason "text"          (required to change state)
  --resume                 clear pause (default arms pause)
  --actor-token <b64url>   signed actor payload (or DH_ACTOR_TOKEN)
  --actor-sig <b64url>     actor HMAC signature (or DH_ACTOR_SIG)
  --break-glass            emergency only for kill-switch + outbox:replay (audited)
  --actor ref              only with --break-glass (default ops:cli-break-glass)

Environment:
  DATABASE_URL             required for durable kill-switch read/write
  OPS_CONTROL_SECRET       required for kill-switch mutations (fail-closed)
  CAPABILITY_SECRET        required to verify signed actor tokens
  DH_ACTOR_TOKEN / DH_ACTOR_SIG  alternative to --actor-token / --actor-sig
  DH_AUTH_MODE             hmac-g1 (local) | idp (production default)
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
    const summary: Record<string, unknown> = {
      service: "ops-cli",
      candidateAiMode: process.env.CANDIDATE_AI_MODE ?? "shadow",
      adActuationEnabled: process.env.AD_ACTUATION_ENABLED === "true",
      smsEnabled: false,
      authMode: process.env.DH_AUTH_MODE ?? "hmac-g1",
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      opsControlConfigured: Boolean(process.env.OPS_CONTROL_SECRET),
      demoPageReleaseActive: null as boolean | null,
    };
    if (process.env.DATABASE_URL) {
      try {
        const { loadPublicJobBySlug } = await import(
          "../src/modules/publication/public-read"
        );
        const job = await loadPublicJobBySlug("demo");
        summary.demoPageReleaseActive = Boolean(job);
        if (job) {
          summary.demoArtifactSource = job.artifactSource;
          summary.demoContentAddress = job.contentAddress;
        }
      } catch {
        summary.demoPageReleaseActive = false;
      }
    }
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (cmd === "publish:demo") {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL required");
      process.exit(1);
    }
    const { publishSyntheticDemoPage } = await import(
      "../src/modules/publication/publish-demo"
    );
    const result = await publishSyntheticDemoPage();
    console.log(
      JSON.stringify(
        {
          ok: true,
          SYNTHETIC: true,
          ...result,
          note: "Process-local memory artifact store until R2 PUBLIC_ARTIFACTS Selected. Re-run after Next restart if artifactSource is page_release_manifest.",
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
    const { assertOpsControlSecret, readKillSwitches } = await import(
      "../src/modules/ops/kill-switch"
    );
    try {
      assertOpsControlSecret(process.env.OPS_CONTROL_SECRET);
    } catch (err) {
      console.error(err instanceof Error ? err.message : "ops_control_unauthorized");
      process.exit(1);
    }
    const switches = await readKillSwitches();
    console.log(JSON.stringify({ switches, durable: true }, null, 2));
    return;
  }

  if (cmd === "kill-switch") {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL required for durable kill switch");
      process.exit(1);
    }
    const { assertOpsControlSecret, applyKillSwitch } = await import(
      "../src/modules/ops/kill-switch"
    );
    try {
      assertOpsControlSecret(process.env.OPS_CONTROL_SECRET);
    } catch (err) {
      console.error(err instanceof Error ? err.message : "ops_control_unauthorized");
      process.exit(1);
    }

    const scope = flag(args, "--scope") ?? "all_execution";
    const reason = flag(args, "--reason");
    const paused = !args.includes("--resume");
    if (!reason) {
      console.error("--reason is required (no durable change applied)");
      process.exit(1);
    }

    const breakGlass = args.includes("--break-glass");
    const token = flag(args, "--actor-token") ?? process.env.DH_ACTOR_TOKEN;
    const signature = flag(args, "--actor-sig") ?? process.env.DH_ACTOR_SIG;

    let actorSubjectRef: string;
    let breakGlassUsed = false;
    try {
      if (token && signature) {
        const { requireActorFromHeaders } = await import("../src/platform/auth/actor");
        const actor = requireActorFromHeaders(new Headers(), {
          kind: "ops",
          purpose: ["platform_control", "hiring_operations"],
          capability: "ops.pause",
          actorToken: token,
          actorSignature: signature,
        });
        actorSubjectRef = actor.actorSubjectRef;
      } else if (breakGlass) {
        actorSubjectRef = flag(args, "--actor") ?? "ops:cli-break-glass";
        breakGlassUsed = true;
        console.error(
          JSON.stringify({
            audit: "ops_cli_kill_switch_break_glass",
            break_glass: true,
            actorSubjectRef,
            scope,
            paused,
            reason,
          }),
        );
      } else {
        console.error(
          "Signed ops actor required (--actor-token + --actor-sig, or DH_ACTOR_TOKEN + DH_ACTOR_SIG). Use --break-glass only for audited emergency override.",
        );
        process.exit(1);
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : "ops_actor_unauthorized");
      process.exit(1);
    }

    const state = await applyKillSwitch({
      scope,
      paused,
      reason: breakGlassUsed ? `[break-glass] ${reason}` : reason,
      actorSubjectRef,
    });
    console.log(JSON.stringify({ ...state, durable: true, breakGlass: breakGlassUsed }, null, 2));
    return;
  }

  if (cmd === "outbox:inspect" || cmd === "outbox:replay") {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL required");
      process.exit(1);
    }
    const { assertOpsControlSecret, platformOpsActor } = await import(
      "../src/modules/ops/kill-switch"
    );
    try {
      assertOpsControlSecret(process.env.OPS_CONTROL_SECRET);
    } catch (err) {
      console.error(err instanceof Error ? err.message : "ops_control_unauthorized");
      process.exit(1);
    }

    const token = flag(args, "--actor-token") ?? process.env.DH_ACTOR_TOKEN;
    const signature = flag(args, "--actor-sig") ?? process.env.DH_ACTOR_SIG;
    const breakGlass = args.includes("--break-glass");
    let actorSubjectRef: string;
    let breakGlassUsed = false;

    if (cmd === "outbox:inspect") {
      // Read-only: OPS_CONTROL_SECRET is enough; signed actor preferred when present.
      if (token && signature) {
        try {
          const { requireActorFromHeaders } = await import("../src/platform/auth/actor");
          const actor = requireActorFromHeaders(new Headers(), {
            kind: "ops",
            purpose: ["platform_control", "hiring_operations"],
            capability: "ops.inspect",
            actorToken: token,
            actorSignature: signature,
          });
          actorSubjectRef = actor.actorSubjectRef;
        } catch (err) {
          console.error(err instanceof Error ? err.message : "ops_actor_unauthorized");
          process.exit(1);
        }
      } else {
        actorSubjectRef = "ops:cli-inspect";
      }
    } else {
      // Replay mutates outbox — signed actor required; break-glass is emergency-only.
      try {
        if (token && signature) {
          const { requireActorFromHeaders } = await import("../src/platform/auth/actor");
          const actor = requireActorFromHeaders(new Headers(), {
            kind: "ops",
            purpose: ["platform_control", "hiring_operations"],
            capability: "ops.replay",
            actorToken: token,
            actorSignature: signature,
          });
          actorSubjectRef = actor.actorSubjectRef;
        } else if (breakGlass) {
          actorSubjectRef = flag(args, "--actor") ?? "ops:cli-break-glass";
          breakGlassUsed = true;
          console.error(
            JSON.stringify({
              audit: "ops_cli_outbox_replay_break_glass",
              break_glass: true,
              actorSubjectRef,
              cmd,
            }),
          );
        } else {
          console.error(
            "outbox:replay requires signed ops actor (--actor-token + --actor-sig). --break-glass is emergency-only.",
          );
          process.exit(1);
        }
      } catch (err) {
        console.error(err instanceof Error ? err.message : "ops_actor_unauthorized");
        process.exit(1);
      }
    }

    const { withTenantContext } = await import("../src/platform/db/client");
    const { listOutbox, safeReplayOutbox } = await import("../src/modules/ops/outbox");
    const actor = {
      ...platformOpsActor(actorSubjectRef),
      purpose: "hiring_operations" as const,
      capabilities: ["ops.pause", "ops.inspect", "ops.replay"],
    };

    if (cmd === "outbox:inspect") {
      const limit = Number(flag(args, "--limit") ?? "50");
      const rows = await withTenantContext(actor, (sql) => listOutbox(sql, { limit }));
      console.log(JSON.stringify({ count: rows.length, rows, actorSubjectRef }, null, 2));
      return;
    }

    const outboxId = flag(args, "--id");
    if (!outboxId) {
      console.error("--id <outbox-uuid> is required");
      process.exit(1);
    }
    const result = await withTenantContext(actor, (sql) =>
      safeReplayOutbox(sql, { outboxId, actorSubjectRef }),
    );
    console.log(JSON.stringify({ ...result, actorSubjectRef, breakGlass: breakGlassUsed }, null, 2));
    return;
  }

  if (cmd === "dlq:inspect" || cmd === "dlq:retry") {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL required");
      process.exit(1);
    }
    const { assertOpsControlSecret, platformOpsActor } = await import(
      "../src/modules/ops/kill-switch"
    );
    try {
      assertOpsControlSecret(process.env.OPS_CONTROL_SECRET);
    } catch (err) {
      console.error(err instanceof Error ? err.message : "ops_control_unauthorized");
      process.exit(1);
    }

    const token = flag(args, "--actor-token") ?? process.env.DH_ACTOR_TOKEN;
    const signature = flag(args, "--actor-sig") ?? process.env.DH_ACTOR_SIG;
    const breakGlass = args.includes("--break-glass");
    let actorSubjectRef: string;
    let breakGlassUsed = false;

    if (cmd === "dlq:inspect") {
      if (token && signature) {
        try {
          const { requireActorFromHeaders } = await import("../src/platform/auth/actor");
          const actor = requireActorFromHeaders(new Headers(), {
            kind: "ops",
            purpose: ["platform_control", "hiring_operations"],
            capability: "ops.inspect",
            actorToken: token,
            actorSignature: signature,
          });
          actorSubjectRef = actor.actorSubjectRef;
        } catch (err) {
          console.error(err instanceof Error ? err.message : "ops_actor_unauthorized");
          process.exit(1);
        }
      } else {
        actorSubjectRef = "ops:cli-dlq-inspect";
      }
    } else {
      try {
        if (token && signature) {
          const { requireActorFromHeaders } = await import("../src/platform/auth/actor");
          const actor = requireActorFromHeaders(new Headers(), {
            kind: "ops",
            purpose: ["platform_control", "hiring_operations"],
            capability: "ops.replay",
            actorToken: token,
            actorSignature: signature,
          });
          actorSubjectRef = actor.actorSubjectRef;
        } else if (breakGlass) {
          actorSubjectRef = flag(args, "--actor") ?? "ops:cli-break-glass";
          breakGlassUsed = true;
          console.error(
            JSON.stringify({
              audit: "ops_cli_dlq_retry_break_glass",
              break_glass: true,
              actorSubjectRef,
              cmd,
            }),
          );
        } else {
          console.error(
            "dlq:retry requires signed ops actor (--actor-token + --actor-sig). --break-glass is emergency-only.",
          );
          process.exit(1);
        }
      } catch (err) {
        console.error(err instanceof Error ? err.message : "ops_actor_unauthorized");
        process.exit(1);
      }
    }

    const { withTenantContext } = await import("../src/platform/db/client");
    const { listDeadLetters, safeRetryDeadLetter } = await import("../src/modules/ops/dlq");
    const actor = {
      ...platformOpsActor(actorSubjectRef),
      purpose: "hiring_operations" as const,
      capabilities: ["ops.pause", "ops.inspect", "ops.replay"],
    };

    if (cmd === "dlq:inspect") {
      const limit = Number(flag(args, "--limit") ?? "50");
      const rows = await withTenantContext(actor, (sql) => listDeadLetters(sql, { limit }));
      console.log(JSON.stringify({ count: rows.length, rows, actorSubjectRef }, null, 2));
      return;
    }

    const deadLetterId = flag(args, "--id");
    if (!deadLetterId) {
      console.error("--id <dead-letter-uuid> is required");
      process.exit(1);
    }
    const result = await withTenantContext(actor, (sql) =>
      safeRetryDeadLetter(sql, { deadLetterId, actorSubjectRef }),
    );
    console.log(JSON.stringify({ ...result, actorSubjectRef, breakGlass: breakGlassUsed }, null, 2));
    return;
  }

  if (cmd === "drain") {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL required");
      process.exit(1);
    }
    const { assertOpsControlSecret, platformOpsActor } = await import(
      "../src/modules/ops/kill-switch"
    );
    try {
      assertOpsControlSecret(process.env.OPS_CONTROL_SECRET);
    } catch (err) {
      console.error(err instanceof Error ? err.message : "ops_control_unauthorized");
      process.exit(1);
    }
    const apply = args.includes("--apply");
    const limit = Number(flag(args, "--limit") ?? "50");
    const { withTenantContext } = await import("../src/platform/db/client");
    const { listUnprojectedEnvelopes, drainUnprojectedEnvelopes } = await import(
      "../src/modules/intake/drain"
    );
    // List may use hiring_operations; apply needs subject_permission (WITH CHECK on applications).
    const listActor = {
      ...platformOpsActor("ops:cli-drain"),
      purpose: "hiring_operations" as const,
      capabilities: ["ops.inspect", "ops.replay"],
    };
    if (!apply) {
      const rows = await withTenantContext(listActor, (sql) =>
        listUnprojectedEnvelopes(sql, { limit }),
      );
      console.log(JSON.stringify({ count: rows.length, rows, mode: "list" }, null, 2));
      return;
    }
    const drainActor = {
      ...platformOpsActor("ops:cli-drain"),
      purpose: "subject_permission" as const,
      capabilities: ["ops.inspect", "ops.replay"],
    };
    const tenantId =
      flag(args, "--tenant") ??
      process.env.SYNTHETIC_TENANT_ID ??
      drainActor.tenantId;
    const result = await withTenantContext(drainActor, (sql) =>
      drainUnprojectedEnvelopes(sql, { tenantId, limit }),
    );
    console.log(JSON.stringify({ ...result, mode: "apply", tenantId }, null, 2));
    return;
  }

  if (cmd === "liveness") {
    const {
      advisoryDecision,
      executionDecision,
      listSourceLiveness,
    } = await import("../src/modules/liveness/sources");
    let rows: Awaited<ReturnType<typeof listSourceLiveness>> = [];
    if (process.env.DATABASE_URL) {
      const { withTenantContext } = await import("../src/platform/db/client");
      const { platformOpsActor } = await import("../src/modules/ops/kill-switch");
      const actor = {
        ...platformOpsActor("ops:cli-liveness"),
        purpose: "hiring_operations" as const,
      };
      try {
        rows = await withTenantContext(actor, (sql) => listSourceLiveness(sql));
      } catch (err) {
        console.error(err instanceof Error ? err.message : "liveness_read_failed");
        process.exit(1);
      }
    }
    console.log(
      JSON.stringify(
        {
          analyticalStale: "abstain",
          safetyCriticalStale: "pause",
          states: ["fresh", "observed_zero", "missing", "stale"],
          sources: rows.map((r) => ({
            sourceKey: r.source_key,
            state: r.state,
            advisory: advisoryDecision(r.state),
            execution: executionDecision(r.state),
            updatedAt: r.updated_at,
          })),
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

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    // postgres.js keeps the event loop alive until the pool is closed.
    try {
      const { closeSql } = await import("../src/platform/db/client");
      await closeSql();
    } catch {
      // ignore — client may never have opened
    }
  });
