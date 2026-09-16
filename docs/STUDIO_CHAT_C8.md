# C8 — LLM brief + direction

**Tarih:** 16 Eyl 2026  
**Durum:** Kapandı  
**Önceki:** C7 `docs/STUDIO_CHAT_C7.md`  
**Sonraki:** Design Intelligence Reality Audit (bu fazda yok)

Kilitler durdu: yeni LLM mimarisi yok, painter yok, C5/C6/C7 motorları yok, 29 kit freeze, 18 stüdyo hash. LLM SVG/geometry çizmez.

---

## 1. BEFORE

LLM yolu **vardı**, brief extract **sızdırıyordu**.

| Edge | Durum |
|---|---|
| Provider + `generateStructured` | REAL — JSON, fail → null |
| `extractBriefWithLlm` | PARTIAL — extra keys / `templateId` / `dimensionsMm` `mergeBrief`’e girebilirdi |
| `sanitizeStudioDirection` | REAL — kapalı enum |
| App `extractBriefWithLlm` → `mergeBrief` | REAL |
| App `studioDirectionWithLlm` → `overridePatch.direction` | REAL |
| Fail-open (provider off) | REAL |
| extract throw / timeout | PARTIAL — App `.catch`, extract try yoktu |
| LLM SVG authority | DEAD intended; extract allowlist yoktu |

---

## 2. LLM RUNTIME

Tek kapı: `src/engine/llm/provider.ts`.

| Task | Entry | Tüketici |
|---|---|---|
| `brief-extract` | `extractBriefWithLlm` (`nlu.ts`) | App `mergeBrief` |
| `studio-direct` | `studioDirectionWithLlm` | App `overridePatch.direction` |
| `copy` | `generateCopyWithLlm` | engine `llmCopy` |
| `feedback-interpret` | `interpretFeedback` | revision feedback |
| `critique` | `critiqueWithLlm` | critic rows |

`VITE_FORMA_LLM_URL` yoksa `NullLlmProvider` → null. Testler `setLlmProvider` fixture.

---

## 3. OUTPUT SCHEMA

**Brief (allowlist, `sanitizeBriefExtract`):**

`brandName, productName, sector, subProduct, packagingMode (box\|label), styleType (6), directorCue (closed), colors, volume, barcode (8–14 digit), manufacturerName, manufacturerAddress, copyLocale (tr\|en)`

**Yok / drop:** `templateId`, `dimensionsMm`, `studioFamily`, SVG, path, x/y/w/h, fold, bleed, unknown keys.

**Direction (`sanitizeStudioDirection`):** `archetype | background | temperament` ∈ TASARIM REF sözlüğü + kısa rationale (geometry/hex yok).

---

## 4. USER → BRIEF

Fixture: “Gece kullanımı için premium, koyu ve sade bir kahve kutusu…”

→ `sector/gıda`, `subProduct/kahve`, `packagingMode/box`, `styleType/luxury`, `colors/koyu`, `directorCue/luxury-tighten`.

`provenance.source = LLM_INFERRED`. USER_EXPLICIT ezmez (C8 öncesi kural durur).

---

## 5. BRIEF → DECISION

| Field | Downstream | Authority |
|---|---|---|
| colors (mermer / klinik) | `hintsFromBrief` → arketip | REAL |
| styleType | temperament / palette / score | REAL |
| directorCue | `createPlan` / studio cue | REAL |
| sector / subProduct | yön prior + C5 productHits | REAL (C5’i bypass etmez) |
| packagingMode | surface | REAL |
| brand / product | copy, seed | REAL |
| volume / barcode / manufacturer | copy / barcode | PARTIAL (yüz metni) |
| templateId from LLM | **drop** | DEAD |
| dimensions from LLM | **drop** | DEAD |

A/B: `colors=mermer` → marble-frame; `colors=beyaz klinik` → line-scene; hash değişir.

---

## 6. DIRECTION

```text
studioDirectionWithLlm
  → sanitizeStudioDirection
  → overridePatch.direction
  → assembleStudioHints (veto / family last-merge)
  → decideDirection
  → composeStudioArtwork
```

LLM `diagonal-tech` → generate archetype `diagonal-tech`, `source: llm`.  
`cyber-organic-neon-quantum` → null. Catalog’a aile eklenmez.

---

## 7. LLM / DETERMINISTIC BOUNDARY

**LLM:** semantik extract, yön önerisi, copy, feedback satırı.

**Deterministic:** C5 yapı, dieline, compose, SVG, preflight, C6 veto/vary, C7 gate.

---

## 8. SVG / GEOMETRY ISOLATION

- `sanitizeBriefExtract` geometry regex + allowlist.
- `sanitizeStudioDirection` rationale GEOMETRY drop.
- critique/feedback `geometry` / `x=40` drop (S8 contract).

Production markup `data-art="studio"` painter’dan; LLM `<path d="M0 0">` yok.

---

## 9. FAIL-OPEN

timeout throw / invalid JSON / null / provider off → extract & direction `null` → heuristic generate devam, `exportOk`.

Schema-invalid field: **fail-closed** (drop). Transport: **fail-open**.

---

## 10. C5 / C6 / C7 ISOLATION

- C5: LLM `templateId=mailer` düşer; `recommendStructures` deterministic.
- C6: LLM off iken why/veto marble dışlar.
- C7: LLM `type: geometry` feedback’e girmez; `activeKnowledge()` boş kalır.

---

## 11. DECISION AUTHORITY

| Field | LLM üretir | Tüketici | Karar? | Authority |
|---|---|---|---|---|
| colors / styleType / directorCue | evet | brief → direction/plan | evet | REAL |
| sector / subProduct / packagingMode | evet | brief / C5 input | evet (sıra C5) | REAL |
| brand / product | evet | copy / seed | evet | REAL |
| studio archetype/background | evet | `decideDirection` | evet (sanitize) | REAL |
| copy tagline | evet | mergeLlmCopy | evet (generic drop) | PARTIAL |
| templateId / dims / svg | denenebilir | sanitize drop | hayır | DEAD |
| unknown family | denenebilir | sanitize null | hayır | DEAD |

---

## 12. EVIDENCE LEVELS

| Edge | Seviye |
|---|---|
| Structured + sanitize | E4 |
| User → brief | E4 |
| Brief / direction authority A/B | E4 |
| SVG / geometry / injection | E4 |
| Fail-open | E4 |
| C5/C6/C7 | E4 |
| Fixture production path | E5 |
| Canlı model (URL yok) | E2 (opsiyonel endpoint) |

---

## 13. PROOF TESTS

`npx vitest run src/engine/llm/studioChatC8.test.ts` → **14 passed**.

| Test | Sonuç |
|---|---|
| 1 Structured | PASS |
| 2 User → brief | PASS |
| 3 Brief authority | PASS |
| 4 Direction authority | PASS |
| 5 Unknown enum | PASS |
| 6 Raw SVG | PASS |
| 7 Geometry | PASS |
| 8 Injection | PASS |
| 9 Fail-open | PASS |
| 10 Determinism | DETERMINISTIC |
| 11 C5 | PASS |
| 12 C6 | PASS |
| 13 C7 | PASS |
| 14 Production path | PASS |

---

## 14. NEGATIVE CONTROLS

A SVG drop. B unknown family null. C dieline dims değişmez. D injection painter’ı bypass etmez.

---

## 15. DETERMINISM

Aynı sanitize direction × 2 → aynı archetype, structure, face hash.

```text
DETERMINISTIC
```

---

## 16. PRODUCTION PATH

```text
USER (fixture utterance)
  → extractBriefWithLlm (structured)
  → sanitizeBriefExtract
  → mergeBrief
  → studioDirectionWithLlm
  → sanitizeStudioDirection
  → FormaLocalEngine.generate
  → decideDirection + composeStudioArtwork
  → SVG + preflight exportOk
```

LLM off:

```text
USER → extract null → heuristic brief → generate → marble coffee → exportOk
```

---

## 17. REGRESSION

C8 öncesi (C7 paketi + mevcut LLM contract, bu çalışmada ölçülen çekirdek): C7 kapanışı **15 files / 149**.

C8 sonrası C0–C8 paketi:

```
18 files / 172 passed
```

| Kilit | BEFORE | AFTER |
|---|---|---|
| 29/29 | PASS | PASS |
| 18/18 golden | PASS | PASS (hash yok) |
| C0–C7 | PASS | PASS |
| Painter / preflight | PASS | PASS |
| BASELINE FAILURE | yok | yok |

---

## 18. REMAINING GAPS

1. Canlı model yalnız `VITE_FORMA_LLM_URL` ile; CI fixture kullanır.
2. `copyLocale` / manufacturer LLM’den gelebilir; C5 geometrisini değiştirmez.
3. Reality Audit bu fazda yok.

---

## 19. EXIT STATUS

```text
C8 CLOSED
```

LLM structured JSON üretir, sanitize edilir, brief/direction’a iner, en az bir alan kararı değiştirir; SVG/geometry/C5 bypass yok; fail-open güvenli; C6/C7 durur.
