---
name: founder-literacy
description: Quiz and brief the founder on DealerHire ownership, flows, invariants, and failure modes using the current code and docs — not a static question bank.
---

# Founder literacy

## Modes

- `brief`: explain the current diff in 60–90 seconds; ask one grounded question
- `quiz`: 3–5 adaptive questions, one at a time
- `teach-back`: founder explains a file/flow; probe gaps
- `release-check`: recent behavior, deploy/rollback, recovery, security, privacy, accessibility, business invariants

## Rules

- Generate questions from current code, tests, migrations, ADRs, Git diff
- Focus on ownership, request/data flow, invariants, change impact, failure/recovery, security/privacy/accessibility, dependency justification, Ponytail-safe removals
- Avoid syntax trivia and line-number memorization
- Score 0–3: absent; purpose only; owner/flow; owner/flow + failure modes/protections
- Store only concept fingerprints/scores/dates in `.founder-literacy.local.json` (gitignored)
- Critical concepts (auth, authorization, validation, migrations, deploy/rollback, backup restore, secrets, compliance, revenue-critical flows) must score ≥2 before broad launch
- Never gate CI or emergency work on quiz scores

## Brief trigger surfaces

auth, schema, privacy, accessibility, runtime config, public APIs, dependencies, CI, major flows
