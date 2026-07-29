# G1 ops recovery demo script (INV-38 / G1-12)

Synthetic skeleton only — no live PII, no live ads.

## Prerequisites

- `pnpm db:up && pnpm db:migrate && pnpm db:seed`
- `DATABASE_URL`, `OPS_CONTROL_SECRET`, `CAPABILITY_SECRET` set (see `.env.example`)
- Signed ops actor (`DH_ACTOR_TOKEN` / `DH_ACTOR_SIG`) for mutations; `--break-glass` is emergency-only

## Script

1. **Health** — `pnpm ops health` (candidate AI shadow; ad actuation off).
2. **Kill-switch arm** — prefer UI `/ops` with form-minted signed actor, or CLI with `--actor-token` / `--actor-sig`.  
   Emergency only: `--break-glass`. Confirm: `pnpm ops kill-switch:status`.
3. **Resume** — `/ops` resume form or CLI `--resume` with reason + signed actor.
4. **Outbox inspect** — `pnpm ops outbox:inspect --limit 20` (OPS_CONTROL_SECRET; no break-glass).
5. **NeedsReconciliation** — open `/ops/reconciliation`; open commands table must not offer blind recreate. Resolve via read-back + `resolveNeedsReconciliation` in code/tests.
6. **Safe replay** — `pnpm ops outbox:replay --id <uuid>` with signed actor on `command.queued` only when queued/executing; expect refusal under `needs_reconciliation`.
7. **Liveness** — `/ops/liveness` or `pnpm ops liveness` shows `source_liveness` with advise/pause.

## Evidence

- Record terminal output + screenshot of `/ops`, `/ops/reconciliation`, `/ops/liveness`.
- Link artifacts from the PR or gate evidence folder when available.
