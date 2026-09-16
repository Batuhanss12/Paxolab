# C6 — Stüdyo konuşması (why / veto / vary)

**Tarih:** 16 Eyl 2026  
**Durum:** Kapandı  
**Önceki:** C5 `docs/STUDIO_CHAT_C5.md`  
**Sonraki:** C7 öğrenme halkası (bu fazda yok)

Kilitler durdu: LLM SVG yok, painter yok, copyBank yok, `structureRecommend` / C5 ranking yok, 29 kit freeze, 18 stüdyo hash.

---

## 1. BEFORE

C5 kapanışında yön **üretimde gerçekti**, sohbette **dekoratifti**.

| Bağlantı | Durum | Kanıt |
|---|---|---|
| USER → BRIEF | REAL | C1–C2 extract + ASK |
| BRIEF → DIRECTION | REAL | `hintsFromBrief` + `scoreArchetype` + `resolveDirection` |
| DIRECTION → COMPOSE → SVG | REAL | `FormaLocalEngine` → `composeStudioArtwork` |
| CURRENT DIRECTION STATE | PARTIAL | generate `brief.studioFamily` basar; sohbet “neden” okumaz |
| WHY | DEAD | `directionBriefing` marka/ruh/renk cümlesi; arketip yok |
| VETO | PARTIAL / DEAD | `DirectionHints.avoidArchetypes` skorlar (−1.5) ama pin (`hints.archetype`) yine kazanır; chat parse yok |
| VARY | PARTIAL | StyleBar `variationIndex`; “daha sakin” temperament yazar; aile kilitliyken arketip değişmez |
| VETO vs GENERATE | DECORATIVE risk | “tamam” cevabı yoktu bile — istek hint’e düşer, generate marble kalır |
| STRUCTURE (C5) | REAL | dokunulmadı |

Direction families (repo, `STUDIO_FAMILIES`):

```text
marble
botanical
line-scene
wave
landscape
ink
dark-luxe
tech
```

---

## 2. CURRENT DIRECTION MODEL

Kaynak: `src/engine/studio/direction.ts` + `family.ts` + `brief.studioFamily` / `brief.avoidStudioFamilies` / `brief.directionVariation`.

```text
brief
  → assembleStudioHints
      hintsFromBrief          (visual override | sektör prior)
      hintsFromVeto           (avoidStudioFamilies → avoidArchetypes)
      extras                  (knowledge / override)
      hintsFromFamily         (studioFamily, veto değilse)
  → decideDirection
      scoreArchetype          (C3 ağırlıkları aynı)
      skip pin if avoided
      pick winner
      groundedClaims          (yalnız REAL)
  → composeStudioArtwork
```

Yeni brief alanları (katalog job yazmaz):

| Alan | Rol |
|---|---|
| `studioFamily` | mevcut aile (generate damgası / kullanıcı pin) |
| `avoidStudioFamilies` | veto listesi — union merge |
| `directionVariation` | chat vary adımı → `variationIndex` |

---

## 3. WHY PATH

```text
USER "Neden bunu seçtin?" / "Neden?" / "Neden bu yönü seçtin?"
  → parseDirectionTalk.kind = why
  → inspectStudioDirection(brief)     // generate ile aynı hint zinciri
  → explainStudioDirection
  → shouldGenerate = false
```

Örnek (Nox + `mermer · altın`): görsel override pin’i REAL. Generic “modern ve şık” yok.

---

## 4. VETO PATH

```text
USER "Marble istemiyorum." / "Bu yönü istemiyorum." / "Başka bir şey deneyelim."
  → parseDirectionTalk.kind = veto
  → avoidStudioFamilies += marble (veya current)
  → studioFamily cleared if vetoed
  → decideDirection skips avoided pin
  → shouldGenerate = true
  → FormaLocalEngine.generate
  → SVG ≠ marble-frame
```

“Vazgeçtim, daha teknik olsun.” → veto current + `studioFamily = tech`.

---

## 5. VARY PATH

```text
USER "Bu yön iyi ama daha sakin yap." / "Marble kalsın ama daha az yoğun olsun."
  → parseDirectionTalk.kind = vary
  → studioFamily korunur
  → directionVariation += 1
  → temperament light-luxe + luxury-tighten (quieter)
  → compose input değişir
  → face hash değişir
```

Aile değiştirmez. “daha botanik / daha mermer” pin’dir (mevcut `parseIntent` sözlüğü).

---

## 6. DECISION AUTHORITY

| Edge | Sınıf | Not |
|---|---|---|
| USER → CURRENT DIRECTION | REAL | `studioFamily` + inspect |
| BRIEF → SCORE | REAL | C3 `scoreArchetype` |
| VISUAL OVERRIDE → PICK | REAL | `pinSource: visual` + hintPin |
| SECTOR PRIOR → PICK | REAL | `pinSource: sector` (override yoksa) |
| WHY → RESPONSE | REAL | yalnız `authority: REAL` claim |
| VETO → STATE | REAL | `avoidStudioFamilies` |
| VETO → PICK | REAL | pin skip + −1.5; family hint yok |
| VETO → SVG | REAL | generate winner ≠ vetoed family |
| VARY → STATE | REAL | `directionVariation` + temperament |
| VARY → SVG | REAL | hash değişir, aile aynı |
| `directionBriefing` (ilk generate ack) | DECORATIVE | C3 cümlesi; why bunu kullanmaz |
| LLM direction (App) | PARTIAL | fail-open; veto `applyVetoToHints` ile budanır |
| C5 structure | REAL / isolated | veto template/dieline değiştirmez |

---

## 7. PROOF TESTS

`npx vitest run src/engine/studio/studioConversation.test.ts` → **10 passed**.

| Test | Sonuç |
|---|---|
| 1 WHY grounded | **PASS** — marble + REAL claim, “modern ve şık” yok |
| 2 WHY not decorative | **PASS** — `colors` ablate → winner `diagonal-tech`, marble skor düşer |
| 3 VETO state | **PASS** — `avoidStudioFamilies` marble, family cleared |
| 4 VETO downstream | **PASS** — painted archetype ≠ `marble-frame` |
| 5 VARY state | **PASS** — family marble, `directionVariation > 0` |
| 6 VARY output | **PASS** — temperament `light-luxe`, face hash ≠ base |
| 7 Stateful conversation | **PASS** — botanical why → tech generate |
| 8 Negative B | **PASS** — barcode + copy winner’ı değiştirmez |
| 9 Structure isolation | **PASS** — template / structure / dims aynı |
| 10 Determinism | **DETERMINISTIC** |
| 11 Production path | **PASS** — why → veto → studio SVG, `blocking=false`, `exportOk=true` |

---

## 8. NEGATIVE CONTROLS

**A — structure:** veto sonrası `templateId`, `structureId`, `dieline.dimensions` aynı. Yön değişir.

**B — independent field:** `barcode` + `copyOverrides` coffee marble winner’ı değiştirmez.

Renk / “mermer” sözcüğü direction-dependent (C3 visual override) — ablate testi bunu **authority** olarak kullanır, negatif kontrol olarak değil.

---

## 9. DETERMINISM

Aynı brief + “Marble istemiyorum.” × 2 → aynı `avoidStudioFamilies`, aynı winner, aynı face hash.

```text
DETERMINISTIC
```

---

## 10. REGRESSION

C6 öncesi (bu çalışma, dokunulmamış ağaç):

```
npx vitest run
  structureRecommend + structureOffer + studioDirection + studioGolden
  + copyBrief + conversationFlow + conversationState + conversationUnderstand
  + parseIntent + designBrainV1
→ 10 files, 102 passed
```

C6 sonrası aynı paket + catalog + FormaLocalEngine + studioConversation:

```
→ 13 files, 130 passed
```

| Kilit | BEFORE | AFTER |
|---|---|---|
| 29/29 fingerprints | PASS (`designBrainV1`) | PASS |
| 18/18 studio golden | PASS | PASS (hash güncellenmedi) |
| C5 structure ranking | PASS | PASS |
| C0–C4 conversation / copy | PASS | PASS |
| Painter / preflight | PASS | PASS |
| BASELINE FAILURE | yok | yok |

---

## 11. REMAINING GAPS

1. İlk generate ack hâlâ `directionBriefing` (mood). Why sorusu grounded; otomatik “neden” cümlesi generate’e eklenmedi.
2. Vary yoğunluk = temperament + `variationIndex`, ayrı density parametresi yok.
3. LLM art director fail-open durur; veto budaması App’te var, LLM kapalıysa etkisiz.
4. C7 öğrenme halkası yok (bilinçli).

---

## 12. EXIT STATUS

```text
C6 CLOSED
```

Current direction state; why grounded + en az bir REAL authority; veto state + SVG; vary state + hash; conversation turn’leri; C5 isolation; determinism; production path; C0–C5 + 18/18 yeşil.
