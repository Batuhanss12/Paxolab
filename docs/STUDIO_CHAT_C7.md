# C7 — Öğrenme halkası

**Tarih:** 16 Eyl 2026  
**Durum:** Kapandı  
**Önceki:** C6 `docs/STUDIO_CHAT_C6.md`  
**Sonraki:** C8 LLM brief+yön (bu fazda yok)

Kilitler durdu: yeni learning/ML/embedding yok, painter yok, C5 ranking yok, C6 direction logic yok, 29 kit freeze, 18 stüdyo hash.

---

## 1. BEFORE

S7 Learning Gate **vardı**; sohbet üretim halkası **kopuktu**.

| Edge | Durum | Kanıt |
|---|---|---|
| USER → parseFeedback | PARTIAL | “çok klasik / çok dolu” var; “fazla yoğun” yok |
| parseFeedback → generate | PARTIAL | yalnız `isIteration` / StyleBar; yoğun cümlesi hint’e düşer |
| generate → observeFeedback | REAL | `FormaLocalEngine` + `noteFeedback` |
| observation → candidate | REAL | `deriveKnowledgeCandidates` — panel veya test `runLearningCycle` |
| candidate → validated | REAL | eşik + consistency |
| validated → active | PARTIAL | user/brand auto **yalnız panel**; generate cycle çağırmaz |
| global → active | REAL gate | `approve: automated` reddeder |
| active → brief / studio hints | REAL | `applyKnowledgeToBrief`, `studioHintsFromKnowledge` |
| empty store → baseline | REAL | katalog / golden sapmaz |
| C6 veto = learning | DECORATIVE risk | aynı session veto C7 değildir |

Audit cümlesi doğruydu: rating/export observation birikir; kural sohbet generate’inden açılmaz.

---

## 2. FEEDBACK MODEL

Yeni taxonomy yok. Mevcut `StructuredFeedback`:

| type | örnek utterance | recommendation |
|---|---|---|
| composition / density / decrease | “çok dolu”, **“Bu yön fazla yoğun.”**, “too dense” | `director-cue: open-air` + studio archetype avoid |
| visual_language / modernize | “çok klasik” | `avoid-motif` |
| motif / decrease | çerçeve fazla | avoid-motif + studio background avoid |
| rating ≥4 / export | OutcomeTracker | mevcut cue/archetype prefer |
| rating ≤2 | OutcomeTracker | mevcut cue/archetype avoid (support −1 / prefer false) |

C6 veto/vary ayrı katman: session `avoidStudioFamilies`. C7’ye sayılmaz.

---

## 3. OBSERVATION

`observeFeedback` / `observeOutcome` → `Observation`:

- `scope` user | brand | global
- `condition` sector + style + surface
- `signal` feedback | outcome
- `recommendation` kapalı sözlük veya yok (evidence-only)
- `support` +1 / −1
- `id` deterministic (`designId:revision:…:scope`)

“Bu yön fazla yoğun” ≠ serbest metin saklama. Normalize: `composition/density/decrease` → `open-air` + `studio-archetype prefer:false`.

---

## 4. SIGNAL SCOPE

| Level | Kim | Auto-activate | Sızma |
|---|---|---|---|
| user | `userId` default `local` | evet, n≥2, consistency≥0.7 | `userId: other` görmez |
| brand | `brandScopeKey` (hash, PII yok) | evet, n≥3 | Nova ≠ Elite Brew brand kuralı |
| global | tek scope | **hayır** — insan | 2 user feedback global active yapmaz |

`GLOBAL HUMAN SIGNAL = NOT AUTO-PROVEN`. Aggregation var; aktivasyon human.

---

## 5. KNOWLEDGE CANDIDATE

`aggregateObservations` → pattern key = scope|condition|recommendation.  
`deriveKnowledgeCandidates` yalnız eşik geçenleri `upsertKnowledgeRule` (`state: candidate`). **Activate etmez.**

---

## 6. VALIDATION

`validateKnowledge`:

- state === candidate
- sampleCount ≥ minSamples[level]
- confidence ≥ 0.6
- çelişen active cue → **rejected**

Pass → `validated`. Tek feedback auto-approve değil.

---

## 7. APPROVED KNOWLEDGE

`approveKnowledge(id, by)`:

- state must be `validated`
- `by === 'automated'` && global → **false**
- user/brand automated serbest

C7 increment: `afterObservation()` → `runLearningCycle({ approve: 'automated' })` observe sonrası. Panel hâlâ aynı kapı.

Rejected / candidate / validated-global → `activeKnowledge()` dışı.

---

## 8. FUTURE DECISION

| Recommendation | Tüketici | Karar |
|---|---|---|
| avoid-motif | `applyKnowledgeToBrief` | `brief.avoidMotifs` KNOWLEDGE_DERIVED |
| director-cue | aynı, cue boşsa | `directorCue` |
| studio-archetype / background | `studioHintsFromKnowledge` | pin veya avoid → `decideDirection` |

A/B: knowledge yok → coffee `marble-frame`. 2× “fazla yoğun” user kuralı → sonraki bağımsız generate marble değil; face hash değişir.

---

## 9. PROVENANCE

```text
utterance
  → parseFeedback
  → generate.feedback
  → Observation.id
  → rule.evidence[]
  → history candidate → validated → active
  → spec.appliedKnowledge
  → DesignDecisionLog.appliedKnowledge
```

---

## 10. DECISION AUTHORITY

| Edge | Sınıf |
|---|---|
| USER → parseFeedback | REAL |
| parseFeedback → observation | REAL |
| observation → candidate | REAL |
| candidate → validated | REAL |
| validated user/brand → active | REAL |
| validated global → active | REAL (yalnız human) |
| rejected → generate | REAL negative |
| active → studio SVG | REAL |
| empty → golden/kit | REAL isolation |
| C6 veto | REAL, learning değil |
| LLM feedback | PARTIAL fail-open |
| IDB persist | PARTIAL best-effort |

---

## 11. EVIDENCE LEVEL

| Aşama | Seviye |
|---|---|
| Feedback capture | E5 |
| Observation | E4 |
| Scope isolation | E4 |
| Candidate | E4 |
| Validation / reject | E4 |
| Approved → future decision | E5 (user/brand studio A/B + preflight) |
| Global auto | E4 **yok** — gate reddeder (doğru) |
| Production path | E5 |

---

## 12. PROOF TESTS

`npx vitest run src/engine/studio/studioLearning.test.ts src/engine/brain/learningGate.test.ts`

| Test | Sonuç |
|---|---|
| 1 Feedback capture | **PASS** |
| 2 Observation | **PASS** |
| 3 Scope | **PASS** — global active yok; other user / Nova brand sızmaz |
| 4 Candidate + validate + user active | **PASS** |
| 5 Unvalidated | **PASS** — marble durur |
| 6 Rejected | **PASS** — marble durur |
| 7–8 A/B authority | **PASS** — archetype + hash değişir |
| 9 Provenance | **PASS** |
| 10 Determinism | **DETERMINISTIC** |
| 11 C6 isolation | **PASS** — boş store’da veto çalışır |
| 12 Production path | **PASS** — chat → future SVG, `exportOk` |
| Global human gate | **PASS** |

---

## 13. NEGATIVE CONTROLS

- Thin candidate generate’i değiştirmez.
- Rejected kural generate’i değiştirmez.
- Tek / user-local sinyal global active olmaz.
- C6 veto learning store’u doldurmaz.
- Feedback’siz katalog / golden = empty knowledge.

---

## 14. DETERMINISM

Aynı 2 feedback + aynı brief → aynı `appliedKnowledge`, aynı archetype, aynı face hash.

```text
DETERMINISTIC
```

---

## 15. REGRESSION

C7 öncesi:

```
14 files / 137 passed
(C6 paketi + learningGate)
```

C7 sonrası:

```
15 files / 149 passed
```

| Kilit | BEFORE | AFTER |
|---|---|---|
| 29/29 fingerprints | PASS | PASS |
| 18/18 studio golden | PASS | PASS (hash yok) |
| C0–C6 | PASS | PASS |
| Painter / preflight | PASS | PASS |
| BASELINE FAILURE | yok | yok |

---

## 16. REMAINING GAPS

1. Global aggregation human’sız asla active olmaz (bilinçli).
2. Persist IndexedDB best-effort; testler in-memory.
3. `userId` generate’de her zaman `local` — çok kullanıcılı runtime yok.
4. C8 LLM brief/yön yok.

---

## 17. EXIT STATUS

```text
C7 CLOSED
```

Zincir gerçek: feedback → observation → candidate → validation → approved (user/brand auto, global human) → future design decision. Rejected/unvalidated downstream’e girmez. C6 ayrı. Empty = baseline.
