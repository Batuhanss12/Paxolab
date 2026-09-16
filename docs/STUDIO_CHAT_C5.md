# C5 — Yapı zekâsı

**Tarih:** 16 Eyl 2026  
**Durum:** Kapandı  
**Önceki:** C4 `docs/STUDIO_CHAT_C4.md`  
**Sonraki:** C6 stüdyo konuşması (bu fazda yok)

Kilitler durdu: LLM SVG yok, `pickTemplate` imzası / kit yolu değişmedi, 29 fingerprint, 18 stüdyo hash, painter yok.

---

## 1. Before

C1 sohbeti yapıyı **adlandırıyordu**, fizikle **sıralamıyordu**.

| Bağlantı | Durum | Kanıt |
|---|---|---|
| USER → BRIEF | REAL | `extractFields` L×W×H, `packagingMode`, `subProduct` |
| BRIEF → PHYSICS | PARTIAL | `dimensionsMm` + `volume` var; çap / şişe / tüp alanı yok |
| PHYSICS → CANDIDATES | DEAD | `pickTemplate` / `filterTemplates` ölçü okumaz |
| SCORING | UNUSED | `describeStructureOffer` sabit `tuck, mailer, sleeve` |
| TOP 3 | DECORATIVE | Alternatif metin, ranking yok |
| USER CARDS | PARTIAL | `TemplatePicker` + `pickerTemplates` — sektör sırası, gerekçe yok |
| SELECTION → GENERATE | REAL (isim) / DEAD (sıra) | `"mailer"` → `templateId`; `"2. yapı"` yok |
| STRUCTURE → PAINTER | REAL | `FormaLocalEngine` → `buildDieline(template.structureId)` → studio/kit |

`pickTemplate`: `templateId` varsa o; yoksa `filterTemplates[0]` (sektör/ürün). Ölçü yok.

---

## 2. Katalog (kod, doküman değil)

`STRUCTURE_IDS` (`src/types.ts`) = `formaTemplateCatalog.json` `structureId` kümesi. 15 aile.

| Family | Source template (ör.) | `structureId` | Dims | Generate | Chat parse | Painter |
|---|---|---|---|---|---|---|
| tuck | `fm-cos-tuck-perfume` | `tuck-end-box` | `defaultsMm` | `buildDieline` | `tuck` | dieline → compose |
| reverse tuck | `fm-box-reverse-tuck` | `reverse-tuck-end-box` | evet | evet | `ters tuck` | evet |
| A60 | `fm-box-ecma-a60` | `tuck-top-auto-bottom` | evet | evet | `A60` | evet |
| mailer | `fm-box-mailer-ship` | `mailer-box` | evet | evet | `mailer` | evet |
| sleeve | `fm-box-sleeve` | `sleeve` | evet | evet | `sleeve` | evet |
| snap-lock | `fm-box-snap-lock` | `snap-lock-box` | evet | evet | `snap-lock` | evet |
| pillow | `fm-box-pillow` | `pillow-box` | evet | evet | `pillow` | evet |
| rigid gift | `fm-box-rigid-gift` | `rigid-gift-box` | evet | evet | `sert hediye` | evet |
| tray | `fm-food-tray-snack` | `simple-tray` | evet | evet | `tepsi` | evet |
| glued tray | `fm-box-tray-glued` | `tray-box` | evet | evet | `yapıştırmalı tepsi` | evet |
| polygon | `fm-gift-hex-box` | `polygon-box` | evet | evet | `poligon` | evet |
| carrier | `fm-bev-carrier-6` | `product-carrier-tray` | evet | evet | `taşıyıcı` | evet |
| RSC | `fm-box-rsc-ship` | `rsc-carton` | evet | evet | `rsc` / `koli` | evet |
| wrap label | `fm-cos-label-bottle` | `wrap-label` | L×H | evet | `wrap` | label |
| flat label | `fm-label-universal` | `flat-label` | L×H | evet | `düz etiket` | label |

Builder: `src/engine/dieline/structure/solver.ts` `classifyGrammar`. Advanced library picker’da durur (C1).

**Product physics (gerçek brief alanları):** `dimensionsMm.L/W/H`, `volume`, `dimsFromVolume`, `packagingMode`, `sector`, `subProduct`. Çap / şişe / tüp / pouch alanı **yok** — icat edilmedi.

---

## 3. Change

Yeni motor yok. Katalog + sohbet + picker.

| Sembol | Dosya | Ne |
|---|---|---|
| `evaluateStructures` / `recommendStructures` | `structureRecommend.ts` | fizik + aspect + ürün skoru; max 3 farklı aile |
| `parseOfferChoice` | aynı | `2. yapıyı seçiyorum` / `ikinci yapı` |
| `describeStructureOffer` | `structureOffer.ts` | gerekçeli top-N; sabit tuck/mailer/sleeve listesi kalktı |
| `generateResult` | `conversation.ts` | `templateId` boşsa top-1; `structureOffer` döner |
| `TemplatePicker` | `TemplatePicker.tsx` | skora göre sıra + gerekçe |
| `productHits` export | `catalog.ts` | mevcut ürün eşlemesi |

`pickTemplate` **değişmedi** (kit/golden `templateId` yazar).

Ağırlık: `physical 0.55 + aspect 0.30 + product 0.15`. Tie-break: `score desc`, `structureId`, `templateId`. Seed yok.

Hard gate: `packagingMode` uyumsuz → `eligible=false`, `score=-1`. Generic yüksek skor yüzeyi aşamaz.

---

## 4. Runtime Path

```text
USER (ölçü / ürün)
  → brief.dimensionsMm + packagingMode + subProduct
  → recommendStructures
      familyRepresentatives(catalog)
      eligible = same surface
      score = physicalFit(defaultsMm) + aspect(portrait|low) + productHits
      candidates = eligible.slice(0, 3)   // 2 geçerse 2
  → generateResult.templateId = selected || candidates[0]
  → FormaLocalEngine.generate
      pickTemplate(templateId)            // exact
      buildDieline(structureId)
      composeStudioArtwork
  → SVG + preflight
```

`"2. yapıyı seçiyorum"` → `candidates[1].templateId` → aynı generate yolu.

---

## 5. Evidence

| İddia | File | Symbol | Test | Result |
|---|---|---|---|---|
| Fizik ranking’e girer | `structureRecommend.ts` | `physicalFit` / `hasStructurePhysics` | TEST 1 | PASS |
| 70×35×140 ≠ 180×120×60 | `conversation.ts` | `generateResult` | TEST 1 | PASS (tuck vs değil) |
| Distinct families | catalog `STRUCTURE_IDS` | `recommendStructures` | TEST 2 | PASS; etiket = 2 |
| Reason grounded | `groundedReason` | mm + defaults | TEST 3 | PASS |
| Ranking authority | weights A/B | physical vs product | TEST 4 | PASS |
| Surface gate | `eligible` | wrap on box, tuck on label | TEST 5 | PASS |
| User #2 → dieline | `parseOfferChoice` | `spec.dieline.structureId` | TEST 6, 9 | PASS |
| Color decoupling | — | colors/story | TEST 7 | PASS |
| Deterministic | — | offer + SVG hash | TEST 8 | **DETERMINISTIC** |
| Production path | engine + preflight | TEST 9 | PASS |

---

## 6. Proof Results

| Test | Sonuç |
|---|---|
| 1 Physics sensitivity | **PASS** |
| 2 Top 3 real families | **PASS** (etiket: 2, zoraki 3 yok) |
| 3 Reasoning input-grounded | **PASS** |
| 4 Ranking authority | **PASS** (physical → mailer/tray; product → tuck) |
| 5 Invalid structure gate | **PASS** |
| 6 User selection #2 | **PASS** — templateId + dieline değişir |
| 7 Negative control | **PASS** |
| 8 Determinism | **DETERMINISTIC** |
| 9 Production path | **PASS** — BREAK yok |

---

## 7. Regression

C5 öncesi: **10 files / 94 passed**. BASELINE FAILURE yok.

C5 sonrası:

```
npx vitest run src/engine/catalog/structureRecommend.test.ts
  + C0–C4 + freeze pack
→ 13 files, 115 passed
```

| Kilit | BEFORE | AFTER |
|---|---|---|
| 29/29 fingerprints | PASS | PASS |
| 29 kit generate / lockup Y / overlay | PASS | PASS |
| 25/4 kit-grade | PASS | PASS |
| vintage-badge / languageTreatment | PASS | PASS |
| 18/18 studio golden | PASS | PASS (hash güncellenmedi) |
| C0–C4 conversation / copy / direction | PASS | PASS |
| Painter / preflight | PASS | PASS |

Golden otomatik güncellenmedi.

---

## 8. Remaining Gaps

1. Fizik modeli brief’teki L/W/H + yüzey + ürün. Şişe çapı / tüp / pouch yok.
2. `pickTemplate` hâlâ sektör-first — kit job’lar `templateId` ile gelir. Sohbet `generateResult` otorite.
3. Picker hâlâ tüm aileleri gösterir; top-3 gerekçeli, gerisi sessiz (C1 gizleme yasağı).
4. Aspect sınıfları katalog ailelerine sabit (portrait vs low). Yeni aile eklenirse kümeyi güncelle.
5. C6 veto/vary konuşması yok.

---

## 9. Exit Status

```text
C5 CLOSED
```

Fizik öneriye giriyor; adaylar gerçek katalog aileleri; ranking/gate/seçim generate + dieline + SVG + preflight’ı değiştiriyor; C0–C4 ve freeze yeşil.
