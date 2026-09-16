# PAXOLAB Design Intelligence — post-D4 reality check

**Date:** 16 Sep 2026  
**Mode:** Double-check of C0–C8 + D0–D4 against runtime. No production code in this pass.  
**Previous snapshot:** `docs/PAXOLAB_DESIGN_INTELLIGENCE_STATUS.md` (pre-D1; header still says logo unused).  
**Repo tests (this check):** `npx vitest run` → **452 passed / 1 failed / 453 total**. Baseline fail remains `phase15.test.ts` `/hex/i`.

---

## 1. Where we are

Two programs ran. Both are **closed**. The product is still a **dual-engine**, not a unified Design Intelligence pipeline.

| Program | Scope | Status |
|---|---|---|
| **C0–C8** | Conversation → brief → structure offer → direction talk → copy → learning gate → LLM allowlist | Closed |
| **D0–D4** | Honesty on P1: logo/scale, critic=C6, 2–3 real directions, kit metadata ≠ painted face | Closed |
| **Original D4+** | VL / concept / overlay merge onto studio | **Not started. Still “later / maybe never.”** |

We are **after D4**, not inside overlay-merge. The next production-code phase is optional; the remaining DI debt is mostly **stale docs** and **log/spec completeness theater** that D4 did not strip from `DesignDecisionLog`.

---

## 2. Double-check (claims vs code)

| Claim | Code | Verdict |
|---|---|---|
| Chat always uses studio painter | `App.tsx` `studio: true` | REAL |
| Logo / scale reach studio SVG | `FormaLocalEngine` identity → `composeStudioArtwork` → `paintMark` | REAL (D1) |
| Studio skips kit `titleScale` 1.1 | `if (!studioOn && designPlan.cue === 'luxury-tighten'` | REAL (D1) |
| Tiny marks stay vector | `STUDIO_MIN_LOGO_R` 2.5 mm | REAL (D1) |
| Kit `repairPlan` off on studio | `needsRepair: false` when `studioOn` | REAL |
| Overlay search not on studio generate | no `generateCompositionCandidates` in `FormaLocalEngine` | REAL |
| Ledger → C6 quieter/vary | `studioCriticActions` + `APPLY_STUDIO_CRITIC` | REAL (D2) |
| Critic does not pick winner / rewrite SVG | no SVG mutate; pick is user pin | REAL (D2/D3) |
| 2–3 `DesignDirection` from ranked pool | `directionOffer` / `ranked.slice(0,3)` | REAL (D3) |
| Generate paints one face | `composeStudioArtwork` once per generate | REAL |
| User picks `2. yön` | `parseDirectionChoice` → `studioFamily` pin | REAL (D3) |
| UI caption is studio DNA | `studioFaceLabel` not `heroGraphic.family` | REAL (D4) |
| Kit motif recs do not paint P1 | `paintsStudioFace`; hash test | REAL (D4) |
| 18 golden hashes (no logo, scale 1) | `studioGolden.test.ts` | REAL |
| `STATUS.md` “logoHref never reaches studio” | file still pre-D1 | **STALE DOC** |
| Decision log `decision: ONLY` on studio | `kitCandidates()` when overlay skipped | **Still decorative** |
| `createPlan` still runs on P1 | `FormaLocalEngine` always | Computed, mostly unused by painter |
| `advisePlan` | identity, no callers | UNUSED |
| Visual language / concept / asset language → studio SVG | painters ignore plan VL/concept | Still kit-only |

---

## 3. Production chain (P1) — current

```text
USER
 → runConversation (C0–C8 + D3 “2. yön” + D2 critic apply)
 → DesignBrief
 → FormaLocalEngine.generate(studio:true)
 → applyKnowledgeToBrief          ← kit recs (avoid-motif) do not paint
 → studioHintsFromKnowledge       ← studio-archetype / background DO paint
 → createPlan                     ← computed; painter does not consume VL/concept
 → decideDirection + directionOffer
 → composeStudioArtwork           ← one face + identity + ledger critic
 → applyStudioPreflight
 → captureGenerateDecision        ← still logs kit ONLY candidate
 → observeFeedback / observeCritic (C6 quieter/vary only)
 → Learning Gate
 → future studioHintsFromKnowledge
```

Painter still consumes: `DesignDirection` + brief copy/palette/dieline + logo/scale.  
Painter still does **not** consume: VL array, concept id, asset language, overlay scores, kit critic repair.

---

## 4. Stage status (post-D4)

| Stage | P1 | Note |
|---|---|---|
| Conversation | REAL | C0–C8 |
| Brief | REAL | |
| Structure offer | REAL | C5; user pick |
| Art direction | REAL | `decideDirection` |
| Direction candidates | REAL (names + pin) | D3; one paint |
| Studio composition | REAL | |
| Logo / scale | REAL | D1 |
| Deterministic SVG | REAL | |
| Preflight | REAL | ledger + DNA label |
| Feedback + gate | REAL | C7 studio-archetype |
| Critic | PARTIAL | D2 C6 buttons; no repair; no winner |
| Intent / VL / concept / asset language | KIT ONLY | |
| Overlay candidates | OFF P1 | |
| Outcome as quality | PARTIAL | rating → observe; not a score of the face |
| Decision log | RECORDER | studio fields real; kit ONLY row decorative |

Overall: still **FRAGMENTED**, but P1 false-completeness on **logo, critic sentence, candidate set, kit hero caption, kit motif “öğrendim”** is closed.

---

## 5. Plan (do / don’t)

### Do next if we keep going

| ID | Work | Why |
|---|---|---|
| **D5-docs** | Rewrite `PAXOLAB_DESIGN_INTELLIGENCE_STATUS.md` to post-D4 (no production code) | Q18: stale audit is now the loudest lie |
| **D5-log** | Studio generate must not emit `kitCandidates` `ONLY`. Log `directionOffer` as the candidate set; selected = `decideDirection` winner | Remaining decorative completeness |
| **D5-spec** | Stop treating `designPlan.heroGraphic` / `summaryTr` as the studio face anywhere left (language id `food-harvest` can stay; it is not a hero) | Residual kit vocabulary |

### Optional later (not DI merge)

| ID | Work |
|---|---|
| Craft | Sleeve/snap-lock flap/top anatomy (`STUDIO_STAGE_AUDIT` D4) — painter craft, not intelligence |
| Knowledge | Grow **studio-archetype / studio-background** evidence only (outcome prefer). Do not teach `avoid-motif` to the studio painter unless DNA actually has motifs |

### Do not

- New Design Brain
- LLM SVG / geometry
- Overlay candidate search on P1
- Kit `repairPlan` on studio
- Critic picks the winner or rewrites SVG
- Auto `luxury-tighten` `titleScale` 1.1 on studio
- Global auto-learn
- Concept id → studio DNA map
- Calling D5 “VL/concept/overlay merge”

---

## 6. Proof files

D1 `docs/STUDIO_D1.md` · D2 `docs/STUDIO_D2.md` · D3 `docs/STUDIO_D3.md` · D4 `docs/STUDIO_D4.md`  
Tests: `studioIdentity`, `studioCritic`, `studioDirectionOffer`, `studioHonesty`, `studioGolden`, C0–C8 conversation suite.
