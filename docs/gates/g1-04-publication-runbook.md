# G1-04 publication runbook (SYNTHETIC)

Prove listing → audit → approve → put-before-activate → `PageRelease` → public fetch without live applicant PII.

## Prerequisites

```bash
cp .env.example .env   # DATABASE_URL (+ admin for migrate/seed)
pnpm db:up
pnpm db:migrate
pnpm db:seed
```

## One-command local publish

```bash
pnpm ops publish:demo
pnpm ops health        # demoPageReleaseActive should be true
pnpm dev               # open http://localhost:3000/jobs/demo
```

`publish:demo` writes the content-addressed artifact into the **process-local memory store** shared by the CLI process, then activates the Postgres `PageRelease` pointer. The Next.js server has its own memory store process — after CLI publish, `/jobs/demo` still serves from the **Postgres manifest fallback** (`artifactSource: page_release_manifest`) until R2 is Selected or publish runs inside the same Node process as Next.

Integration tests assert the shared-store path (`artifactSource: r2_memory`) by publishing and reading in one Vitest process.

## Evidence commands

| Check | Command / path |
| --- | --- |
| Unit put-before-activate + R2 adapter | `pnpm test` (`artifact-store.test.ts`) |
| Shared store → public fetch | `pnpm test:integration` (`g1-listing-publish.test.ts`) |
| Ops walkthrough | `pnpm ops publish:demo` then `pnpm ops health` |
| Healthz (Next) | `GET /healthz` |
| Worker preview health only | `GET …workers.dev/health` (stub; not OpenNext) |

## Live R2 (lift G1-04 Waived → Pass)

G1 Conditional close (2026-08-07) Waives live R2 after proving the synthetic path. To lift:

1. Permanent Cloudflare account: `wrangler login` (temp accounts **cannot** bind R2).
2. Create bucket `dealerhire-public`.
3. Uncomment `[[r2_buckets]]` / `PUBLIC_ARTIFACTS` in `wrangler.toml` (platform-web / OpenNext host — not backplane for G1).
4. Bootstrap already calls `wireArtifactStoreFromEnv(env)` in `src/workers/platform-web.ts` — no extra wire step once the binding exists. For Next local/prod, call the same helper from your server bootstrap if publish/read run outside the Worker.
5. Re-run publish + public fetch; expect `artifactSource: r2_bucket` (and `/health` reports `artifactStore: r2_bucket`).

## Honest gaps

- Temp Cloudflare accounts **cannot** bind R2.
- `platform-web` Worker today is a `/health` stub — public `/jobs/*` is Next local until OpenNext is Selected.
- Memory store is not durable across restarts or isolates.
