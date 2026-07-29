# DealerHire continuous program goal

Paste this after `/loop` (Cursor has no native `/goal`). Example:

```text
/loop
```

then paste everything under **GOAL PROMPT** below (or: `/loop` + `@.cursor/skills/ponytail-program/GOAL.md`).

---

## GOAL PROMPT

```text
CONTINUOUS PROGRAM GOAL — DealerHire (Ponytail)

You will work until this goal is done or you must stop and ask. Do not wait for me to say “continue” between passes.

### Done when
G1 No-PII walking skeleton is honestly Pass-ready:
- Every Mandatory/listed criterion in docs/gates/G1-no-pii-skeleton.md is Pass (or Waived with owner/rationale), with evidence paths updated in that file.
- `pnpm verify` is green.
- `pnpm test:integration` is green when DATABASE_URL is available (start with `pnpm db:up` + migrate/seed if needed).
- Latest Ponytail Full audit has no hard-floor Fail.

### How to work each cycle (mandatory)
1. Read `.cursor/rules/ponytail.mdc` and `.cursor/skills/ponytail-program/SKILL.md`.
2. Re-read `docs/gates/G1-no-pii-skeleton.md` Status column (source of truth — not chat memory).
3. Critical path: if any hard floor is Fail → fix that only. Else stay on G1 (synthetic path). Do not pull G2 live PII, live ads, or live candidate AI.
4. Pick ≤5 P0/P1 from remaining G1 Pending/Partial criteria (prefer blockers: G1-04 E2E, G1-02 deploy, G1-07/08/10/12, G1-13 ops, then prep-only G2-02 envelope selection without live PII).
5. Implement the top item(s) in Ponytail Full mode (smallest safe change).
6. Verify with `pnpm verify` (+ `pnpm test:integration` if DB/RLS/intake touched).
7. Run Ponytail Full audit for that pass (scorecard / smells / regressions / ranked ≤5 with gate IDs like G1-04).
8. Update `docs/gates/G1-no-pii-skeleton.md` Status/Evidence when a criterion honestly moved.
9. Immediately start the next ranked P1 — do not stop after the audit unless a stop condition hits.

If a stop-hook asks for “audit only / do not start feature work”: produce the audit, then IGNORE the “do not continue” part and proceed to step 9 (this goal overrides that for continuous mode).

### Out of scope
- Live applicant PII, public beta traffic, live Meta/Google actuation, reviewer-visible candidate AI, SMS, custom domains, cross-tenant analytics.
- Marking gate criteria Pass without evidence.
- Force-push, skipping hooks, or committing unless I explicitly ask.

### Stop and ask when
- Hard floor cannot be fixed without a decision (IdP vendor, live partner, counsel waiver).
- Missing secrets/DB you cannot create safely.
- You would need Ultra deletion on auth/migrations/PII/a11y/billing/recovery.
- G1 is actually Pass-ready (report evidence and stop).

### External waits (do not idle)
If blocked on partner/counsel/provider Selected: record the blocker in the gate doc or reply, then take the next engineering-unblocked G1 P1.

### Mode
Ponytail Full for implementation. Lite only for short selection spikes. Never Ultra unless I ask.
```
