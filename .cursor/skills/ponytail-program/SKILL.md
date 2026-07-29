---
name: ponytail-program
description: >-
  Continuous DealerHire program goal (G0→G3 critical path) with Ponytail Full
  audits. Use when the user runs /loop with this goal, @GOAL.md, says set goal,
  work continuously, program goal, or advance gates without waiting for continue.
---

# Ponytail program (continuous goal)

## How the user starts continuous work

Cursor has **no native `/goal`**. Use **`/loop`** + the goal text:

1. In Agent chat type `/loop` (dynamic pacing; or `/loop 2m` for a heartbeat).
2. Attach or paste [GOAL.md](./GOAL.md) (canonical continuous objective).
3. Leave the session running; stop with stop/`/loop` off when G1 is Pass-ready or you need a human decision.

On each cycle: resolve critical path → implement ≤5 P0/P1 → verify → Ponytail Full audit → **immediately take the next P1** (do not wait for the user to say continue). If the stop-hook requests an audit-only turn, complete the audit then continue the queue unless a stop condition in GOAL.md applies.

## When to use

- `/loop` + this skill / `GOAL.md`
- User wants continuous gate advancement without “continue” nudges
- After audits that ranked P0/P1 mapped to gate IDs

Do **not** use for founder-literacy quizzes (use `founder-literacy`) or Ultra deletion on hard floors.

## Authority sources (read, don’t invent)

| Kind | Paths |
| --- | --- |
| Gates | `docs/gates/G0-implementation-ready.md`, `G1-no-pii-skeleton.md`, `G2-live-pii.md`, `G3-beta-ready.md`, `candidate-ai-release.md`, `ad-actuation-release.md`, `post-beta-features.md`, `certification-evidence.md` |
| Floors / mode | `.cursor/rules/ponytail.mdc` |
| Invariants / recovery | `docs/invariant-register.md`, `docs/recovery-criteria.md` |
| Providers | `docs/provider-allowlists.md` |
| ADRs | `docs/adr/` |
| Partners / counsel | `docs/partners/`, `docs/counsel-packet.md` |
| Roles | `docs/role-allocation.md`, `docs/roles/` |

Gate markdown **Status** columns are authoritative for what’s Pending/Partial/Pass. Re-read the **active gate** file at the start of each goal cycle; do not rely on chat memory alone.

## Phase graph (enumerated)

```text
G0 Implementation-ready
  └─(synthetic path exception allowed)─► G1 No-PII walking skeleton
                                            └─► G2 Live-PII foundation
                                                  └─► G3 Beta ready
                                                        ├─► EmploymentAIUse (candidate AI)     [independent; default shadow]
                                                        ├─► Ad actuation release               [independent; default off]
                                                        └─► Other post-beta (Spanish, SMS, custom domains, cross-tenant) [independent]
```

**Hard sequencing**

1. Do not treat G2 work as authorized until G1 gate result can be Pass (or only close Partial items that are true G1 blockers).
2. Do not treat G3 / public applicants as authorized until G2 Pass + certification pack.
3. Never enable live candidate AI or live ad actuation from G1/G2 “continue” work — those gates fail closed until their own criteria Pass.
4. External blockers (live partner, counsel memo, IdP/email/envelope `Selected`) change the critical path: prefer engineering-unblocked work; surface external waits explicitly; do not fake Pass.

## Critical-path resolver (run every cycle)

Execute in order; stop at the first applicable branch. That branch **is** the active goal horizon.

### Step A — Hard-floor Fail?

If the latest Ponytail Full audit scored any hard floor **Fail**, the only goal is: remediate that Fail to Partial/Pass with evidence. Do not advance gate features.

### Step B — Which gate is active?

| If | Active horizon |
| --- | --- |
| G0 blocked only by live-partner Pending **and** synthetic path allowed | **G1** (do not thrash on G0 partner docs) |
| Other Mandatory G0 not Pass/Waived | **G0** |
| G0 OK / synthetic path; G1 not all Pass | **G1** ← default continuous goal in `GOAL.md` |
| G1 Pass; G2 not Pass | **G2** (rewrite goal objective before grinding) |
| G2 Pass; G3 / cert pack not Pass | **G3** |
| G3 Pass; user asks AI or ads | **EmploymentAIUse** or **Ad actuation** only |
| User names a post-beta feature | That gate only, with entry preconditions checked |

### Step C — Rank work inside the active gate

From the active gate’s criteria table, build a queue:

1. **P0** — Correctness/security/privacy/isolation/receipt/operability Fail or false-success risk; any hard-floor Fail.
2. **P1 blockers** — Criteria that are `Fail`/`Pending`/`Partial` and block exit of the active gate; prefer dependencies first (e.g. G2-02 envelope Selected before live PII paths).
3. **External wait** — Partner, counsel, vendor selection: document blocker; pick next **engineering-unblocked** P1; do not idle inventing architecture.
4. **P2** — Hygiene (deps, docs polish) only if no P0/P1 remains.

Cap an implementation pass at **≤5** ranked actions (same as Ponytail audit). Prefer the smallest Full-mode change that moves a criterion toward Pass with linked evidence.

### Step D — Mode

| Situation | Ponytail mode |
| --- | --- |
| Implementing / remediating gate criteria | **Full** |
| Exploring alternatives before selection (envelope DO vs R2+D1, IdP choice) | **Lite** (no premature scaffolding) |
| Deletion/simplification | **Ultra** only if user explicitly asks; never on auth/migrations/PII/a11y/billing/recovery |

### Step E — Goal string (create or refresh)

Shape one measurable objective (define-goal quality bar):

> Advance **{ACTIVE_GATE}** by driving **{CRITERION_IDS}** from {Status} → Pass (or next honest Partial with evidence), via {smallest code/doc/test change}, verified by `{commands}` and gate evidence links. Out of scope: {later gates / live PII / live ads / live AI}. Stop and ask if a hard floor Fail appears or an external selection is required.

If a goal tool exists in the environment, `create_goal` / update with that string; otherwise state the goal at the top of the turn and pursue it.

## Pass loop (mandatory)

```text
1. Resolve critical path (A–E) → active goal
2. Implement ≤ ranked P0/P1 items (Full mode)
3. Verify: pnpm verify (+ pnpm test:integration when DB-touched)
4. Ponytail Full audit (this pass only):
   - Hard-floor scorecard Pass/Partial/Fail + paths
   - Smells + regressions from this pass
   - Ranked next ≤5 P0/P1
5. Re-run critical-path resolver; refresh goal if horizon moved
6. Under continuous `/loop` + GOAL.md: after audit, execute ranked #1 unless a GOAL stop condition applies
```

**Audit-only stop-hook vs continuous goal:** the project stop hook may say “do not start new feature work.” When `GOAL.md` / `/loop` continuous mode is active, that line is overridden: audit, then continue the queue. When the user asked for audit-only (no GOAL/`/loop`), honor audit-only.

## Non-negotiable ceilings (never “optimize past”)

- Application receipt = `ApplicationAcceptanceEnvelope` conditional insert only
- Forced tenant / rooftop / purpose isolation (`FORCE RLS`)
- No raw applicant PII in immutable telemetry
- Candidate AI shadow-only until EmploymentAIUse Pass
- No live Meta/Google actuation until Ad actuation Pass
- G1 = synthetic / no live PII; G2 = closed live-PII; G3 = one-partner beta envelope

## Output templates

### Goal card (start of cycle)

```markdown
## Program goal
- **Horizon:** G{n} / {post-beta gate}
- **Objective:** …
- **Criteria in scope:** {IDs}
- **Verify:** `pnpm verify` [+ integration]
- **Out of scope:** …
- **External waits:** …
```

### Audit card (end of pass)

Use the stop-hook wording: hard-floor scorecard, smells, regressions, ranked next ≤5. Map each ranked item to a gate criterion ID when possible (e.g. `G1-04`, `G2-02`).

---

## Canonical continuous prompt

**Use [GOAL.md](./GOAL.md)** with `/loop`. That file is the paste target (done-when, cycle loop, stop conditions, continuous override of audit-only).
