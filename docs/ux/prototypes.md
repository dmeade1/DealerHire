# Prototypes — scope & wireframes

**Version:** 0.1 · **Date:** 2026-07-28

## 1. What low-fi covers

Low-fidelity (this doc + clickable gray boxes later) must cover **entire P0 journey**:

- Onboarding attention + operating facts blocked state  
- Listing edit → audit findings → approvals → release  
- Mobile apply → receipt (incl. PendingUpload)  
- Magic-link status / correction / privacy / accommodation  
- Reviewer evidence matrix → milestones → start  
- Campaign CSV import → NeedsReconciliation  
- ATS delivery failure → replay  
- Ops envelope inspect → replay → kill switch  
- Analytics hub with freshness/claim badges  

Low-fi validates **flow, authority, states, and copy placement**—not visual polish.

## 2. What high-fi covers (only critical paths)

Produce high-fidelity after low-fi acceptance, limited to:

1. Mobile application + receipt (including degraded resume)  
2. Listing approval effect-manifest  
3. Reviewer evidence matrix  
4. Analytics quality tile + campaign freshness  
5. Operator recovery envelope detail  

High-fi validates WCAG, brand override contrast, and dense matrix readability. Secondary settings remain low-fi longer.

## 3. Validation method

- Partner: P-HR, P-REV, P-ADM walk JB-02, JB-05, JB-06  
- Applicants: ≥5 representative mobile users for apply→receipt (target ≥90% unassisted)  
- Ops: P-REC dry-run JB-08  
- Counsel: review notice placement and analytics claim footers  

---

## 4. ASCII wireframes

### W-01 — Mobile application (SCR-PUB-03)

```text
┌─────────────────────────────┐
│ {DealerMark}        A11y    │
│ Service Advisor             │
│ Brooklyn, NY                │
│ Pay $22–$32/hr + …     [i]  │
├─────────────────────────────┤
│ Apply · Step 2 of 3         │
│                             │
│ Contact                     │
│ Name  [________________]    │
│ Email [________________]    │
│ Phone [________________]    │
│                             │
│ Experience                  │
│ [textarea................]  │
│                             │
│ Requirements                │
│ ASE A6  ( )Y ( )N ( )NA     │
│ …                           │
│                             │
│ Notices                     │
│ [Application terms v1]  ▾   │
│ [Privacy at collection] ▾   │
│ [Human review / tools]  ▾   │
│                             │
│ Optional demographics       │
│ (Not used for hiring)       │
│ [Skip]  [Answer]            │
│                             │
│ Resume                      │
│ [Choose file]  PDF/DOC      │
│                             │
│ ┌─────────────────────────┐ │
│ │      Submit application │ │
│ └─────────────────────────┘ │
│ Accommodation link          │
└─────────────────────────────┘
```

**Checks:** pay visible; notices separated; demos optional; sticky CTA; no account wall.

---

### W-02 — Listing approval effect-manifest (SCR-DLR-10)

```text
┌──────────────────────────────────────────────────────────┐
│ Jobs / Service Advisor / Approvals                       │
│ JobControlVersion jcv_0192 · ReviewReady                 │
├──────────────────────────────────────────────────────────┤
│ EFFECT MANIFEST (server)                                 │
│ Tenant: Hudson Motors  Rooftop: Brooklyn                 │
│ Title: Service Advisor · Locale: en                      │
│ Location: Brooklyn, NY · Remote: No                      │
│ Pay: $22.00–$32.00 USD / hour                            │
│ Structure: hourly + OT per policy; benefits summary…     │
│ Requirements hash: reqset_88af… (12 must-haves)          │
│ Rubric version: rub_0041                                 │
│ Public slug: /jobs/service-advisor                       │
│ Disclosures: COPY-PAY-01.v1 · COPY-EOE-01.v1             │
│                                                          │
│ Diff vs previous approved                                │
│ + base_max 30 → 32                                       │
│ ~ description paragraph 2                                │
│                                                          │
│ Approvals                                                │
│ [x] Requirements approved by A. Rivera 2026-07-20        │
│ [x] Compensation approved by A. Rivera 2026-07-20        │
│ [x] Rubric approved by A. Rivera 2026-07-20              │
│                                                          │
│ ! Concierge cannot approve (delegation lacks HR caps)    │
│                                                          │
│ [ Approve publication ]     [ Return to audit ]          │
└──────────────────────────────────────────────────────────┘
```

**Checks:** I-01/I-09; manifest not client-authored; diff visible.

---

### W-03 — Reviewer evidence matrix (SCR-REV-02)

```text
┌──────────────────────────────────────────────────────────┐
│ Applications / APP-10482 · Neutral order #3              │
│ JCV jcv_0192 · Rubric rub_0041 · No AI scores            │
│ Banner: none                                             │
├──────────────────────────────────────────────────────────┤
│ Applicant: J. Lee · Applied 2026-07-27                   │
│ Resume: Linked                      [Open original]      │
├──────────────┬─────────────┬─────────────┬───────────────┤
│ Requirement  │ Answer      │ Resume      │ Status        │
├──────────────┼─────────────┼─────────────┼───────────────┤
│ ASE A6       │ Yes, 2019   │ p.1 “ASE…”  │ (•) present   │
│ OEM EV cert  │ —           │ not found   │ ( ) unknown   │
│ Sat schedule │ Yes         │ —           │ ( ) needs_ver │
│ …            │             │             │               │
├──────────────┴─────────────┴─────────────┴───────────────┤
│ Disposition                                              │
│ ( ) Advance  ( ) Hold  ( ) Decline                       │
│ Rationale [                                         ]    │
│ System reliance: Manual primary evidence (beta)          │
│ [ Record decision ]                                      │
└──────────────────────────────────────────────────────────┘
```

**Checks:** absence=unknown; no composite; vault hidden; keyboardable table.

---

### W-04 — Pending-resume receipt (SCR-APP-02)

```text
┌─────────────────────────────┐
│ Application received        │
│                             │
│ ID: AH-7K2M-9QPC            │
│ Service Advisor · Brooklyn  │
│                             │
│ ✓ Application accepted      │
│ ! Resume: Pending upload    │
│   Your application is saved.│
│   Resume not fully stored.  │
│                             │
│ [ Retry resume upload ]     │
│                             │
│ Email sent to j***@mail.com │
│ [ Open status link ]        │
│ Accommodation · Privacy     │
└─────────────────────────────┘
```

**Checks:** not framed as failure; I-03/I-04; copy IDs receipt + pending.

---

### W-05 — Operator recovery (SCR-OPS-02/03)

```text
┌──────────────────────────────────────────────────────────┐
│ OPS / Recovery                    Delegation: Hudson★    │
│ Acting as Hudson Motors · expires 18:40 · caps: inspect, │
│ replay (no HR approve)                                   │
├──────────────────────────────────────────────────────────┤
│ Envelope env_90c2                                        │
│ State: Accepted · 2026-07-28T14:02:11Z                   │
│ Idempotency: 3f2c…                                       │
│ Application public ID: AH-7K2M-9QPC                      │
│ Resume state: Quarantined                                │
│ Projection: Missing Application row                      │
│ Queue publish: non-gating · attempts 2                   │
│                                                          │
│ PII display: masked email / name on confirm only         │
│                                                          │
│ [ Replay ingest ]  [ Rescan resume ]  [ Open recon board]│
│                                                          │
│ Audit: last actions                                      │
│ 14:05 replay by ops_user · result: Projected             │
└──────────────────────────────────────────────────────────┘
```

**Checks:** I-17; delegation banner; no SQL; masked PII; kill switch elsewhere.

---

## 5. Prototype file naming (when Figma/code added)

| ID | Path suggestion |
| --- | --- |
| W-01 | `design/prototypes/mobile-apply.fig` / story |
| W-02 | `design/prototypes/effect-manifest.fig` |
| W-03 | `design/prototypes/evidence-matrix.fig` |
| W-04 | `design/prototypes/receipt-pending-resume.fig` |
| W-05 | `design/prototypes/ops-recovery.fig` |

## 6. Exit criteria for prototype phase (feeds G0 UX)

- [ ] All P0 journeys walked in low-fi  
- [ ] W-01…W-05 reviewed with matching personas  
- [ ] No deferred feature presented as primary CTA  
- [ ] Authority denials demonstrated (concierge ≠ HR approve)  
- [ ] Degraded resume + NeedsReconciliation states shown
