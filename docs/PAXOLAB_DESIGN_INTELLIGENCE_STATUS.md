# PAXOLAB DESIGN INTELLIGENCE — REALITY AUDIT

**Date:** 16 Sep 2026  
**Mode:** Reality audit only. No production code changed. No new capability added.  
**Follow-up:** D0/D1 (`docs/STUDIO_D1.md`) wired `logoHref` / `logoScale` / `titleScale` into studio SVG. D2 (`docs/STUDIO_D2.md`) maps ledger crowding to C6 quieter/vary. This file remains the pre-D1 snapshot.  
**Repo evidence snapshot:** `npx vitest run` → **432 passed / 1 failed / 433 total**. Studio / C0–C8 / fingerprint subset (17 files) → **167 passed**. Golden hashes were not modified.

---

## 1. Executive Reality Summary

PAXOLAB is **not** a single Design Intelligence pipeline from user language to critic-selected winner to learned future design.

It is a **fragmented dual-engine**:

| Path | Who hits it | What actually paints SVG |
|---|---|---|
| **P1 — Studio chat (production UI)** | `src/App.tsx` always sets `studio: true` | `resolveDirection` → `composeStudioArtwork` (closed archetype DNA + ledger) |
| **P2 — Kit / catalog Design Brain** | tests, catalog jobs, generate without `studio` | `createPlan` → `applyPlanToSystem` → `composeArtwork` (± overlay search, ± `repairPlan`) |

C0–C8 being **CLOSED** proves the studio *conversation* slice (brief, structure offer, direction why/veto/vary, copy, learning gate, LLM allowlist). It does **not** prove that visual language, visual concept, asset language, candidate generation, or a production critic sit on the same chain.

Honest overall status: **FRAGMENTED**.

What is real on the production chat path:

```text
USER
 → runConversation (heuristic extract + ask + C6 talk + C5 structure pick)
 → DesignBrief
 → (optional) LLM brief/copy/direction, fail-open, schema-sanitized
 → recommendStructures (user pick is the authority)
 → FormaLocalEngine.generate(studio:true)
 → applyKnowledgeToBrief + studioHintsFromKnowledge
 → createPlan                    ← computed, mostly unused by studio painters
 → resolveDirection              ← REAL art-direction decision
 → composeStudioArtwork          ← REAL composition + SVG
 → applyStudioPreflight          ← REAL production gate
 → captureGenerateDecision       ← REAL log (does not pick the face)
 → observeFeedback → Learning Gate → (later) studioHintsFromKnowledge
```

What is **not** a production Design Intelligence stage, despite names, types, tests, and prior audits:

- A standalone **Design Intent** artifact consumed by the studio painter.
- **Visual language / visual concept / asset language** as inputs to studio SVG.
- **Candidate generation** of A/B/C faces with a critic choosing a winner on the chat path.
- **Evaluation / critic** as a production decision gate when `studio: true` (repair is forced off).
- **LLM geometry / SVG**.
- User **logo image** placement on studio faces (`logoHref` never reaches `src/engine/studio/`).

---

## 2. Audit Scope

Audited: `src/` runtime (conversation, brief, studio, brain, artwork, preflight, LLM, App), `docs/` claims, existing tests. Semantic equivalents searched (archetype, motif, director, candidate, critic, observation, knowledge, approve, etc.).

Not done (forbidden by this phase): new architecture, new brain, new critic, new candidates, image-gen, CV, embeddings, painter redesign, speculative schemas, production-code edits, new proof tests that would require production changes.

If a claim needed a production-code change to prove: **GAP / NOT PROVEN**.

---

## 3. Repository Evidence

### 3.1 Current test result (this audit)

```text
CURRENT REPOSITORY RESULT
npx vitest run
  Test Files  1 failed | 66 passed (67)
  Tests       1 failed | 432 passed (433)

BASELINE FAILURE (pre-existing; not introduced by this audit; not fixed):
  src/engine/artwork/phase15.test.ts
  "chat copy treats chips as mood and mentions colors"
  expected askCopy(..., 'colors') to match /hex/i
  actual copy no longer mentions hex
```

C0–C8 / studio / catalog-freeze subset (this audit, green):

```text
npx vitest run src/engine/studio src/engine/llm/studioChatC8.test.ts
  src/engine/llm/studioContract.test.ts src/engine/conversationFlow.test.ts
  src/engine/conversationUnderstand.test.ts src/engine/conversationState.test.ts
  src/engine/catalog/structureRecommend.test.ts src/engine/brain/learningGate.test.ts
  src/engine/brain/designBrainV1.test.ts src/engine/brain/designCritic.test.ts
  src/engine/brain/designDecisionLog.test.ts src/engine/FormaLocalEngine.test.ts
→ 17 files, 167 passed
```

The C8-era “172 tests” figure is **not** the current full suite. Full suite is **433**. Conversation/studio slice is in the 160s depending on which files are counted.

### 3.2 Claim vs code (do not treat docs as proof)

| Claim source | What it says | Reality in this audit |
|---|---|---|
| C0–C8 CLOSED | Studio chat slice done | True for that slice. Not a full DI pipeline. |
| `docs/DESIGN_BRAIN_V1_AUDIT.md` | Generate chain is kit `composeArtwork` + critic repair | **Stale.** Production App paints via studio. |
| `docs/STUDIO_CHAT_AUDIT.md` (older rows) | Generate does not run learning cycle | **Stale.** `observeFeedback` → `afterObservation()` → `runLearningCycle({ approve: 'automated' })`. |
| Function/type names (`visualConcept`, `scoreDesign`, `advisePlan`) | Intelligence stages | Many are computed or identity; consumption is path-dependent. |

### 3.3 Key files (runtime, not comments)

| Role | File |
|---|---|
| Production UI generate | `src/App.tsx` (`studio: true`) |
| Conversation | `src/engine/conversation.ts` |
| Brief schema | `src/types.ts` `DesignBrief` |
| Engine orchestrator | `src/engine/FormaLocalEngine.ts` |
| Studio direction | `src/engine/studio/direction.ts` `decideDirection` |
| Studio paint | `src/engine/studio/composeStudioArtwork.ts` |
| Kit plan | `src/engine/brain/DesignDirector.ts` `createPlan` |
| Kit paint | `src/engine/artwork/composeArtwork.ts` |
| Overlay candidates | `src/engine/artwork/compositionCandidates.ts` |
| Overlay skip | `src/engine/designSystem/conceptKitAlignment.ts` `kitGradeSkipsOverlay` |
| Kit critic | `src/engine/brain/CritiqueEngine.ts` + `RepairPlanner.ts` |
| Critic ledger (log/UI) | `src/engine/brain/DesignCritic.ts` |
| Learning | `src/engine/brain/LearningEngine.ts` |
| Studio knowledge hook | `src/engine/brain/studioKnowledge.ts` |
| Decision log | `src/engine/brain/DesignDecisionLog.ts` |
| LLM brief | `src/engine/nlu.ts` |
| LLM direction | `src/engine/llm/studioDirectorLlm.ts` |

---

## 4. Runtime Architecture

### 4.1 Two engines, one `generate`

`FormaLocalEngine.generate` always:

1. Picks template, builds dieline, builds copy, builds `createPlan`.
2. Applies `applyKnowledgeToBrief`.
3. Then **branches**:

```text
overrides.studio ?
  resolveDirection(assembleStudioHints(...)) → composeStudioArtwork
  critiquePlan(...) with needsRepair FORCED false
:
  composeArtwork(...)
  critiquePlan(...)
  if needsRepair → repairPlan → re-paint
```

App production always takes the studio branch. Kit tests and `generate({ brief })` without `studio` take the kit branch.

### 4.2 Studio painters do not consume Design Brain plan

`applyPlanToSystem` still runs on the studio branch. `composeStudioArtwork` then uses from `DesignSystem` essentially:

- `system.markRecipe.paoMonths`
- `system.wrapSeam`

Lockup remap, density, optical center, visual concept, asset language, hero family — **not read by studio layouts**. Direction (`DesignDirection`) is the production visual contract.

### 4.3 Overlay candidate search is gated twice

1. Studio branch never calls `composeArtwork` / `selectMotifComposition`.
2. Even on kit, `kitGradeSkipsOverlay(style)` is true for luxury / modern / minimal / classic / eco (25 of 29 catalog jobs). Overlay search remains for **playful** (4 jobs) and explicit `blankCanvas` tests.

### 4.4 LLM is a side door, not the painter

Enabled only if `VITE_FORMA_LLM_URL` is set. Default is `NullLlmProvider` (fail-open → heuristics). Allowed tasks: brief extract, feedback classify, copy, studio direction hints. `parseIntentWithLlm` and `critiqueWithLlm` exist but are **not called** from App/generate.

---

## 5. Production Decision Graph

Edges classified **for the production chat path (P1)** unless marked kit-only.

```text
USER
  │ REAL
  ▼
runConversation / extractFields / understandUtterance / parseDirectionTalk / parseIntent / parseFeedback
  │ REAL
  ▼
DesignBrief (+ ConversationState)
  │ REAL
  ├─► extractBriefWithLlm ──────── sanitizeBriefExtract ── mergeBrief     REAL if provider on; else DEAD this turn
  ├─► analyzeReferenceImageRich ── colors/style patch                     PARTIAL (attach path; not CV/intelligence)
  ├─► recommendStructures ────── user template pick ── templateId          REAL (ranking proposes; user selects)
  │
  ▼
FormaLocalEngine.generate (App: studio:true)
  │ REAL
  ├─► applyKnowledgeToBrief (avoid-motif, director-cue)                    PARTIAL on P1 (plan fields; studio painter ignores most)
  ├─► studioHintsFromKnowledge (studio-archetype / background)             REAL when active rules exist
  ├─► createPlan / designIntent / visualLanguage / visualConcept           DECORATIVE on P1 (computed, unused by studio paint)
  ├─► resolveDirection / decideDirection                                   REAL
  │     hints: brief heuristic, family pin, veto, LLM (sanitized), knowledge
  ├─► composeStudioArtwork                                                 REAL
  │     direction.archetype / background / temperament / typePairing / copy / seed
  ├─► runPreflight + applyStudioPreflight                                  REAL (gate)
  ├─► captureGenerateDecision + critiqueDesign                             PARTIAL (log + Workspace text; no re-paint)
  ├─► observeFeedback → validateKnowledge → approveKnowledge               REAL (user/brand auto; global human)
  └─► SVG document                                                         REAL (authoritative geometry)
```

Kit-only (P2) extra edges:

```text
createPlan → applyPlanToSystem → composeArtwork → [selectMotifComposition if !kitGradeSkipsOverlay]
            → scoreDesign → critiquePlan → repairPlan → re-paint     REAL on P2 when studio off
kitCandidates() logs a single decision:'ONLY' row                    DECORATIVE (not a candidate set)
```

Missing as a continuous production pipeline (the audit target chain is **not** implemented as one graph):

```text
Intent → Visual Language → Concept → Art Direction → Asset Language → Candidate Generation → Critic → Selection
```

That sequence is a **documentation target**, not the runtime.

---

## 6. Stage-by-Stage Reality Matrix

Status vocabulary: `REAL | PARTIAL | DECORATIVE | UNUSED | DEAD | UNKNOWN`.

### Conversation Intelligence

```text
Stage: Conversation Intelligence
Exists: YES — runConversation, extractFields, understandUtterance, conversationAsk, conversationState, parseDirectionTalk, parseIntent, parseFeedback
Runtime Entry: App.tsx process() → runConversation; template pick → runConversation('başlat')
Called: YES (production)
Consumed By: DesignBrief, EngineResult.shouldGenerate / overridePatch / feedback / showTemplates
Downstream Decision: YES — fields, structure offer, generate trigger, C6 veto/vary, iteration patches
Behavioral Proof: conversationFlow / Understand / State / studioConversation / C6–C8 tests
Regression Proof: those files in the 167 green subset
Determinism: YES (heuristic parsers; LLM optional and fail-open)
Production Path: YES
Evidence: E5
Decision Authority: DA-3 (structures what generate sees; does not paint SVG)
Status: REAL
```

User language **does** become structured brief fields (brand, product, sector, surface, barcode, colors, style, copy, family veto, etc.). Clarification is a small critical ask list (`packagingMode, sector, brandName, productName, barcode`); dimensions are deferred to the template picker. Conversation state (`asked/answered/declined`) is carried and affects defaulting.

Instruction authority on production:

| User class | Authority |
|---|---|
| Core brief facts | DA-3 → brief → copy / dieline / direction blob |
| C6 why | DA-1 (explanation only; no generate) |
| C6 veto / pin / vary | DA-3/DA-4 → direction → SVG |
| “luxury yap” / mood chips | DA-3 via `styleType` / temperament |
| “logoyu büyüt” | DA-0 on P1 (`logoScale` unused by studio) |
| Structure card pick | DA-4 for dieline |
| LLM extract | DA-2 (weaker than USER_EXPLICIT; fail-open) |

### Structured Design Brief

```text
Stage: Structured Design Brief
Exists: YES — DesignBrief in src/types.ts
Runtime Entry: mergeBrief, emptyBrief, generate()
Called: YES
Consumed By: copy, dieline, palette, direction, structure recommend, knowledge matching
Downstream Decision: YES (field-dependent; see §6 brief table)
Behavioral Proof: C2/C4/C5/C8 + copyBrief + structureRecommend
Regression Proof: yes
Determinism: YES
Production Path: YES
Evidence: E5
Decision Authority: DA-4 (the production contract)
Status: REAL
```

Actual fields (repository, not an example list):

| Field | Produced By | Consumed By | Decision Impact |
|---|---|---|---|
| brandName | extract / LLM / user | copy, seed, lockup text | REAL |
| productName | extract / LLM / user | copy, direction blob | REAL |
| sector | extract / LLM / chips | direction heuristic, structure, knowledge condition | REAL |
| subProduct | extract / LLM | direction blob, vocab (kit) | REAL |
| packagingMode | extract / LLM | surface, painters, structure | REAL |
| templateId | user pick / utterance / default | `pickTemplate` → dieline | REAL |
| dimensionsMm | picker / template default / extract | dieline, face W/H, structure physics | REAL |
| styleType | chips / extract / LLM / parseIntent | temperament, scoring, createPlan | REAL (studio temperament); kit plan REAL on P2 |
| colors | extract / LLM / reference analysis | palette → studioPalette | REAL |
| volume | extract / default | copy | REAL |
| paoMonths | user / sector default | mark recipe → studio ctx | REAL |
| barcode | extract / sample EAN | copy / honesty preflight | REAL |
| manufacturerName/Address | extract / sample | legal copy, `cityLine` | REAL |
| logo | attachment name | conversation ack only | DECORATIVE on P1 (`logoHref` unused by studio) |
| references | attachment names | stored | DECORATIVE |
| copyOverrides | extractSpokenCopy | tagline / direction blob | REAL |
| ingredientClaims | extract / sector default | claim chips | REAL |
| story | extract | direction copy + scoring blob | REAL |
| scentNotes | extract | perfume pyramid | REAL |
| copyLocale | infer / LLM | copy + direction.locale | REAL |
| directorCue | understandUtterance / LLM / knowledge | scoring blob; createPlan cue | PARTIAL on P1 |
| avoidMotifs | conversation / knowledge | visualConcept.avoid (kit overlay) | DECORATIVE on P1 |
| deliverables | dual-surface parse | companion label generate | REAL |
| studioFamily | C6 pin / previous generate | direction pin | REAL |
| avoidStudioFamilies | C6 veto | scoring exclude | REAL |
| directionVariation | C6 vary | variationIndex / seed | REAL |
| provenance | mergeBrief | source precedence | REAL (merge), not SVG |
| \*Defaulted flags | conversationState | honesty / UI | PARTIAL (preflight honesty, not look) |

### Design Intent

```text
Stage: Design Intent
Exists: PARTIAL — DesignIntentBlock on DesignPlan (buildDesignIntent); not a separate runtime artifact on P1
Runtime Entry: createPlan → plan.designIntent; resolve.ts also builds intent for kit concept
Called: YES (every generate computes a plan)
Consumed By: visualLanguageFor, visualConceptFor (kit); decision log intent snapshot; studio painter: NO
Downstream Decision: kit language/concept (P2); incidental blob via directorCue on P1
Behavioral Proof: designBrainV1.test intent ↔ language; luxury-tighten character
Regression Proof: 29 catalog fingerprints include intent-derived language
Determinism: YES
Production Path: computed on P1 but unused by composeStudioArtwork
Evidence: E4 on P2; E1 on P1 consumption
Decision Authority: DA-2 (kit); DA-0 for studio SVG
Status: PARTIAL
```

Semantic equivalent on production is **brief + DesignDirection**, not `DesignIntentBlock`.

### Visual Language

```text
Stage: Visual Language
Exists: YES — visualLanguageFor, plan.visualLanguage, languageTreatment
Runtime Entry: createPlan / ArtDirection / overlay scoring
Called: YES on every generate (plan); overlay only if kit + not skipped
Consumed By: asset language, overlay critic, kit freeze tests
Downstream Decision: kit overlay / lockup chrome (P2); studio SVG: NO
Behavioral Proof: designBrainV1 language freeze; phase19+ overlay language gates
Regression Proof: 29 fingerprints
Determinism: YES
Production Path: NO (P1)
Evidence: E4 (kit metadata/overlay); E1 (P1)
Decision Authority: DA-3 kit overlay; DA-0 studio
Status: PARTIAL
```

`styleType = premium` is not even a field; `styleType` is a closed enum. Mood is real for temperament, not a “visual language compiler” on P1.

### Visual Concept

```text
Stage: Visual Concept
Exists: YES — visualConceptFor, CONCEPTS rows, plan.visualConcept
Runtime Entry: createPlan / attachArtDirection
Called: YES
Consumed By: applyPlanToSystem lockup/goldBar; selectFamilyPool; decision log
Downstream Decision: kit lockup remap + overlay family; studio: unused
Behavioral Proof: concept family gates, 29 freeze concept ids
Regression Proof: yes (kit)
Determinism: YES (table lookup + language allow-list retie)
Production Path: NO for studio paint
Evidence: E4 kit; E1 P1
Decision Authority: DA-3 kit; DA-0 studio
Status: PARTIAL
```

Concept is a **lookup row**, not a generated creative concept. There is no multi-concept candidate set on P1. Kit logs `decision: 'ONLY'` for the single plan concept.

### Art Direction

```text
Stage: Art Direction
Exists: YES — two systems: (A) kit ArtDirectionBlock (B) studio DesignDirection
Runtime Entry P1: decideDirection / resolveDirection / assembleStudioHints
Called: YES
Consumed By: composeStudioArtwork (archetype → layout + background DNA)
Downstream Decision: YES — face anatomy, background family, type pairing, seed
Behavioral Proof: studioDirection, studioConversation (why/veto/vary), studioGolden 18 hashes, C8 direction sanitize
Regression Proof: 18/18 studio golden
Determinism: YES (same brief+hints+variation → same direction)
Production Path: YES
Evidence: E5
Decision Authority: DA-4 on P1
Status: REAL
```

C6 contribution that is actual art-direction authority:

- **Why:** grounded claims from scoring parts (not generic prose) — DA-1 for chat, but claims are from the real scorer (not decorative reasons).
- **Veto:** `avoidStudioFamilies` → excluded archetypes → new winner → new SVG hash — DA-4.
- **Vary:** `directionVariation` → pool index / seed / optional quieter temperament — DA-3.

Kit `ArtDirection` (chrome, crop, anti-repetition) is a **different** stage, live on P2.

LLM direction: sanitized closed vocabulary, veto still wins, fail-open. DA-2 relative to user pin/veto; DA-3 when it actually pins an archetype and the family is not locked.

### Asset Language

```text
Stage: Asset Language
Exists: YES — assetLanguageFor compiler (preferred/allowed/forbidden families, lexicon, blocked strategies)
Runtime Entry: selectMotifComposition / frontPanel overlay
Called: kit overlay path only
Consumed By: family pool + strategy filter
Downstream Decision: overlay motif choice (playful / blankCanvas)
Behavioral Proof: assetLanguage.test, phase19–32
Regression Proof: overlay tests
Determinism: YES
Production Path: NO
Evidence: E4 test-path; E1 P1
Decision Authority: DA-3 overlay; DA-0 studio
Status: PARTIAL
```

Studio “assets” are **painter primitives** (marble paths, botanical strokes, DNA frames) selected by archetype, not `assetLanguageFor`. Studio preflight item `asset-family` is hard-coded `status: 'pass'`.

### Composition

```text
Stage: Composition
Exists: YES — (P1) labelLayouts/boxLayouts + ledger; (P2) composeGrammar + lockup layout + overlay slots
Runtime Entry P1: composeStudioArtwork
Called: YES
Consumed By: SVG layers
Downstream Decision: YES — placement, hierarchy, density of studio anatomy
Behavioral Proof: studio golden hashes change with direction/variation/copy; C4 tagline on lockup; C6 vary hash
Regression Proof: 18 studio hashes; kit lockup Y / languageTreatment on P2
Determinism: YES
Production Path: YES (studio layouts)
Evidence: E5
Decision Authority: DA-4
Status: REAL
```

This is **deterministic layout automation**, not multi-candidate composition intelligence. Changing density/variation/copy/direction can change the SVG; that is painter sensitivity, not a critic.

### Candidate Generation

```text
Stage: Candidate Generation
Exists: YES as code — generateCompositionCandidates (strategies → 3–5 overlay layouts)
Runtime Entry: selectMotifComposition ← frontPanel when !studio && !kitGradeSkipsOverlay
Called: tests + playful kit; NOT App
Consumed By: chooseCompositionWinner
Downstream Decision: overlay markup only
Behavioral Proof: phase17/21/22 winner + fingerprint tests
Regression Proof: those phase tests
Determinism: YES (seed tie-break)
Production Path: NO
Evidence: E3/E4 test-path; E0 as production DI
Decision Authority: DA-3 on overlay island; DA-0 production chat
Status: PARTIAL
```

Seed / `variationIndex` on studio is **variation**, not candidate intelligence. Decision log `kitCandidates` emits one `ONLY` row — **decorative completeness**.

### Evaluation / Critic

```text
Stage: Evaluation / Critic
Exists: YES — several layers (see §10)
Runtime Entry: paint() in FormaLocalEngine; captureGenerateDecision
Called: YES
Consumed By: P2 repairPlan; P1 forced needsRepair:false; Workspace note; learning does NOT consume critiques automatically
Downstream Decision: P2 may re-paint; P1 does not
Behavioral Proof: CritiqueEngine + repair on kit; designCritic.test log shape; C6 test that studio does not surface kit lockupClearance as kit critic
Regression Proof: kit critic tests
Determinism: YES
Production Path: scoring+log YES; selection NO
Evidence: E4 kit repair; E2 P1 log
Decision Authority: DA-3 kit repair; DA-1 P1
Status: PARTIAL
```

### Deterministic SVG

```text
Stage: Deterministic SVG
Exists: YES — studio painters + kit painters; document validation
Runtime Entry: composeStudioArtwork / composeArtwork → documentFromArtwork
Called: YES
Consumed By: preview, export, preflight, golden hashes
Downstream Decision: the product
Behavioral Proof: 18 studio hashes; kit generate tests; C8 SVG/geometry isolation
Regression Proof: yes
Determinism: YES
Production Path: YES
Evidence: E5
Decision Authority: DA-4 (authoritative geometry). LLM DA-0 for SVG.
Status: REAL
```

### Preflight

```text
Stage: Preflight
Exists: YES — runPreflight + applyStudioPreflight
Runtime Entry: every generate
Called: YES
Consumed By: DesignSpec.preflight, export UI, C7 production-path assertion exportOk
Downstream Decision: GATE (exportOk / blocking). Does not choose archetype or layout.
Behavioral Proof: FormaLocalEngine.test, studioLearning TEST 12, production tests
Regression Proof: yes
Determinism: YES
Production Path: YES
Evidence: E5
Decision Authority: DA-4 as validator, DA-0 as designer
Status: REAL
```

Enforced (non-exhaustive): dieline consistency, barcode honesty / invented GTIN, glue-dirty, locale mix when printReady, structural FATAL cuts, collisions (studio ledger), min text mm, overflow. Studio replaces kit lockup-geometry items with ledger items. `asset-family` on studio is informational pass.

### Outcome

```text
Stage: Outcome
Exists: PARTIAL — DesignOutcome (exported, stars, tags, downloads); noteExport / noteRating / noteFinalized
Runtime Entry: OutcomeTracker; rating.ts
Called: when user rates/exports (UI exists)
Consumed By: observeOutcome → learning (if stars/export)
Downstream Decision: only via learning after thresholds — not an immediate design measure
Behavioral Proof: learningGate / designDecisionLog tests
Regression Proof: those tests
Determinism: YES given inputs
Production Path: PARTIAL (wired, not a design-quality metric)
Evidence: E3
Decision Authority: DA-2 (feeds learning), DA-0 as critic
Status: PARTIAL
```

Generated SVG ≠ measured design outcome. There is no fitness score used as outcome.

### Feedback

```text
Stage: Feedback
Exists: YES — parseFeedback, interpretFeedback (heuristic + optional LLM union)
Runtime Entry: conversation generateResult / iteration / App revision interpretFeedback
Called: YES
Consumed By: (1) this-turn parseIntent / C6 talk  (2) observeFeedback
Downstream Decision: immediate iteration is separate from learning
Behavioral Proof: C7 TEST 1–2; llmProvider / C8 interpret sanitize
Regression Proof: yes
Determinism: heuristic YES; LLM additive fail-open
Production Path: YES
Evidence: E5 parse+observe; immediate SVG change is C6/parseIntent not the critic
Decision Authority: DA-3 as structured signal; SVG authority is the downstream hook
Status: REAL
```

**Feedback ≠ learning.** A single “fazla yoğun” both: (a) may vary/iterate this face via C6/parseIntent, and (b) writes observations that need **2 user-scope samples** before a rule can activate.

### Design Decision Log

```text
Stage: Design Decision Log
Exists: YES — captureGenerateDecision, IndexedDB session
Runtime Entry: every successful generate
Called: YES
Consumed By: observeFeedback/observeOutcome, decisionLogFor tests, not the painter
Downstream Decision: none on SVG; enables learning provenance
Behavioral Proof: designDecisionLog.test, learningGate appliedKnowledge round-trip
Regression Proof: yes
Determinism: YES (aside from `at: Date.now()`)
Production Path: YES as recorder
Evidence: E4 as log; E0 as decision maker
Decision Authority: DA-1
Status: PARTIAL
```

This is a **design decision log**, not a debug `console.log`. It still is not a controller. Overlay candidate lists in the log are real only when overlay ran; otherwise a fake single `ONLY` kit row.

### Design Knowledge

```text
Stage: Design Knowledge
Exists: YES — DesignKnowledgeStore rules (condition, recommendation, scope, state, evidence)
Runtime Entry: upsert from deriveKnowledgeCandidates; matchingKnowledge
Called: YES
Consumed By: applyKnowledgeToBrief; studioHintsFromKnowledge
Downstream Decision: only when state=active and recommendation kind is consumed
Behavioral Proof: C7 + learningGate
Regression Proof: yes
Determinism: YES
Production Path: YES (matching on generate)
Evidence: E4
Decision Authority: DA-3 when studio-archetype/background active; DA-1 for unused kinds on P1
Status: REAL (store) with path-dependent impact
```

### Learning Validation Gate

```text
Stage: Learning Validation Gate
Exists: YES — validateKnowledge (samples, confidence, cue conflict → reject)
Runtime Entry: runLearningCycle after each observation
Called: YES
Consumed By: approveKnowledge (refuses non-validated; global refuses automated)
Downstream Decision: YES — blocks activation
Behavioral Proof: learningGate contradict/thin; C7 rejected candidate does not change marble
Regression Proof: yes
Determinism: YES
Production Path: YES
Evidence: E5
Decision Authority: DA-4 (gate)
Status: REAL
```

### Approved Knowledge

```text
Stage: Approved Knowledge
Exists: YES — state active
Runtime Entry: approveKnowledge automated (user/brand) or human
Called: YES
Consumed By: matchingKnowledge on next generate
Downstream Decision: studio hints / kit brief patches
Behavioral Proof: C7 TEST 7–8 A/B hash; learningGate luma director-cue on kit
Regression Proof: yes
Determinism: YES
Production Path: YES
Evidence: E5 for studio-archetype avoid → future SVG
Decision Authority: DA-3
Status: REAL
```

### Future Design

```text
Stage: Future Design
Exists: YES as “next independent generate with active knowledge”
Runtime Entry: subsequent FormaLocalEngine.generate
Called: YES
Consumed By: same engines as any generate
Downstream Decision: YES when knowledge matches
Behavioral Proof: C7 TEST 7–8, 10, 12 (preflight still exportOk)
Regression Proof: C6 isolation with empty store
Determinism: YES for same knowledge state
Production Path: YES (in-process knowledge; IndexedDB persist)
Evidence: E5
Decision Authority: DA-3
Status: REAL
```

Requires repeated consistent observations. Empty store = baseline. Global never auto-activates.

---

## 7. Decision Authority Matrix

| Stage | DA | Notes |
|---|---|---|
| Conversation Intelligence | DA-3 | Structures generate inputs |
| Structured Brief | DA-4 | Production contract |
| Design Intent | DA-2 / DA-0 | Kit vs studio |
| Visual Language | DA-3 / DA-0 | Overlay vs studio |
| Visual Concept | DA-3 / DA-0 | Kit lockup vs studio |
| Art Direction (studio) | DA-4 | Archetype/background/temperament |
| Art Direction (kit block) | DA-3 | P2 only |
| Asset Language | DA-3 / DA-0 | Overlay vs studio |
| Composition (studio layouts) | DA-4 | Paints the face |
| Candidate Generation | DA-3 / DA-0 | Overlay island vs P1 |
| Evaluation / Critic | DA-3 / DA-1 | Kit repair vs studio log |
| Deterministic SVG | DA-4 | Geometry owner |
| Preflight | DA-4 gate | Not a designer |
| Outcome | DA-2 | Via learning only |
| Feedback | DA-3 | Signal; SVG via other stages |
| Decision Log | DA-1 | Record |
| Design Knowledge | DA-3 | If active + consumed kind |
| Learning Validation Gate | DA-4 | Blocks bad rules |
| Approved Knowledge | DA-3 | Future generate |
| Future Design | DA-3 | Next generate |
| LLM | DA-2 | Semantic only, sanitized |
| User veto / template pick | DA-4 | Hard constraints |

---

## 8. Evidence Matrix

| Capability | Evidence | Why |
|---|---|---|
| Conversation → brief → generate | E5 | App + C0–C4/C6 tests |
| Structure ranking → user pick → dieline | E5 | C5 tests |
| Studio direction → SVG hash | E5 | golden + C6 |
| C6 veto/vary downstream | E5 | studioConversation |
| LLM sanitize / fail-open / no SVG | E4/E5 | C8 (mocked provider + null provider) |
| Kit 29 fingerprints | E4 | designBrainV1 freeze (plan, not studio) |
| Overlay candidate winner | E4 | phase17+ (not P1) |
| Kit critic repair | E4 | CritiqueEngine + generate without studio |
| Studio critic repair | E0 | Forced off; no ON/OFF isolation on P1 |
| Learning gate | E5 | C7 + learningGate |
| Knowledge → future studio SVG | E5 | C7 A/B hash |
| avoid-motif → studio SVG | E1 | Applied to plan; painter unused |
| logoHref → studio SVG | E1 | Passed into generate; studio never reads |
| parseIntentWithLlm | E1 | Defined, never called |
| critiqueWithLlm | E1 | Tests only |
| advisePlan | E1 | Identity function, no callers |
| scoreVisualCraft | E2 | Asserted in kit tests; never selects |

---

## 9. Candidate Generation Reality

**Production chat does not generate candidate A/B/C faces.** One `DesignDirection` is resolved, one studio face is painted.

What exists:

1. **Studio variation** (`directionVariation` / `variationIndex`): walks the ranked archetype pool and changes seed. Same family can stay. This is **controlled variation**, not a candidate set with identities and a selector.
2. **Overlay composition candidates** (`generateCompositionCandidates`): multiple strategies, pre-score, top-3 paint, post-score, `chooseCompositionWinner`. Real in tests. Off P1. Off 25/29 kit-grade styles.
3. **Structure candidates** (`recommendStructures`): ranked carton templates. Real. **User** (or skip-default) selects. Not visual-design candidates.
4. **Logged kitCandidates**: always one `ONLY` row when overlay did not run. Decorative.

```text
seed variation  ≠  candidate intelligence
structure offer ≠  visual candidate generation
```

---

## 10. Critic / Evaluation Reality

Layers (do not collapse):

| Layer | Selects winner? | Edits SVG? | Production chat? |
|---|---|---|---|
| `scoreDesign` / `scoreVisualCraft` | NO | NO | Computed; craft unused for selection |
| `critiquePlan` | NO | via `repairPlan` on P2 | Called; `needsRepair` forced false on P1 |
| `critiqueCandidate` / composition critic | YES among overlay slots | winner markup | NO on P1 |
| `critiqueDesign` | NO | NO | Log + Workspace sentence |
| `critiqueAsFeedback` | NO | only if someone passed it as generate feedback | **Not wired** to generate |
| `critiqueWithLlm` | NO | NO | Unused in App |

Negative control **critic ON vs OFF** on production studio: **NOT PROVEN** (repair is unconditionally disabled; no flag). Kit path has implicit ON (repair when thresholds fail). That is not the product UI.

Score vs critic: scores exist; **selection authority is missing on P1**.

---

## 11. Deterministic Painter Boundary

```text
Authoritative geometry:
  studio: composeStudioArtwork + backgrounds.ts + anatomy/text ledger
  kit:    composeArtwork + kit lockups / heroes / optional overlay

LLM must not supply: raw SVG, path d=, coordinates, templateId, structureId, unknown families
Proven: sanitizeBriefExtract, sanitizeStudioDirection, C8 injection tests, fail-open null provider
```

Painter consumes on P1: `DesignDirection` + `DesignBrief` copy facts + dieline panels + palette. It does **not** consume: visual language array, concept id, asset language policy, composition candidate scores, DesignCritic findings, LLM markup.

---

## 12. Feedback / Learning Reality

Proven C7 chain (studio):

```text
USER “Bu yön fazla yoğun.”
 → parseFeedback { type:composition, target:density, direction:decrease }
 → generate(..., feedback)
 → observeFeedback + studioFeedbackRecommendations (avoid current archetype)
 → afterObservation → deriveKnowledgeCandidates → validateKnowledge
 → approveKnowledge automated if user/brand thresholds
 → next generate: studioHintsFromKnowledge avoidArchetypes
 → different archetype → different face hash
 → preflight still exportOk
```

Thresholds (`LEARNING_THRESHOLDS`): user minSamples 2, brand 3, global 30; consistency 0.7; confidence 0.6; **global autoApprove false**.

Also exists (kit P2): `avoid-motif` / `director-cue` via `applyKnowledgeToBrief` → `createPlan`. On P1 those recs are weak/incidental.

Outcome ratings can write observations (`observeOutcome`) including prefer/avoid current studio archetype.

**Unvalidated observation, rejected rule, conflicting cue, global unapproved signal** do not change production (C7 negative tests).

---

## 13. Negative Controls

| Control | Result | Proof |
|---|---|---|
| C6 veto does not change structure | structureId stable | studioConversation / C6 docs |
| C6 direction-independent copy/barcode | direction may stay | C6 tests |
| C5 physics ranking isolated from LLM | LLM cannot set templateId | C8 sanitize + C5 tests |
| C7 empty knowledge = C6 baseline | veto still works | studioLearning TEST 11 |
| C7 rejected candidate | marble still marble | TEST 6 |
| C7 global auto-approve refused | stays validated | studioLearning global it |
| C8 unknown enum / SVG injection | dropped | studioChatC8 |
| C8 LLM off | heuristics continue | fail-open tests |
| Critic ON/OFF on P1 | **NOT PROVEN** | repair hard-disabled |
| Overlay critic OFF on P1 | N/A | overlay not called |

---

## 14. Sensitivity / Isolation Evidence

### Sensitivity (production studio, from existing tests + code)

| Change | Brief/direction | Structure | Composition | SVG hash | Preflight |
|---|---|---|---|---|---|
| brand / product | copy + seed | no | text | yes | honesty if empty brand |
| colors | palette/temperament | no | paint | yes | contrast items |
| sector / coffee vs perfume | heuristic pin | maybe via user pick | archetype | yes | sector gates (kit) |
| studioFamily pin / veto | direction | no | yes | yes | still exportOk |
| directionVariation | seed/pool | no | yes | yes (C6) | — |
| copyOverrides tagline | direction copy | no | lockup text | yes (C4) | — |
| dimensions / template | face W/H, dieline | yes | layout scale | yes | dieline items |
| logoScale / titleScale | overrides stored | no | **no on P1** | **no (unproven / unused)** | — |
| avoidMotifs | plan.visualConcept | no | **no on P1** | no (P1) | — |
| createPlan visualConcept id | plan | no | **no on P1** | no (P1) | — |
| approved studio-archetype avoid | hints | no | yes | yes (C7 A/B) | exportOk |

Where SVG changes without an intermediate named stage changing: **DIRECT / INCIDENTAL** (e.g. seed hash from brand string; directorCue substring in scoring blob).

### Isolation

| Capability | OFF vs ON | Proven? |
|---|---|---|
| LLM | Null provider vs mock JSON | YES (C8) — SVG still deterministic without LLM |
| Studio direction family | marble vs veto | YES |
| Learning knowledge | empty vs 2× density feedback | YES (hash differs) |
| Concept / VL / asset language | cannot toggle independently on P1 | NOT PROVEN (always computed, unused) |
| Critic | cannot toggle on P1 | NOT PROVEN |
| Overlay candidates | skipped by studio flag | YES (never called) — ON not on P1 |

---

## 15. False Completeness Findings

These look like Design Intelligence and are not production decision authority:

1. **C0–C8 CLOSED** used as proof of a full DI pipeline.
2. **`docs/DESIGN_BRAIN_V1_AUDIT.md` generate chain** describing kit compose+repair as *the* runtime (App is studio).
3. **`DesignPlan` always created** on studio generate → appears in spec / log as if it painted the face.
4. **`kitCandidates` `decision: 'ONLY'`** looks like a winner among alternatives.
5. **`scoreDesign` / `scoreVisualCraft`** look like evaluation.
6. **`advisePlan`** looks like an advisor (returns input).
7. **`critiqueDesign` in Workspace** looks like a critic loop.
8. **`asset-family` preflight pass** on every studio job.
9. **Conversation “Logoyu aldım. Monogram yerine bunu yerleştireceğim.”** — studio never places `logoHref`.
10. **`parseIntentWithLlm` / `critiqueWithLlm` / `planGraph`** exported intelligence APIs without production callers.
11. **Visual language / concept / asset language types** present on every spec.designPlan.
12. **Candidate / critic vocabulary** in compositionCandidates + DesignDecisionLog overlay fields.
13. **Reference “analysis”** (bucketed colors/layout guess) is not vision-model intelligence; optional color seed only.
14. **Documentation maturity scores** in STUDIO_CHAT_AUDIT (single-axis /5) — not this audit’s dimensions, and some rows were already stale vs C7 wiring.

---

## 16. Dead / Decorative Intelligence

| Item | Class |
|---|---|
| `advisePlan` | DEAD (identity, no callers) |
| `planGraph` / `buildDesignGraph` | UNUSED in generate |
| `parseIntentWithLlm` | DEAD (export only) |
| `critiqueWithLlm` | test-only |
| `critiqueAsFeedback` | test-only (not passed into generate) |
| `scoreVisualCraft` | decorative score (assertions, no selection) |
| `DESIGN_PRINCIPLES` on plan | labels critique hints; not a decision |
| Studio `needsRepair: false` wrapper | disables kit critic on P1 |
| `logoHref` on P1 | UNUSED |
| `avoidMotifs` on P1 | DECORATIVE |
| Overlay search on P1 | UNUSED |
| `kitGradeSkipsOverlay` true styles | overlay DEAD for those kits |
| Reference layout enum | DECORATIVE (colors may apply) |
| Studio preflight `asset-family` | DECORATIVE pass |
| Decision-log overlay path when studio | PARTIAL/DECORATIVE candidates |

Duplicate engines: kit Design Brain vs studio DNA painters. Not dead; **split**. Treating them as one pipeline is the error.

---

## 17. Regression

Verified this audit (no golden hash writes):

| Freeze | Result |
|---|---|
| 29 catalog jobs / fingerprints (`designBrainV1` F/G) | green in 167-file subset |
| 25 kit-grade skip overlay / 4 playful overlay | encoded in `kitGradeSkipsOverlay` tests |
| 18/18 studio golden hashes | `studioGolden.test.ts` green |
| C0–C8 related files listed in §3 | 167 passed |
| Deterministic studio re-hash | studioGolden same-generate test |
| Preflight on C7 future design | TEST 12 `exportOk` |
| Full suite | **432 passed, 1 failed** |

**BASELINE FAILURE:** `phase15.test.ts` colors copy `/hex/i` — ask string changed earlier; **not fixed in this audit**.

Required list (vintage-badge, lockup Y, languageTreatment, concept family gates) lives in kit phase tests; those files were in the **432 passed** set except phase15. This audit did not re-print every assertion name; it did not change hashes.

---

## 18. Maturity Dimensions

No arithmetic total. Pipeline-level (holistic judgment of the *claimed* end-to-end DI pipeline, not a mean of stages):

| Dimension | Score | Meaning here |
|---|---|---|
| A Architecture | **2** | Dual-engine, target stage names ≠ one call graph |
| B Implementation | **3** | Islands are implemented and behave; several APIs are identity/unused |
| C Decision Authority | **2** | Strong local authorities (painter, direction, gate); no critic-selector; many DA-0 stages |
| D Evidence | **3** | Strong behavioral+regression on islands; critic isolation on P1 missing |
| E Production Proof | **3** | Chat→studio→SVG→preflight is integrated; kit overlay/critic is test-path |

Per stage (A Architecture / B Implementation / C Decision Authority / D Evidence / E Production Proof):

| Stage | A | B | C | D | E |
|---|---|---|---|---|---|
| Conversation Intelligence | 3 | 4 | 3 | 4 | 4 |
| Structured Brief | 4 | 4 | 4 | 4 | 4 |
| Design Intent | 2 | 2 | 1 | 3 | 1 |
| Visual Language | 3 | 3 | 1 | 4 | 1 |
| Visual Concept | 3 | 3 | 1 | 4 | 1 |
| Art Direction | 3 | 4 | 4 | 4 | 4 |
| Asset Language | 3 | 3 | 1 | 4 | 1 |
| Composition | 3 | 4 | 4 | 4 | 4 |
| Candidate Generation | 2 | 2 | 1 | 3 | 1 |
| Evaluation / Critic | 2 | 3 | 1 | 3 | 1 |
| Deterministic SVG | 4 | 4 | 4 | 4 | 4 |
| Preflight | 4 | 4 | 4 | 4 | 4 |
| Outcome | 2 | 2 | 1 | 2 | 2 |
| Feedback | 3 | 4 | 3 | 4 | 4 |
| Decision Log | 3 | 3 | 1 | 3 | 3 |
| Design Knowledge | 3 | 3 | 3 | 4 | 3 |
| Learning Validation Gate | 4 | 4 | 4 | 4 | 4 |
| Approved Knowledge | 3 | 4 | 3 | 4 | 4 |
| Future Design | 3 | 4 | 3 | 4 | 4 |

---

## 19. Critical Gaps

1. **No unified Design Intelligence graph.** Target chain Intent→VL→Concept→AD→Assets→Candidates→Critic→SVG is not the runtime.
2. **Production painter ignores Design Brain plan** (VL, concept, asset language, kit composition grammar).
3. **No production candidate set / winner selection** for faces.
4. **Studio critic cannot repair** (`needsRepair: false`). Findings are UI/log.
5. **`critiqueAsFeedback` not on the generate path** — critic does not enter learning unless the user speaks.
6. **Kit learning recs (`avoid-motif`, `director-cue`) do not drive studio DNA.**
7. **Logo image unused** on studio faces.
8. **`logoScale` / `titleScale` iteration is a kit-lockup control**, not a studio control.
9. **LLM direction/copy/brief only if URL configured**; default production is heuristics.
10. **Stale audits** still describe kit compose as production.
11. **Cannot isolate critic/concept on P1** without a code change → those authorities stay NOT PROVEN on the product path.
12. **Outcome is not a quality measurement** of the design.

---

## 20. Production-Proven Chain

### Visual production (P1) — REAL

```text
USER
→ CONVERSATION (extract + ask + C6 talk)
→ BRIEF
→ STRUCTURE (ranked offer, user pick)
→ DIRECTION (decideDirection + hints)
→ STUDIO COMPOSITION (layouts + DNA backgrounds)
→ DETERMINISTIC SVG
→ PREFLIGHT (ledger + dieline + honesty)
```

Intent / visual language / concept / asset language / candidates / critic-selection are **not** on this chain.

### Learning loop — REAL for studio-archetype knowledge

```text
USER FEEDBACK
→ parseFeedback
→ OBSERVATION (+ studio avoid rec)
→ VALIDATION GATE
→ APPROVED (user/brand auto)
→ FUTURE generate
→ studioHintsFromKnowledge
→ different DIRECTION
→ different SVG
```

Not proven: single observation → future design; critic findings → knowledge; global auto-learn; avoid-motif → studio SVG.

---

## 21. Final Reality Status

**FRAGMENTED.**

PAXOLAB today is a **deterministic studio packaging engine** with a **real conversation→brief→direction→SVG path**, a **real structure recommender**, a **real learning gate** that can change **future studio direction**, and a **separate kit Design Brain** with language/concept/overlay/critic machinery that is **test- and catalog-grade**, mostly **not** the chat production painter.

It is **not** a closed-loop design intelligence system that generates candidates, critiques them, selects a winner, and learns from that critic. Calling the kit metadata stack “the pipeline” is false completeness.

**Implementation performed:** NONE.

---

### Stage matrix (audit §36)

| Stage | Exists | Called | Consumed | Decision Impact | Behavioral | Regression | Production | Evidence | Authority |
|---|---|---|---|---|---|---|---|---|---|
| Conversation Intelligence | Y | Y | Y | Y | Y | Y | Y | E5 | DA-3 |
| Structured Brief | Y | Y | Y | Y | Y | Y | Y | E5 | DA-4 |
| Design Intent | Y | Y | kit | kit only | kit | Y | N | E4/E1 | DA-2/0 |
| Visual Language | Y | Y | kit | kit overlay | kit | Y | N | E4/E1 | DA-3/0 |
| Visual Concept | Y | Y | kit | kit lockup | kit | Y | N | E4/E1 | DA-3/0 |
| Art Direction | Y | Y | Y | Y | Y | Y | Y | E5 | DA-4 |
| Asset Language | Y | overlay | overlay | overlay | overlay | Y | N | E4/E1 | DA-3/0 |
| Composition | Y | Y | Y | Y | Y | Y | Y | E5 | DA-4 |
| Candidate Generation | Y | overlay | overlay | overlay | overlay | Y | N | E4/E0 | DA-3/0 |
| Evaluation / Critic | Y | Y | log/P2 | P2 repair | P2 | Y | log only | E4/E2 | DA-3/1 |
| Deterministic SVG | Y | Y | Y | Y | Y | Y | Y | E5 | DA-4 |
| Preflight | Y | Y | Y | gate | Y | Y | Y | E5 | DA-4 |
| Outcome | Y | rating/export | learning | delayed | Y | Y | partial | E3 | DA-2 |
| Feedback | Y | Y | Y | Y | Y | Y | Y | E5 | DA-3 |
| Decision Log | Y | Y | learning | no SVG | Y | Y | recorder | E4 | DA-1 |
| Design Knowledge | Y | Y | matching | if active | Y | Y | Y | E4 | DA-3 |
| Learning Validation Gate | Y | Y | Y | blocks | Y | Y | Y | E5 | DA-4 |
| Approved Knowledge | Y | Y | Y | future | Y | Y | Y | E5 | DA-3 |
| Future Design | Y | Y | Y | Y | Y | Y | Y | E5 | DA-3 |

### Full decision graph table (audit §35)

| From | To | Evidence | Decision Authority | Status | Proof |
|---|---|---|---|---|---|
| User | Conversation | E5 | DA-3 | REAL | App + C0–C4/C6 |
| Conversation | Brief | E5 | DA-4 | REAL | extract/mergeBrief |
| Brief | Intent | E4 | DA-2 | PARTIAL | createPlan.designIntent; unused P1 painter |
| Intent | Visual Language | E4 | DA-3 | PARTIAL | visualLanguageFor; kit |
| Visual Language | Concept | E4 | DA-2 | PARTIAL | allow-list retie; not a selector of many concepts |
| Concept | Art Direction | E1 | DA-0 | MISSING on P1 | studio AD from brief/hints, not concept id |
| Art Direction | Asset Language | E1 | DA-0 | MISSING on P1 | studio uses DNA, not assetLanguageFor |
| Asset Language | Composition | E4 | DA-3 | PARTIAL | overlay only |
| Composition | Candidate Generation | E1 | DA-0 | MISSING on P1 | one layout; no A/B/C |
| Candidate Generation | Critic | E4 | DA-3 | PARTIAL | overlay critic; not P1 |
| Critic | Selection | E4 | DA-3 | PARTIAL | overlay winner / kit repair; P1 none |
| Selection | Deterministic SVG | E5 | DA-4 | REAL | single paint path (direction→studio SVG) |
| SVG | Preflight | E5 | DA-4 | REAL | runPreflight + studio ledger |
| Outcome | Feedback | E3 | DA-2 | PARTIAL | rating/export → observeOutcome; not automatic critic |
| Feedback | Decision Log | E4 | DA-1 | REAL | captureGenerateDecision.feedback |
| Decision Log | Knowledge | E5 | DA-3 | REAL | observe → candidates |
| Knowledge | Validation Gate | E5 | DA-4 | REAL | validateKnowledge |
| Approved Knowledge | Future Design | E5 | DA-3 | REAL | studioHintsFromKnowledge → hash |

---

## Critical questions (audit §41)

1. **Real DI pipeline?** No. Fragmented dual-engine with a real studio production path and a separate kit brain.
2. **REAL stages:** Conversation, Brief, Studio Art Direction, Studio Composition, Deterministic SVG, Preflight, Feedback parse, Learning Gate, Approved studio knowledge → future direction, Structure recommendation (as a side chain).
3. **PARTIAL:** Intent, VL, Concept, Asset language, Candidates, Critic, Outcome, Decision log, Kit learning recs on studio.
4. **DECORATIVE:** kit ONLY-candidate log, craft scores, studio asset-family pass, principles-as-labels, logo promise, plan fields on studio spec.
5. **Authority:** Painter + direction resolver + user veto/template + validation gate + preflight gate.
6. **Candidate generation?** Overlay island only. Not production chat.
7. **Critic?** Kit repair yes; overlay slot critic yes; production studio no selection.
8. **Winner selected?** Overlay yes; studio no (single resolve). Log may say ONLY.
9. **Design intent artifact?** Kit block yes; P1 no.
10. **Visual concept decision input?** Kit lockup/overlay yes; studio no.
11. **Art direction affects output?** Yes (studio).
12. **Composition a decision stage?** Yes as deterministic layout; not as scored alternatives on P1.
13. **Feedback changes future design?** Yes after gate + samples, for studio-archetype avoid/prefer. Immediate vary is C6, not learning.
14. **Validation real gate?** Yes.
15. **Approved knowledge changes future?** Yes (C7 A/B).
16. **Painter consumes?** Direction + brief copy/palette/dieline. Not VL/concept/asset/candidates/critic on P1.
17. **LLM boundary?** Semantics in allowlists; fail-open; no geometry; default off.
18. **False completeness:** §15.
19. **Missing edges:** Concept→studio AD; AD→asset language; composition→candidates; critic→P1 selection; critic→learning.
20. **E0/E1 claims:** production critic authority, unified DI pipeline, logo-on-face, advisePlan, LLM intent parser, avoid-motif on studio SVG.
