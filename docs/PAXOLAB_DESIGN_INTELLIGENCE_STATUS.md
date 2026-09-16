# PAXOLAB DESIGN INTELLIGENCE — STATUS (post-D4)

**Date:** 16 Sep 2026  
**Mode:** Current source of truth. Replaces the pre-D1 snapshot that still claimed unused `logoHref`.  
**Companion:** `docs/PAXOLAB_DI_POST_D4_AUDIT.md` (double-check) · D1–D5 `docs/STUDIO_D1.md` … `STUDIO_D5.md`  
**Repo evidence:** `npx vitest run` → **461 passed / 1 failed / 462 total**. Baseline fail remains `phase15.test.ts` `/hex/i`. Studio golden **18/18**.

This file is **docs only**. It does not add VL/concept/overlay merge, `repairPlan` on studio, LLM SVG, or a critic-selected winner.

---

## 1. Where we are

PAXOLAB is still a **fragmented dual-engine**, not a unified Design Intelligence pipeline. Two programs are **closed**:

| Program | Scope | Status |
|---|---|---|
| **C0–C8** | Conversation → brief → structure offer → direction talk → copy → learning gate → LLM allowlist | Closed |
| **D0–D4** | Honesty on P1: logo/scale, critic=C6, 2–3 real directions, kit metadata ≠ painted face | Closed |
| **Original D4+** | VL / concept / overlay merge onto studio | **Not started. Later / maybe never.** |

| Path | Who hits it | What paints SVG |
|---|---|---|
| **P1 — Studio chat (production UI)** | `App.tsx` always `studio: true` | `decideDirection` → `composeStudioArtwork` |
| **P2 — Kit / catalog Design Brain** | tests, catalog jobs, generate without `studio` | `createPlan` → `composeArtwork` (± overlay, ± `repairPlan`) |

C0–C8 proves the **conversation** slice. D0–D4 proves P1 no longer **lies** about logo, critic, candidates, or kit harvest as the painted face. Neither program fused VL/concept/overlay into the studio painter.

Honest overall status: **FRAGMENTED** (P1 false-completeness on logo / critic sentence / candidate set / kit hero caption is closed).

---

## 2. Production chain (P1)

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
 → captureGenerateDecision        ← path studio: directionOffer; kit ONLY only on kit generate
 → observeFeedback / observeCritic (C6 quieter/vary only)
 → Learning Gate
 → future studioHintsFromKnowledge
```

Painter **consumes:** `DesignDirection` + brief copy/palette/dieline + `logoHref` / `logoScale` / `titleScale`.  
Painter **does not consume:** VL array, concept id, asset language, overlay scores, kit critic repair.

---

## 3. Stage status (P1)

| Stage | P1 | Note |
|---|---|---|
| Conversation | REAL | C0–C8 |
| Brief | REAL | |
| Structure offer | REAL | C5; user pick. Sector-filtered picker (separate production/template work). |
| Art direction | REAL | `decideDirection` |
| Direction candidates | REAL (names + pin) | D3; one paint; user `2. yön` |
| Studio composition | REAL | |
| Logo / scale | REAL | D1. Tiny marks stay vector (`STUDIO_MIN_LOGO_R` 2.5). Kit luxury-tighten 1.1 skipped on studio. |
| Deterministic SVG | REAL | 18 goldens when no logo and `titleScale` 1 |
| Preflight | REAL | ledger + DNA label “Stüdyo DNA” |
| Feedback + gate | REAL | C7 studio-archetype |
| Critic | PARTIAL | D2 C6 quieter/vary; no repair; no winner |
| Intent / VL / concept / asset language | KIT ONLY | |
| Overlay candidates | OFF P1 | |
| Outcome as quality | PARTIAL | rating → observe; not a score of the face |
| Decision log | RECORDER | D5-log: studio logs directionOffer; kit still ONLY |

---

## 4. What D0–D4 closed (was false-completeness)

| Lie | Fix | Doc |
|---|---|---|
| Conversation promised a logo; painter ignored `logoHref` / scales | Identity through `layoutContext` → `paintMark` | D1 |
| Studio applied kit `titleScale` 1.1 luxury-tighten | Skip when `studio` | D1 |
| UI said “Kritik not aldı” with no action | Ledger → quieter/vary C6 buttons | D2 |
| No real alternative faces, only `variationIndex` | Ranked pool slice(0,3) as `directionOffer`; user pin | D3 |
| UI showed kit `heroGraphic` / `summaryTr` / avoid-motif as the studio face | `studioFaceLabel`; kit recs filtered in process note | D4 |

Locks that stayed: no new Design Brain, no LLM SVG, no overlay search on P1, kit `repairPlan` off on studio, critic does not rewrite SVG or pick a winner, 18 goldens hold without logo + scale 1.

---

## 5. Still not a unified DI pipeline

- `createPlan` still runs on every studio generate. VL/concept/asset language sit on `designPlan` and are **metadata**, not paint.
- Overlay `generateCompositionCandidates` is not called from `FormaLocalEngine` when `studio: true`.
- `advisePlan` is identity; no production callers.
- Kit `avoid-motif` / `director-cue` do not change studio DNA hashes.
- Language id `food-harvest` can remain as a kit dialect id; it is not the studio hero graphic (D4). Residual `heroGraphic` / `summaryTr` on the spec object stay for kit; D5-spec stops showing them as the studio face (2D chip + üretim `proof`).
- Decision log on studio used to emit `kitCandidates` `decision: ONLY` (decorative completeness). D5-log is the optional honesty fix: log `directionOffer`, selected = `decideDirection` winner.

---

## 6. Key files

| Role | File |
|---|---|
| Production UI generate | `src/App.tsx` (`studio: true`) |
| Conversation | `src/engine/conversation.ts` |
| Engine | `src/engine/FormaLocalEngine.ts` |
| Direction + offer | `src/engine/studio/direction.ts` |
| Studio paint | `src/engine/studio/composeStudioArtwork.ts` |
| Identity / mark | `src/engine/studio/anatomy.ts` `paintMark` |
| Kit plan | `src/engine/brain/DesignDirector.ts` |
| Kit paint | `src/engine/artwork/composeArtwork.ts` |
| Critic ledger | `src/engine/brain/DesignCritic.ts` |
| Learning | `src/engine/brain/LearningEngine.ts` |
| Decision log | `src/engine/brain/DesignDecisionLog.ts` |
| Face captions | `src/engine/studio/faceCaption.ts` |

---

## 7. Proof

| Slice | Tests |
|---|---|
| D1 identity | `studioIdentity.test.ts` |
| D2 critic | `studioCritic.test.ts` |
| D3 offer | `studioDirectionOffer.test.ts` |
| D4 honesty | `studioHonesty.test.ts`, `learningUi.test.ts` |
| Goldens | `studioGolden.test.ts` (18) |
| D5-log | `designDecisionLog.test.ts` (kit ONLY; studio WINNER/FINALIST) |
| D5-spec | `studioHonesty.test.ts` (proof DNA; `food-harvest` chip yok) |
| Knowledge | `studioLearning.test.ts` (5★ prefer pin; studio outcome ≠ avoid-motif) |
| Conversation | C0–C8 suite |

Baseline (do not “fix” as DI): `phase15.test.ts` `/hex/i`.

---

## 8. Plan (do / don’t)

### Do (closed this slice)

| ID | Work | Code? |
|---|---|---|
| **D5-docs** | This rewrite | **Done** |
| **D5-log** | Studio generate must not emit kit `ONLY`. Log `directionOffer`; selected = `decideDirection` | **Done** |
| **D5-spec** | Stop treating leftover `heroGraphic` / `summaryTr` as studio face in remaining surfaces | **Done** |

### Optional later (not DI merge)

Craft: sleeve/snap-lock flap anatomy — **done** (`docs/STUDIO_CRAFT.md`). Knowledge: studio-archetype / studio-background **outcome prefer** — **done** (`docs/STUDIO_KNOWLEDGE.md`).

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

## 9. Machine-readable twin

`docs/PAXOLAB_DESIGN_INTELLIGENCE_STATUS.json` — same date, same overall **FRAGMENTED**, stages updated for D1–D4 + D5-log.
