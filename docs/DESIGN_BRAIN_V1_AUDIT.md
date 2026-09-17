# DESIGN BRAIN V1 AUDIT

> **POST-IMPLEMENTATION NOTU (2026-09-17).** "MINIMUM CHANGE PLAN"ın 1. ve 2. adımı uygulandı; doküman güncellenmemişti. Kodda doğrulandı:
> - **Gap 2 kapandı** — `void principlesFor` yok; `createPlan` artık `principles: principlesFor(style, surface)` yazıyor (`DesignDirector.ts:221`), `DesignPlan.principles` alanı mevcut (`DesignPlan.ts:175`)
> - **Gap 3 kapandı** — `DesignIntent = CompositionTargets` alias'ı kaldırıldı; ayrı `DesignIntentBlock` var (`DesignPlan.ts:199`), `buildDesignIntent` üretiyor
> - **Gap 1 kısmen** — dil katmanı artık taşıyıcı üzerinden akıyor (bkz. `VISUAL_LANGUAGE_V1_AUDIT` notu), ancak concept lookup anahtarı hâlâ `sector:sub:style`
>
> **Hâlâ açık:** Gap 4 (kit-grade overlay skip — bilinçli freeze), Gap 5 (`scoreVisualCraft` generate'de yok), `advisePlan` no-op. Güncel plan: `docs/PAXOLAB_MASTER_ROADMAP.md` → R2, R3, R6.

Ürün: Grapxor. Kök: `Desktop/Paxolab`. Tarih: 15 Eyl 2026.  
Kapsam: `src/engine` design / compose / brain / critic / knowledge / catalog + salt-okunur testler.  
Yok sayıldı: `node_modules`, `site/`, `docs/instagram`, GraphicLibrary merge adayları.  
Kod değişikliği yok. Faz 2 freeze (29/29 exportOK, overlay/kit-grade, budget / opticalY / brandY, Family −1000, region REJECT, CUT·CREASE·GLUE) dokunulmaz.

---

## CURRENT ARCHITECTURE

Gerçek generate zinciri `FormaLocalEngine.generate` içindedir. İsim sırası hedefteki “intent → principles → language → concept” değildir. Çalışan sıra:

`Brief → Template/Dieline → StyleRule + Cue → CompositionGrammar zones → ArtDirection picks + VisualConcept lookup → applyPlanToSystem (kit remap) → composeArtwork / kit painter (± motif candidates) → scoreDesign → critiquePlan → optional repairPlan → re-paint → preflight`

Kanıt — orkestrasyon:

```109:162:src/engine/FormaLocalEngine.ts
    const designPlan = createPlan({
      brief, template, style, prev: styleChanged ? undefined : input.prev?.designPlan,
      cue: overrides.directorCue, variationIndex, forceHero: ..., blankCanvas, backgroundTreatment: ...,
    })
    const paint = (plan: typeof designPlan) => {
      const system = applyPlanToSystem(resolveDesignSystem(...), plan)
      const artwork = composeArtwork(..., system, plan)
      const critique = critiquePlan(plan, scoreDesign({ artwork, preflight, copy, kind }, plan), faceLayer?.markup)
```

| Aşama (hedef isim) | Var mı? | Dosya / fonksiyon | Input | Output | Sonraki aşama kullanıyor mu? | Tür |
|---|---|---|---|---|---|---|
| Brief | Evet | `FormaLocalEngine.generate` | `GenerateInput.brief` | normalize edilmiş `DesignBrief` | Evet — `createPlan`, `resolveDesignSystem`, painter | Gerçek giriş |
| Design Intent | İsim var, karar yok | `compositionStrategy.ts` `export type DesignIntent = CompositionTargets` | — | type alias | Hayır — ayrı üretilmez | Type/interface |
| Visual Concept | Evet, lookup | `VisualConcept.visualConceptFor` | `style + sector + subProduct + hero` | `VisualConceptBlock` (id, family, budget, languages, avoid, lexicon, strategyBias) | Evet — lockup remap, overlay match, composition targets | Lookup/recipe |
| Visual Language | Evet, türev | `visualLanguage.languagesOfConcept` / `visualLanguageOfConcept` | concept `languages[]` veya family/id regex | `VisualLanguage` | Overlay açıksa evet (fidelity, role bias). Kit-grade skip’te motif yolu kapalı | Lookup + skor ekseni |
| Art Direction | Evet, picker | `ArtDirection.attachArtDirection` + `artDirectionPickers.pickHero/pickPattern/pickPrimitives` | style, sector, cue, vocab, variationIndex | hero/pattern/prims, chrome, crop, `visualConcept` | Evet — plan alanları painter’a gider | Allowed-list + recipe pick |
| Composition Strategy | İki katman | (A) `CompositionGrammar.composeGrammar` zone/intent; (B) `compositionStrategy.allowedStrategies` motif layout | style, air, variation; plan.concept.strategyBias | `composition.intent` + 3–5 motif strategy | (A) kit hero X/Y ve targets. (B) yalnız overlay açıkken | (A) gerçek zone kararı (B) motif layout recipe |
| Asset Language / Relationships | Evet, overlay | `artMotifFamily.atomFitsConceptFamily`, `visualLanguage.atomAvoided` / lexicon, `familyMatrix` | atom + concept family | EXACT/COMPATIBLE/NONE, avoid hit | Overlay açıksa hard constraint. Kit-grade’de `clearCompositionSearch()` | Constraint (playful) |
| Candidate Generation | Evet, dar | `compositionCandidates.generateCompositionCandidates` / `selectMotifComposition` | atoms, plan, panel | 3–5 aday | `kitGradeSkipsOverlay` true ise **çağrılmaz** | Gerçek (playful / opt-in compose) |
| Visual Evaluation | İki skor, biri generate’de | (1) `scoreDesign` + `critiquePlan`; (2) `scoreCompositionSlots` + `critiqueCandidate`; (3) `scoreVisualCraft` | markup + plan | KEEP/MODIFY / winner | (1) generate repair. (2) overlay winner. (3) **yalnız test/script** | (1)(2) gerçek (3) dekoratif generate yolunda |
| Render | Evet | `composeArtwork` → `renderFrontPanel` → `frontDecor` + lockup chrome | system + plan | SVG markup | Preflight | Deterministic painter |

`createPlan` imza kanıtı (`DesignDirector.createPlan`): style rule + cue ile density/air/intent; `composeGrammar`; `attachArtDirection`; `void principlesFor`.

```44:51:src/engine/brain/DesignDirector.ts
export function createPlan(input: DirectorInput): DesignPlan {
  const style = input.style || (input.brief.styleType as StyleType) || 'luxury'
  const cue = asCue(input.cue)
  const sector = resolveSector(input.brief)
  const rule = styleRule(style)
```

```189:192:src/engine/brain/DesignDirector.ts
  plan.summaryTr = planSummaryTr(plan)
  rememberArt(style, { hero: plan.heroGraphic.family, pattern: plan.patternSystem.family })
  void principlesFor(style, surface)
  return plan
```

---

## DESIGN BRAIN GAP

Öncelik sırası (en fazla 5):

1. **Karar sırası ters.** Hedef `brief → intent → principles → language → art direction → strategy → concept → candidates`. Mevcut: `styleType + sector → styleRule + CONCEPTS lookup → picker → kit paint`. `visualConceptFor` anahtarı `${sector}:${sub}:${style}` / `${sector}:${style}` / `${style}:any` (`VisualConcept.ts` 255–259).
2. **`principlesFor` üretilip discard.** `createPlan` `void principlesFor(style, surface)` (`DesignDirector.ts` 191). `DESIGN_PRINCIPLES` yalnızca `brain/index.ts` re-export. Generate / critic / scorer import etmiyor.
3. **`DesignIntent` CompositionTargets alias.** `export type DesignIntent = CompositionTargets` (`compositionStrategy.ts` 52–53). Brand character, tension, material, motif–type ilişkisi yok. Ayrı bir intent nesnesi üretilmez.
4. **Aday motoru katalog kit-grade’de kapalı.** `kitGradeSkipsOverlay` luxury/modern/minimal/classic/eco (`conceptKitAlignment.ts` 151–152). `renderFrontPanel` skip’te `clearCompositionSearch()` (frontPanel.ts 162–163). 25/29 yüzde composition scoring boyamaz.
5. **İki değerlendirme, generate yalnızca birini kullanır.** `FormaLocalEngine` `scoreDesign` + `critiquePlan` çağırır (`FormaLocalEngine.ts` 161). `scoreVisualCraft` generate’de yok; çağrı yerleri `phase7/8/9/10/10b/12/56.test.ts` ve script’ler.

---

## DESIGN INTENT

`DesignIntent` **yalnızca type alias**’tır. Runtime değer `compositionTargets(plan)` çıktısıdır: `densityTarget`, `whitespaceTarget`, `symmetryTarget`, `decorationLevel` (budget), `focalStrength`, `balanceTarget`, `compositionBias`, `framePreference`, `ornamentPreference`, plus concept’ten kopyalanan `visualLanguage` / `avoid` / `lexicon`.

```125:178:src/engine/artwork/compositionStrategy.ts
export function compositionTargets(plan: DesignPlan, style?: StyleType | string): CompositionTargets {
  const prior = moodPrior(mood)
  const whitespaceTarget = plan.composition.negativeSpace === 'high' ? 0.74 : ...
  const densityTarget = plan.decor.density === 'sparse' || prior.density === 'sparse' || plan.decor.restrainExtras ? 0.22 : ...
```

| İstenen değişken | Durum | Kanıt |
|---|---|---|
| Density / whitespace / symmetry targets | Gerçek (overlay skor) | `compositionTargets` + `scoreCompositionSlots` |
| Hierarchy | Plan’da sabit metadata | `hierarchy.primary: 'brand'` type literal (`DesignPlan.ts` 118–122); `createPlan` her zaman `primary: 'brand'` (106–110) |
| Hero / typography / whitespace strategy | Kısmen gerçek, style+cue | `styleRule` + `composeGrammar` + `studioRecipe` variation |
| Brand character | Yok | Brief’ten character alanı okunmaz |
| Visual tension | Yok (engine) | `src/engine` içinde skor/alan yok. (GraphicLibrary comment’leri kapsam dışı.) |
| Composition personality | Metadata | `visualIntent: VisualIntent` enum `styleRule`’dan (`DesignRules.ts` 21–22 luxury → `elegant`) |
| Material cues | Zayıf metadata | `color.metallic` style/cue; `CraftPlan.ink` style switch (`craft.ts` 33–39) — DesignPlan intent değil |
| Sector appropriateness | Gerçek, post-hoc | `scoreDesign.sectorBlind` regex (`scoreDesignCard.ts` 77–94); `detectCrossSectorBleed` |
| Motif relationship | Overlay’de gerçek | `conceptFidelityOf`, lexicon, companion used-tokens |
| Restraint | Cue/flag | `decor.restrainExtras`; luxury-tighten cue (`DesignDirector.ts` 60–65) |

`visualIntent` `critiqueCandidate` imzasında `Pick<DesignPlan, 'visualConcept' | 'visualIntent'>` (`compositionCritic.ts` 47) — fonksiyon gövdesinde `visualIntent` **okunmaz**. Type süs.

---

## DESIGN PRINCIPLES

`DesignKnowledge.ts`: 8 ilke, `principlesFor(style, surface)` style/surface’e göre id listesi döner.

```61:67:src/engine/brain/DesignKnowledge.ts
export function principlesFor(style: string, surface: string): PrincipleId[] {
  const base: PrincipleId[] = ['hierarchy-brand-first', 'lockup-is-sacred', 'sector-blind-front', 'marks-not-on-hero']
  if (style === 'luxury') base.push('negative-space-is-luxury', 'metallic-restraint')
  if (surface === 'label') base.push('legal-belongs-back')
  else base.push('legal-belongs-back', 'one-motif-family')
  return base
}
```

Bağlanması gereken tek nokta: `createPlan` dönüşünden önce `void` kaldırılıp listenin `DesignPlan` + `critiquePlan` / kit constraint’e yazılması. Bugün:

- Call-site: yalnızca `DesignDirector.createPlan` satır 191 `void principlesFor(...)`.
- `DESIGN_PRINCIPLES` import eden generate/critic/scorer **yok** (repo `*.ts` taraması: `DesignKnowledge.ts` tanım + `brain/index.ts` export).
- İlkelerin *ruhu* başka yerde kopya kural olarak durur (`hierarchy` brand-first, `lockupClearance: true`, `scoreDesign` sectorBlind, marks back) — KB bunları **üretmez**, paralel metindir.

LUXURY/MINIMAL/ECO/PLAYFUL ilkeleri ayrı tabloda yok; style `styleRule` + `CONCEPTS` satırıdır.

---

## VISUAL LANGUAGE

`artwork/visualLanguage.ts`: `VisualLanguage` union concept `languages[]` ile aynı token’lar. `languagesOfConcept` declared array’i kullanır; boşsa `inferLanguage` (id/family regex).

Kullanım (overlay açıkken):

- `compositionTargets` → `visualLanguage`, `preferredMotifRoles`
- `conceptFidelityOf` atom dili vs wanted
- `atomAvoided` concept.avoid
- `critiqueCandidate` CONCEPT_MISMATCH / VISUAL_LANGUAGE_MISMATCH (fidelity eşikleri 42 / 58)

Kit-grade yüzde `selectMotifComposition` çalışmaz; language motif yerleştirmez. Kit yüzünde dil, `lockupForConcept` + native hero ile **dolaylı** taşınır.

`ArtDirectionBlock.vocabulary` alanı `visualConcept.id` atanır (`ArtDirection.ts` 80: `vocabulary: visualConcept.id`). `SectorVisualVocabulary.lookupVocabulary` ayrı tablo (`vocabularyId` plan’da). İki “vocabulary” aynı şey değil.

---

## ART DIRECTION

`attachArtDirection` (`ArtDirection.ts` 58–114) gerçek picker’dır: `pickHero`, `pickPattern`, `pickPrimitives`, chrome (`chromeForConcept`), crop, density map, background.

`pickHero` set 0: önce `visualConceptFor(style, sector, 'none', subProduct)` → `preferHeroForConcept` → yoksa `requiredHero` (vocab + sector) → `allowed[0]` (`artDirectionPickers.ts` 76–81). Sonra `attachArtDirection` concept’i **hero ile tekrar** lookup eder (`ArtDirection.ts` 76).

Bu, creative art direction değil: **allowed-list + concept-id recipe + variation table** (`VariationRecipes.studioRecipe`). Cue’lar density/air/hero’yu kaydırır (`DesignDirector.ts` 60–86).

`advisePlan` identity:

```199:201:src/engine/brain/DesignDirector.ts
export function advisePlan(plan: DesignPlan): DesignPlan {
  return plan
}
```

`src/` içinde `advisePlan` / `planGraph` call-site yok (yalnız tanım + `brain/index.ts` export).

---

## COMPOSITION STRATEGY

İki ayrı “strategy”:

**A — Zone grammar (her yüz).** `composeGrammar` style×variation → `intent` (`symmetric|grid|offset|asymmetric|diagonal|editorial|floating|full-bleed`) ve `heroZone` x/y, `opticalCenter` (`CompositionGrammar.ts` 15–84). `applyPlanToSystem` opticalCenter’ı şartlı yazar (`applyPlan.ts` 37–40). Freeze: lockup **tip matematiği** `layoutFrontLockup`; director opticalCenter override’ı mevcut kilit.

**B — Motif layout (overlay).** `allowedStrategies` concept `strategyBias` + style + avoid (`compositionStrategy.ts` 195–256). `generateCompositionCandidates` her strategy için slot üretir (`compositionCandidates.ts` 828–855). `void input.palette` (821) — palette aday geometrisine girmez.

Katalog kit-grade’de B çalışmaz. Yüz kimliği A + kit chrome + native hero’dur.

---

## CANDIDATE GENERATION

Giriş: `renderFrontPanel` `!skipOverlay && designPlan?.visualConcept.family` → `matchMotifs` → `selectMotifComposition` (`frontPanel.ts` 140–161).

`selectMotifComposition`: `compositionTargets` → `generateCompositionCandidates` → pre-score → `critiqueCandidate` → top 3 paint → post-score → `chooseCompositionWinner` (`compositionCandidates.ts` 966–1021).

Üretilen skorlar (`CompositionScore`, `COMPOSITION_SCORE_WEIGHTS`): hierarchy (deco weight vs lockup), balance, whitespace, styleConsistency, familyConsistency, decorationDensity, assetCompatibility, conceptFidelity, alignment, rhythm, collisionSafety, productionSafety.

Eksik (alan/skor yok): brandability, visual tension, motif/typography relationship (ayrı eksen), sector appropriateness (aday skorunda yok; post-render `scoreDesign.sectorBlind`).

Family −1000 / region REJECT `critiqueCandidate` içinde (`compositionCritic.ts` 54–64, 68–73). Freeze ile uyumlu.

---

## VISUAL EVALUATION

**Generate (tüm yüzler):** `scoreDesign` (`scoreDesignCard.ts` 33) — markup regex + plan flag: hierarchy (marka/ürün metin), densityFront (hero/prim count vs `densityCap`), lockupClearance (`lockout-`), honesty (barkod ön yüz), sectorBlind, repetitionPenalty (`forbidLastFamilies`), sideIntentionality. `critiquePlan` eşik altını MODIFY + `needsRepair` (`CritiqueEngine.ts` 64–111). `repairPlan` plan sayılarını değiştirir, SVG’yi değil; `paint` ikinci kez çağrılır.

**Generate’de yok:** `scoreVisualCraft` (hero/composition/typography/sectorFit/originality weighted). Test tabanı; repair’e bağlı değil.

**Overlay:** `scoreCompositionSlots` + `critiqueCandidate`. Kit-grade skip’te `lastCompositionSearch()` temizlenir.

**CraftPlan** (`craft.ts` `buildCraftPlan`): `composeArtwork` marks/legal için kullanır. `stages` listesi metadata. VisualConcept okumaz. `_copy` unused.

---

## DEAD / DECORATIVE ARCHITECTURE

| Sembol | Kanıt | Etki |
|---|---|---|
| `principlesFor` | `void principlesFor(style, surface)` `DesignDirector.ts:191` | Composition kararı yok |
| `DESIGN_PRINCIPLES` | yalnız `brain/index.ts` export | Generate kullanmaz |
| `advisePlan` | `return plan` `DesignDirector.ts:199–201`; call-site yok | No-op |
| `planGraph` / `buildDesignGraph` | “Metadata only” comment `DesignGraph.ts:14–15`; generate çağırmaz | UI/debug graph |
| `DesignIntent` | `= CompositionTargets` `compositionStrategy.ts:53` | Ayrı katman yok |
| `critiqueCandidate` `visualIntent` | Pick’te var, gövde okumaz | Type süs |
| `scoreVisualCraft` | generate import etmez; `FormaLocalEngine.ts:2` yalnız `scoreDesign` | Test/benchmark |
| `generateCompositionCandidates` `palette` | `void input.palette` satır 821 | Discard |

Yaşayan ama lookup olan: `VisualConcept.CONCEPTS`, `styleRule`, `STYLE_HEROES`, `studioRecipe`, `VOCAB`.

---

## ROOT CAUSES

1. Brain, style kostümü + sector tablosunu “concept” diye adlandırıyor; brief’ten intent çıkarmıyor.
2. Principles bir KB olarak yazılmış, director `void` ile atıyor; kurallar painter/scorer’a kopya gömülü.
3. `DesignIntent` namı occupancy target’larına verilmiş; character/tension yok.
4. Motif candidate engine Faz 2 kalite için kapatıldı (kit-grade); katalog yüzü kit painter.
5. ArtDirection, concept lookup’ın hem tüketicisi hem üreticisi (hero `none` ile lookup → pick → tekrar lookup).
6. Post-render craft skoru generate repair’ine bağlı değil; critic plan-flag + regex.
7. `hierarchy` / `positioning` type-literal / style kopyası; brief brand character yok.
8. İki vocabulary (`artDirection.vocabulary` = concept id vs `vocabularyId` = sector row) isim çakışması.
9. `CraftPlan` ve `DesignPlan` paralel; compose ikisini de taşır, tek karar grafı değil.
10. Variation ≥ 2 intent’leri style rotasyonu (`CompositionGrammar.ts` 36–41), brief gerekçesi yok.

---

## DESIGN BRAIN V1 TARGET ARCHITECTURE

Hedef sıra (yeni asset/template yok):

`Brief (brand, product, sector, surface, constraints) → DesignIntent (character, restraint, hierarchy, tension, material, sector fit) → Principles (executable checks, not void) → Visual Language (token set) → Art Direction (allowed picks inside language) → Composition Strategy (zone +, overlay varsa layout) → Concept (intent+sector seçimi; tablo satırı gerekçe) → Candidates (yalnız overlay-izinli stiller) → Evaluation (aynı intent eksenleri) → existing painter`

Faz 2 freeze: kit-grade overlay skip, playful vintage-badge, budget tavanı, opticalY/brandY, Family −1000, region REJECT, retired ID’ler, ATOMS-READY karantina, 2.19 kapalı, LLM/Faz 3 yok.

Set-0 katalog kimliği korunur: aynı `visualConcept.id` / lockup / hero family üretimi, yeni “neden” alanı yanında.

---

## MINIMUM CHANGE PLAN

1. **`principlesFor` discard’ını kaldır.** `DesignPlan`’e `principles: PrincipleId[]` yaz. `critiquePlan` / `scoreDesign` mevcut eşikleri bu id’lerle etiketle. Painter, budget, Y, overlay politikası değişmez.
2. **`DesignIntent`’i `CompositionTargets` alias’ından ayır.** Brief+style+sector’dan ayrı struct üret (`restraint`, `hierarchyPolicy`, `sectorFit`, `air`, `chrome`). `compositionTargets` bunu okusun; set-0 numeric target’lar bugünkü formülle birebir kalsın.
3. **`visualConceptFor` imzasını intent tüketecek hale getir, CONCEPTS satırlarını set-0’da koru.** Lookup anahtarı geçici olarak bugünkü `sector:style` kalsın; intent yalnız tie-break / açıklama. 29 fixture id değişmez.

---

## REGRESSION RISKS

- `applyPlanToSystem` opticalCenter / lockup remap → brandY/opticalY freeze.
- `visualConceptFor` id değişirse 29 katalog chrome/hero kayar (phase28–32 lockup id).
- Overlay skip veya retired ID gevşerse clip-art geri gelir (2.16/2.17/2.18 onayı).
- `decorationBudget` / `compositionTargets.densityTarget` değişirse playful KEEP/MODIFY kayar.
- Family −1000 / region REJECT eşiği.
- `scoreVisualCraft`’ı generate repair’e bağlamak `needsRepair` oranını değiştirir (29 exportOK riski).
- `composeGrammar` variation intent’leri set ≥ 2 yüzleri kaydırır; set 0’a sızmamalı.

---

## FILE-BY-FILE IMPLEMENTATION PLAN

Gap 1–3 odaklı, en fazla 5 dosya. Yeni concept/asset yok.

### 1. `src/engine/brain/DesignDirector.ts`

- **Neden:** Tek `void principlesFor`; plan’ın doğduğu yer.
- **Mevcut:** styleRule + cue + composeGrammar + attachArtDirection; principles discard.
- **Yeni:** `plan.principles = principlesFor(...)`; isteğe bağlı `plan.designIntent = buildDesignIntent(...)` (adım 2 tipi). `createPlan` hero/lockup/budget çıktısı set-0’da aynı.
- **Kapsam:** director only. Painter import etmez.
- **Risk:** Düşük eğer picker sırası değişmezse.

### 2. `src/engine/brain/DesignPlan.ts`

- **Neden:** Intent/principles için taşıyıcı yok; hierarchy type-literal.
- **Mevcut:** `visualIntent` enum, `hierarchy.primary: 'brand'`.
- **Yeni:** `principles: PrincipleId[]`; ayrı `DesignIntentBlock` (character/restraint/air/sectorFit). `VisualConceptBlock` şeması freeze.
- **Kapsam:** type + `createPlan` fill. CONCEPTS satırı yok.
- **Risk:** Fixture snapshot’ları extra field; id/hero aynı kalmalı.

### 3. `src/engine/brain/DesignKnowledge.ts`

- **Neden:** İlkeler metin; bağlama noktası burası.
- **Mevcut:** `DESIGN_PRINCIPLES` + `principlesFor` liste.
- **Yeni:** id → zaten var olan check’e map (`lockup-is-sacred` → lockupClearance score). Yeni ilke yok. LUXURY air = mevcut `negative-space-is-luxury` id’sinin `scoreDesign` notuna bağlanması.
- **Kapsam:** critic/score etiket. SVG yok.
- **Risk:** Not string’leri; `needsRepair` eşikleri değişmemeli.

### 4. `src/engine/artwork/compositionStrategy.ts`

- **Neden:** `DesignIntent = CompositionTargets` sahte katman.
- **Mevcut:** occupancy/symmetry/budget targets.
- **Yeni:** alias’ı kaldır veya `CompositionTargets` adında bırak; Intent `DesignPlan`’de yaşasın. `compositionTargets` set-0 sayıları aynı formül.
- **Kapsam:** type + targets okuma. Strategy listesi freeze.
- **Risk:** Overlay skor drift (playful). Numeric golden’ları koru.

### 5. `src/engine/brain/VisualConcept.ts`

- **Neden:** Hedef inversion’ın tek lookup’ı; şimdi style+sector recipe.
- **Mevcut:** `CONCEPTS[...]` + `withHero`.
- **Yeni:** `visualConceptFor` opsiyonel `intent` arg; set-0’da yok say (aynı keyed row). İleride intent→key, satır içeriği aynı.
- **Kapsam:** fonksiyon imzası. Yeni concept satırı yok.
- **Risk:** Yüksek eğer key değişirse — bu yüzden adım 3’te key freeze zorunlu.

`FormaLocalEngine.ts` ve `frontPanel.ts` bu V1 diliminde **değişmez** (overlay skip / generate repair yolu freeze).

---

## DO NOT TOUCH

- Faz 2 freeze: budget tavanı, `layoutFrontLockup` opticalY/brandY, Family −1000, region REJECT, CUT/CREASE/GLUE.
- `kitGradeSkipsOverlay` / `kitGradeOmitsCrestGlyph`; 2.19 açılmaz.
- Retired overlay/hero ID’ler; flacon/oval medallion.
- ATOMS-READY, GraphicLibrary merge, LLM planner (`src/engine/llm` kapsam dışı bırakıldı), Faz 3.
- 29 katalog JOBS fixture beklentileri (`phase28–32` lockup/chrome/hero).
- Yeni template, motif grammar, overlay atom, concept satırı.
- `scoreVisualCraft` → generate `needsRepair` (bu dilimde).

---

## FINAL RECOMMENDATION

**Şimdi `createPlan` içinde `principlesFor` discard’ını kesip `DesignIntent`’i `CompositionTargets` alias’ından ayırarak plan’a yaz; concept lookup ve kit painter çıktısını set-0’da birebir bırak.**

---

## SON SORU

Paxolab **iyi kurallı, deterministic bir composition / kit-paint engine**. Henüz brief’ten gerekçe üreten bir **design decision engine değil**; named katmanlar (VisualConcept, ArtDirection, DesignKnowledge, DesignIntent) var ama sıra `style+sector → recipe` ve principles `void`.

Kanıt:

- Karar sırası `createPlan` → `styleRule` + `visualConceptFor(style, sector, …)` (`DesignDirector.ts` 50, `ArtDirection.ts` 76, `VisualConcept.ts` 255–259).
- Principles discard: `void principlesFor(style, surface)` (`DesignDirector.ts` 191).
- Katalog yüzünde aday motor kapalı: `kitGradeSkipsOverlay` + `clearCompositionSearch()` (`conceptKitAlignment.ts` 151–152, `frontPanel.ts` 162–163).
- Generate değerlendirmesi `scoreDesign` regex/flag; `scoreVisualCraft` generate’de yok (`FormaLocalEngine.ts` 2 ve 161).

Hazırlık: slot isimleri ve overlay constraint’leri (family, language, budget, lockup overlap) duruyor. Decision engine’e geçiş, yeni asset değil; **intent’in lookup’tan önce var olması ve principles’in void olmaması**.
