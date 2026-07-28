# Design system — beta UX contracts

**Version:** 0.1 · **Date:** 2026-07-28  
Implementation-oriented tokens and patterns. Prefer **native HTML** controls, Server Components, and progressive enhancement. Visual brand for the dealer public site is partner-configurable within accessibility floors.

---

## 1. Principles

1. **Native first** — `<form>`, `<button>`, `<input>`, `<select>`, `<table>`, `<dialog>` before custom widgets.  
2. **One composition** — applicant first viewport: employer + job title + pay + short description + CTA (no dashboard chrome).  
3. **Evidence over ornament** — reviewer and approval UIs prioritize matrices/manifests.  
4. **Honest state** — freshness, claim class, and degraded resume states are first-class badges.  
5. **WCAG 2.2 AA** — non-negotiable on P0.

Avoid: purple-on-white AI clichés, cream/terracotta default aesthetic, broadsheet density, emoji status, glow shadows, pill soup.

---

## 2. Tokens

### 2.1 Color (platform control plane defaults)

| Token | Light | Dark (optional later) | Use |
| --- | --- | --- | --- |
| `--dh-bg` | `#F7F5F2` | — | App background (warm neutral, not cream hero cliché) |
| `--dh-surface` | `#FFFFFF` | — | Panels |
| `--dh-ink` | `#1C1A17` | — | Text |
| `--dh-muted` | `#5C574E` | — | Secondary text |
| `--dh-border` | `#D9D3C8` | — | Borders |
| `--dh-accent` | `#0B5F4B` | — | Primary actions (deep teal/green) |
| `--dh-accent-contrast` | `#FFFFFF` | — | On accent |
| `--dh-danger` | `#9B1C1C` | — | Errors / kill |
| `--dh-warning` | `#8A5A00` | — | Stale / attention |
| `--dh-success` | `#0F6A38` | — | Accepted / Fresh |
| `--dh-info` | `#184E77` | — | Operational info |

Public dealer pages may override accent/logo; **must** keep contrast ≥ 4.5:1 for body text and ≥ 3:1 for large text/UI.

### 2.2 Typography

| Token | Spec |
| --- | --- |
| `--dh-font-sans` | `"Source Sans 3", "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif` |
| `--dh-font-display` | `"Fraunces", "Source Serif 4", ui-serif, Georgia, serif` (public brand hero only) |
| `--dh-fs-body` | `1rem` / 1.5 |
| `--dh-fs-small` | `0.875rem` |
| `--dh-fs-h1` | `clamp(1.75rem, 2vw + 1rem, 2.25rem)` |
| `--dh-fs-h2` | `1.375rem` |

Do not use Inter/Roboto/Arial as the intentional brand face.

### 2.3 Spacing & radius

| Token | Value |
| --- | --- |
| `--dh-space-1` … `--dh-space-8` | 4px scale |
| `--dh-radius` | `6px` (forms); avoid `999px` pills |
| `--dh-max-readable` | `40rem` (notices, apply) |
| `--dh-max-app` | `72rem` (control plane) |

### 2.4 Motion

| Token | Use |
| --- | --- |
| `--dh-motion-fast` | 120ms opacity/focus |
| `--dh-motion-med` | 200ms panel |
| Respect `prefers-reduced-motion: reduce` | Disable nonessential motion |

Intentional motions (public apply): focus ring fade, sticky CTA appear, receipt success check. No confetti.

---

## 3. Accessibility (WCAG 2.2 AA)

| Requirement | Contract |
| --- | --- |
| Contrast | Body ≥ 4.5:1; UI components ≥ 3:1 |
| Focus | Visible `:focus-visible` ring ≥ 2px; never `outline: none` without replacement |
| Labels | Every input has visible label; errors linked via `aria-describedby` |
| Target size | ≥ 24×24 CSS px (WCAG 2.2); prefer 44×44 on mobile CTA |
| Keyboard | Full apply, matrix, approvals without mouse |
| Status | Use `aria-live` for receipt, upload, replay |
| Language | `lang="en"` |
| Motion | Honor reduced motion |
| Third-party | None on apply/rights/accommodation |
| Testing | axe/lighthouse + manual keyboard + screen reader spot checks |

---

## 4. Form patterns

### 4.1 Anatomy
```text
[Section heading]
[Short help]
[Label]
[Control]
[Hint / error]
```

### 4.2 Patterns
| Pattern | Use |
| --- | --- |
| Single column mobile apply | Default applicant |
| Sectioned fieldset | Notices separated by purpose |
| Sticky primary CTA | Mobile apply confirm |
| Error summary | On submit failure, focus summary |
| Idempotent submit | Disable button; keep client key |
| File upload | Native file input + size/type help |
| Confirm dialog | Native `<dialog>` for publish, kill switch, replay |
| Schema modules | Role-family compensation/requirements blocks |

### 4.3 Anti-patterns
- Placeholder-as-label  
- Optional marketing prechecked  
- Combined “I agree to everything”  
- Custom select that breaks mobile  
- Infinite wizard without progress salvage  

---

## 5. Evidence matrix (reviewer)

### Layout
```text
Requirement | Applicant answer | Resume evidence | Status | Notes
----------- | ---------------- | --------------- | ------ | -----
ASE A6      | "Yes, 2019"      | [excerpt/open]  | present| …
```

### Rules
- Neutral row order = requirement order on JobControlVersion.  
- Status control: native radio/select with values `present | absent_unknown | needs_verify | verified_adverse`.  
- No score column. No sparkline. No “match %”.  
- Sticky job/rubric version header.  
- CorrectionHold banner locks edits.

### Component name
`EvidenceMatrix` — table with row headers, keyboard roving optional but tab order must work.

---

## 6. Effect manifest (approval)

```text
Effect manifest — JobControlVersion {id}
Tenant / Rooftop
Title / Location / Pay range+structure
Requirements hash
Rubric version
Public URL slug
Locale: en
Channel disclosures
Diff vs previous approved (if any)
[ Approve publication ]  [ Cancel ]
```

Manifest is **server-rendered**; client must not recompute semantic effect.

---

## 7. Freshness & claim badges

### FreshnessBadge
| State | Label | Color token |
| --- | --- | --- |
| Fresh | Fresh · as of {ts} | success |
| ObservedZero | Observed zero · as of {ts} | info |
| Missing | Missing | warning |
| Stale | Stale · abstain/pause | danger/warning |

### ClaimClassBadge
| Class | Label |
| --- | --- |
| operational | Operational |
| descriptive | Descriptive |

Always pair analytics tiles with `COPY-ANALYTICS-CLAIM-01`.

### ResumeStateBadge
`Linked` · `Pending upload` · `Quarantined` · `None`

### ReconciliationBadge
`Reconciled` · `Needs reconciliation`

---

## 8. Navigation & chrome

| Surface | Chrome |
| --- | --- |
| Public job | Minimal header: dealer mark, jobs link, accessibility |
| Apply | Progress text (“Step 2 of 3”), no dealer analytics |
| Dealer app | Left nav role-filtered; attention inbox top |
| Ops | Delegation banner mandatory; high-contrast danger actions |

Cards: default **no cards** on public hero. Use cards only for interactive queues (application row, reconcile item).

---

## 9. Public job first viewport budget

Allowed:
1. Dealer brand mark/name (hero-level)  
2. Job title  
3. One short supporting sentence  
4. Pay disclosure  
5. Primary Apply CTA  
6. Dominant full-bleed atmosphere image **or** workplace photo (real context)

Disallowed in first viewport: stats, schedule tables, multi-promo chips, floating badges on image, AI match claims.

---

## 10. Component inventory (P0)

| Component | Native basis |
| --- | --- |
| `Button` | `<button>` / link styled |
| `TextField` | `<input>` / `<textarea>` |
| `SelectField` | `<select>` |
| `Checkbox` / `Radio` | native |
| `FileField` | `<input type=file>` |
| `DialogConfirm` | `<dialog>` |
| `Banner` | status region |
| `FreshnessBadge` | `<span>` + text |
| `EvidenceMatrix` | `<table>` |
| `EffectManifest` | definition list + diff |
| `DelegationBanner` | banner |
| `NoticeBlock` | `<section aria-labelledby>` |
| `EmptyState` | region + CTA |

---

## 11. Content & i18n

- Resource files keyed by Copy ID.  
- Interpolation for dealer/job/pay only.  
- No Spanish resources in beta bundle.

---

## 12. Design QA checklist

- [ ] AA contrast on partner brand override  
- [ ] Keyboard path apply→receipt  
- [ ] Keyboard path evidence matrix→decision  
- [ ] Badges convey state in text, not color alone  
- [ ] Reduced motion OK  
- [ ] No third-party scripts on sensitive pages  
- [ ] Effect manifest matches server payload in E2E
