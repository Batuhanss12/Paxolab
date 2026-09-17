# VISUAL LANGUAGE V1 AUDIT

> **POST-IMPLEMENTATION NOTU (2026-09-17).** Bu audit "VL-1 onay bekliyor" diyerek kapanmıştı; **VL-1 ve VL-2 o tarihten sonra uygulandı**, doküman güncellenmemişti. Kodda doğrulandı:
> - `DesignPlan.visualLanguage: ConceptLanguageId[]` taşıyıcı alan mevcut (`brain/DesignPlan.ts:178`)
> - `languagesOfConcept` önce **plan taşıyıcısını** okur, concept satırı fallback'e düştü (`artwork/visualLanguage.ts`) → §2.A'daki "ikinci kapı" kapandı
> - `visualLanguageFor(intent, sector, subProduct)` mevcut ve `ArtDirection` / `VisualConcept` tarafından çağrılıyor
> - `allowedHeroes` / `allowedPatterns` artık dil parametresi alıyor (`artDirectionPickers.ts`)
>
> **VL-4 de uygulandı** — `visualConceptFor` intent alıp `conceptInLanguage` ile concept'i dil allow-list'i içinde yeniden seçiyor (`VisualConcept.ts:318`).
>
> **VL-3 tam invert: 2026-09-17'de kararla reddedildi.** V5 audit §4'ün çarpışma analizi (tek character → üç dil ailesi) ve `designBrainV1.test.ts` `stayHeraldic` sözleşmesi, sector'ün dil anahtarı olarak kalması gerektiğini gösteriyor. Gerekçe ve kilitleyen testler: `docs/PAXOLAB_MASTER_ROADMAP.md` → R6, `src/engine/artwork/visualLanguageAuthority.test.ts`.

Ürün: Grapxor. Kök: `Desktop/Paxolab`. Tarih: 15 Eyl 2026.  
Kapsam: `visualLanguage.ts`, `VisualConcept.ts`, `ArtDirection` / pickers / allowed, `VOCAB`, `STYLE_HEROES`, `conceptKitAlignment`, overlay call-site’ları.  
Kod değişikliği yok. Concept tie-break yok. Faz 2 freeze dokunulmaz.

Soru: **Visual Language hangi veriden türetiliyor, nerede karar veriyor, nerede yalnızca metadata, gerçek Art Direction kararlarını hangi katman veriyor?**

---

## KARAR

Intent’i `visualConceptFor` tie-break’e bağlamak **şimdi yapılmaz**.

Zincir:

`Intent → farklı concept → farklı hero / language / chrome / lockup → farklı tasarım`

Bu, Phase 2 freeze’in ilk gerçek delinmesi olur. `void intent` (`VisualConcept.ts` 255) bilinçli durur.

Sıra:

1. Intent taşıyıcı (yapıldı)
2. Principles taşıyıcı (yapıldı)
3. Concept intent interface, ignored (yapıldı)
4. **Bu audit**
5. Visual Language implementation (identity → sonra invert)
6. Ancak ondan sonra Concept tie-break — language allow-list ile kapılı

---

## CEVAP (tek paragraf)

Visual Language **DesignIntent’ten türetilmez**. Kaynak `CONCEPTS` satırındaki `languages[]`’dir (`VisualConcept.ts`); boşsa `inferLanguage` concept `id` / `family` / `tags` regex’idir (`visualLanguage.ts` 37–60). `plan.visualIntent` ve `DesignIntentBlock` bu fonksiyona girmez. Dil, katalog kit-yüzünde (`kitGradeSkipsOverlay` 25/29) overlay skor motoru olarak **çalışmaz**; orada gerçek Art Direction `STYLE_HEROES` + `VOCAB` + **concept.id** tablolarıdır. Dilin kit-yüzünde okunduğu yer `visualLanguage.ts` değil: `concept.languages` ham okunur (`chromeForConcept`, `shouldPaintSectorFrame`, `shouldPaintModernGrid`). Overlay yolunda (playful 4/29) `languagesOfConcept` atom skor, strategy block, craft-fill ve retry pool’u kararlar.

---

## CURRENT VS TARGET

### Bugün (ters)

```
Brief
  → StyleRule + Cue          density / air / character
  → VOCAB                    sector palettes / heroes / forbidden
  → DesignIntent             taşıyıcı; concept lookup kullanmaz
  → pickHero                 STYLE_HEROES ∩ VOCAB, sonra preferHeroForConcept(concept.id)
  → visualConceptFor         CONCEPTS[sector:sub:style] — intent void
  → languages[]              concept satırından damgalı
  → visualLanguage.ts        overlay dialect
  → Art Direction chrome     concept.id + avoid + languages[] ham
  → Kit painter              lockup chrome + native hero
```

### Hedef (henüz kod yok)

```
Brief
  → Design Intent
  → Design Principles
  → Visual Language          intent + sector + surface
  → Visual Concept           language allow-list içinde seçim
  → Art Direction
  → Composition Strategy
  → Asset Relationships
  → Candidates
  → Evaluation
  → Existing Painter
```

Concept, dilin kaynağı olmamalı. Concept, intent + sector bağlamında seçilmiş görsel konsept olmalı. Language, concept satırının kopyası değil; concept, language’ın seçilmiş örneği.

---

## 1. VISUAL LANGUAGE HANGİ VERİDEN TÜRETİLİYOR?

### 1.1 Tek kaynak: concept satırı

```53:64:src/engine/artwork/visualLanguage.ts
export function languagesOfConcept(plan: ConceptPlan): VisualLanguage[] {
  const declared = (plan.visualConcept.languages ?? []).filter(...)
  if (declared.length) return declared
  const fallback = inferLanguage(plan)
  return fallback ? [fallback] : []
}
export function visualLanguageOfConcept(plan: ConceptPlan): VisualLanguage | undefined {
  return languagesOfConcept(plan)[0]
}
```

Katalog `CONCEPTS` satırlarının hepsinde `languages` dolu. Set-0 yolda `inferLanguage` **ölü kod**: declared her zaman kazanır.

`inferLanguage` (37–50) yalnızca `visualConcept.id` / `tags` / `family` okur. `ConceptPlan.visualIntent` tipte var (satır 34), **hiç okunmaz**. `DesignIntentBlock` parametre değil.

Sekiz token (iki kopya union):

| Token | `ConceptLanguageId` | `VisualLanguage` |
|---|---|---|
| oval / organic / geometric / linear / botanical / heraldic / art-deco / quiet-line | `DesignPlan.ts` 56 | `visualLanguage.ts` 13 |

Aynı 8 string, iki dosyada. Üçüncü “language”: `paletteTable.LanguageId` (`perfume-luxury` …) — **renk paleti**, Visual Language değil (`artwork/languages.ts` facade).

### 1.2 CONCEPTS damgası (style × sector, intent yok)

```248:262:src/engine/brain/VisualConcept.ts
export function visualConceptFor(style, sector, hero, subProduct?, intent?) {
  void intent
  const keyed =
    CONCEPTS[`${sector}:${sub}:${style}`] ??
    CONCEPTS[`${sector}:${style}`] ??
    CONCEPTS[`${style}:any`] ??
    CONCEPTS['minimal:any']
  return withHero(keyed, hero)
}
```

Lookup anahtarı `style + sector + subProduct`. Intent, character, density, air yok.

| CONCEPTS key | id | languages[] |
|---|---|---|
| `perfume:luxury` | nocturne-crest | heraldic |
| `perfume:classic` | heraldic-crest | heraldic |
| `perfume:eco` | botanical-night | botanical, quiet-line |
| `cream:luxury` | soft-oval | oval, quiet-line |
| `serum:luxury` | drop-concentrate | quiet-line, oval |
| `food:oil:luxury` | earthen-premium | botanical, organic |
| `food:oil:classic` | grove-press | botanical, organic |
| `food:oil:eco` | grove-kraft | botanical, organic |
| `food:luxury` | harvest-press | botanical, organic |
| `food:eco` | harvest-kraft | botanical, organic |
| `electronics:luxury` | signal-plaque | linear, geometric |
| `electronics:modern` | tech-glyph | linear, geometric |
| `eco:any` | kraft-botanical | botanical, organic |
| `playful:any` | capsule-field | organic, geometric |
| `modern:any` | index-stripe | linear |
| `minimal:any` | air-paper | quiet-line |
| `classic:any` | heraldic-cartouche | heraldic, art-deco |
| `luxury:any` | restrained-foil | geometric, quiet-line |

`family` (MotifFamilyId) dil değildir: `heraldic` / `quiet-line` / `botanical` hem family hem language token’ı — ayrı katman gibi durur, aynı string uzayı.

### 1.3 Girmeyen katmanlar

| Katman | Dil üretir mi? | Kanıt |
|---|---|---|
| `DesignIntentBlock` | Hayır | `buildDesignIntent` (`DesignDirector.ts` 106–126) character/density/air/metallic. Language alanı yok. `visualConceptFor(..., intent)` `void intent`. |
| `VOCAB` / `vocabularyTable` | Hayır | `languages` alanı yok. Palettes, heroes, forbidden, ornamentLevel. |
| `STYLE_HEROES` | Hayır | Hero listeleri (`styleHeroConfig.ts`). |
| `paletteTable.languageId` | Hayır | Sektör palet kimliği. |
| `plan.principles` | Hayır | Critic hint etiketleri. |

`createPlan` sırası (`DesignDirector.ts` 149 → 181 → 221): intent üretilir, `attachArtDirection`’a verilir, concept **yine** style×sector key ile seçilir, `languages[]` concept satırından gelir.

---

## 2. NEREDE KARAR VERİYOR?

İki tüketici. Aynı token, farklı kapı.

### 2.A Kit yüzü — `concept.languages` HAM (visualLanguage.ts bypass)

`kitGradeSkipsOverlay(style)` (`conceptKitAlignment.ts` 151–152): luxury / modern / minimal / classic / eco → overlay kapalı. Katalog 25/29. `frontPanel.ts` 94, 162–163: skip’te `clearCompositionSearch()`.

Bu 25 yüzde `languagesOfConcept` atom seçmez. Ama **ham** `concept.languages` kit chrome’u keser:

```51:59:src/engine/designSystem/conceptKitAlignment.ts
export function chromeForConcept(concept, recipeChrome) {
  const langs = concept.languages ?? []
  if (concept.id === 'air-paper' || avoid.includes('heavy-frame') || langs.includes('quiet-line'))
    return 'quiet'
  return recipeChrome
}
```

```62:88:src/engine/designSystem/conceptKitAlignment.ts
shouldPaintSectorFrame  — quiet-line | linear | air-paper | tech-glyph | signal-plaque → frame yok
shouldPaintModernGrid   — quiet-line | air-paper → grid yok
```

Çağrı: `attachArtDirection` (`ArtDirection.ts` 78–84) concept seçtikten sonra `chromeForConcept`. Freeze’e görünür: quiet vs full chrome, sektör çerçevesi, modern grid.

**Bypass:** `inferLanguage` burada yok. Satırda `languages` boş olsaydı kit chrome fallback regex’i çalışmazdı. Katalogda satırlar dolu olduğu için set-0’da fark yok; mimari olarak dil kararı iki kapıdan geçiyor.

### 2.B Overlay yüzü — `visualLanguage.ts` (playful 4/29)

`frontPanel.ts` 140–150: `matchMotifs({ languages: designPlan.visualConcept.languages, ... })`.

| Site | Satır | Karar |
|---|---|---|
| `compositionTargets` | `compositionStrategy.ts` 151–179 | `visualLanguage` / `languages` kopyala; quiet-line\|oval → whitespace +0.06; `preferredMotifRoles` |
| `allowedStrategies` | 246–252 | `langs.includes('linear')` → `balanced-corners` blok |
| `craftFillFloor` / grow | `compositionCandidates.ts` 209–267 | linear / quiet-line floor; grow-box linear\|soft-oval\|earthen |
| `constrainAtomScale` | 328–331 | linear → scale min 0.7 |
| retry pool | 1025–1027 | `atomMatchesAnyLanguage` |
| debug | 1058–1059 | `lastCompositionSearch.visualLanguage` |
| `artMotifMatch` | 215–223 | +10 language hit; oval vs ticks −6 |
| `conceptFidelityOf` | `visualLanguage.ts` 182–233 | overlay critic skor |
| `compositionCritic` | 116–120 | `targets.visualLanguage` fidelity eşiği |

`compositionTargets` generate kit yolunda **çağrılmaz** (yalnız overlay + test). Kit paint lockup Y / budget bu +0.06’yı okumaz. Freeze testleri `compositionTargets` sayılarını kilitler; o sayılar dil bump’ını içerir.

### 2.C Karar gibi görünen metadata

| Alan | Nereye gider | Paint? |
|---|---|---|
| `CompositionTargets.visualLanguage` | overlay critic + debug | Kit hayır |
| `lastCompositionSearch.visualLanguage` | debug | Hayır |
| `ArtDirectionBlock.vocabulary` | `visualConcept.id` string (`ArtDirection.ts` 82) | İsim; dil değil |
| `ConceptPlan.visualIntent` | inferLanguage’de unused | Hayır |

---

## 3. GERÇEK ART DIRECTION KARARLARINI HANGİ KATMAN VERİYOR?

Set-0 kit yüzü (katalog freeze’in gördüğü şey):

| Sıra | Karar | Dosya | Anahtar | Dil? |
|---|---|---|---|---|
| 1 | Allowed heroes | `artDirectionAllowed.ts` 18–36 | `styleHeroes(style, sector)` ∩ `VOCAB.heroFamilies` − forbidden; oval/organic-wave drop | Hayır |
| 2 | Set-0 hero | `artDirectionPickers.ts` 76–79 | `visualConceptFor(style, sector)` → `preferHeroForConcept(concept.id)` | Hayır — **id** |
| 3 | Concept id | `VisualConcept.ts` 255–259 | `sector:sub:style` | Hayır |
| 4 | Lockup | `CONCEPT_LOCKUP_TABLE` 15–34, `applyPlan.ts` 19 | **concept.id** | Hayır |
| 5 | Chrome / frame / grid | `chromeForConcept` 51–59 vs | id + avoid + **languages[] ham** | Kısmen |
| 6 | Overlay skip | `kitGradeSkipsOverlay` 151 | **style only** | Hayır |
| 7 | Crest glyph omit | `kitGradeOmitsCrestGlyph` 156 | classic | Hayır |
| 8 | Pattern none | `preferPatternForConcept` 135 | air-paper id | Hayır |
| 9 | Native paint | `heroDispatch` + lockup chrome | system.lockup + hero family | Hayır |

`preferHeroForConcept` (`conceptKitAlignment.ts` 114–132):

- nocturne-crest / heraldic-crest → crest
- soft-oval → oval (sonra `remapBannedHero` oval → none)
- tech-glyph / signal-plaque → tech
- earthen-premium / grove-* / harvest-press → harvest

VOCAB zorunlu hero (`artDirectionPickers.ts` 44–56): cream/serum/food/perfume — yine style×sector, dil yok.

`resolve.ts` 92: `visualConceptFor(style, sector, 'none', brief.subProduct)` — **4 arg**, intent yok. DesignSystem lockup/goldBar concept.id üzerinden.

Sonuç: Art Direction’ın omurgası **tablolar + concept.id**. Visual Language kit’te chrome/frame kesici; overlay’de motif lehçesi. Intent hiçbiri değil.

---

## 4. INTENT BUGÜN NE YAPIYOR? (dil değil)

| Slice | Etki | Dil / concept? |
|---|---|---|
| 1 | `plan.designIntent` taşıyıcı | Hayır |
| 2 | Critic `principle?` etiketi | Hayır |
| 3 | `compositionTargets` air `designIntent.negativeSpace` | Hayır — air formülü, dil değil |
| 4 | `visualConceptFor(..., intent)` + `void intent` | Hayır |

Tie-break açılırsa: farklı CONCEPTS satırı → farklı id → farklı lockup tablosu → farklı preferHero → farklı languages[] → chrome ve (playful’ta) overlay hepsi kayar. 29/29 concept/hero/chrome freeze kırılır.

---

## 5. HEDEF MİMARİ (dosya/satır, kod yok)

Görev ayrımı:

| Katman | Sorumluluk | Bugün | Hedef |
|---|---|---|---|
| Design Intent | character, density, air, metallic, sector, surface | Taşıyıcı + air okuma | Aynı; **language input** |
| Visual Language | oval / heraldic / linear / quiet-line … lehçe | Concept satırının kopyası | Intent + sector’tan **önce** üretilir |
| Visual Concept | Named idea (nocturne-crest …) | style×sector lookup; dil kaynağı | Language allow-list içinde seçim |
| Art Direction | hero, pattern, chrome, crop | STYLE_HEROES + concept.id | Language allow-list ∩ mevcut tablolar |
| Motif family | overlay atom ailesi | concept.family | Language’a uyum; ayrı string uzayı |

Hedef fonksiyon (sonra):

`visualLanguageFor(intent: DesignIntentBlock, sector, surface): VisualLanguage[]`

Concept satırı `languages`’ı bu çıktının kopyası olur, kaynağı değil.

`visualConceptFor` anahtarı bir sonraki dilimde **değişmez**. Tie-break ayrı, kapılı dilim.

---

## 6. UYGULAMA SIRASI (onay sonrası; bu dilim değil)

Identity-first, Brain V1 ile aynı disiplin.

**VL-1 — taşıyıcı.** `DesignPlan.visualLanguage: VisualLanguage[]` (veya `VisualLanguageBlock`). `createPlan` doldurur: `languagesOfConcept(plan)` identity. Set-0 dilleri 18 CONCEPTS satırı ile birebir. Chrome/frame hâlâ aynı string’leri okur; kaynak plan alanı olur, ham `concept.languages` ikinci kapı kapanır. Overlay `languagesOfConcept` plan alanına yönlenir. Golden: 29 job languages + chrome + lockup + concept id.

**VL-2 — fonksiyon, hâlâ identity.** `visualLanguageFor(intent, sector)` eklenir. İçeride şimdilik style×sector freeze tablosu (mevcut CONCEPTS dilleri). Intent imzada var, tie-break yok. Test: `visualLanguageFor(plan.designIntent, sector)` === bugünkü `concept.languages`.

**VL-3 — invert (ayrı onay).** Dil intent’ten türeir. CONCEPTS `languages[]` kopya olur. Catalog golden: 29 language vektörü değişmez. Chrome quiet-line kesimleri aynı kalır.

**VL-4 — Concept tie-break (en son).** `visualConceptFor` intent okur **yalnızca** aynı language allow-list içindeki satırlar arasında. Farklı language → farklı concept **yasak**. Freeze: 29 concept id değişmezse no-op; değişirse ayrı insan bakışı.

Yapılmaz bu dilimde: CONCEPTS key değişimi, 29 id değişimi, budget / opticalY / brandY, overlay skip, GraphicLibrary, `metallic-restraint` critic.

---

## 7. FREEZE RİSK HARİTASI

| Müdahale | Kit 25/29 | Playful 4/29 | Freeze |
|---|---|---|---|
| Intent → concept tie-break | Concept/hero/lockup/chrome kayar | + overlay lehçe | **Delinme** |
| Intent → language, CONCEPTS kopya, golden 29 dil aynı | Chrome string’leri aynı kalırsa görünmez | Scoring aynı kalırsa görünmez | Güvenli hedef |
| `languagesOfConcept` → plan taşıyıcı identity | Bypass kapanır, çıktı aynı | Aynı | Güvenli |
| `inferLanguage` silmek | Katalogda no-op (satırlar dolu) | Test planları | Dikkat |
| Overlay skip’i style dışında dile bağlamak | 25 yüzde overlay açılabilir | — | **Yasak** |

---

## 8. CALL-SITE ENVANTER

| Dosya | Sembol | Rol |
|---|---|---|
| `src/engine/artwork/visualLanguage.ts` | `VisualLanguage`, `languagesOfConcept`, `inferLanguage`, `conceptFidelityOf`, `atomMatchesAnyLanguage`, `preferredRolesForLanguage` | Overlay lehçe + unused infer |
| `src/engine/brain/DesignPlan.ts` 56, 70 | `ConceptLanguageId`, `VisualConceptBlock.languages` | Damga tipi |
| `src/engine/brain/VisualConcept.ts` | `CONCEPTS[].languages`, `visualConceptFor` void intent | Kaynak |
| `src/engine/brain/ArtDirection.ts` 78–84 | concept + chromeForConcept | Kit chrome |
| `src/engine/brain/artDirectionPickers.ts` 77, 91, 123 | visualConceptFor 5 arg ignored | Hero/pattern |
| `src/engine/brain/artDirectionAllowed.ts` | STYLE_HEROES ∩ VOCAB | Allowed lists |
| `src/engine/brain/styleHeroConfig.ts` | STYLE_HEROES | Hero omurga |
| `src/engine/designSystem/conceptKitAlignment.ts` | chrome/frame/grid/lockup/preferHero/skipOverlay | Kit SoT |
| `src/engine/artwork/compositionStrategy.ts` 151, 246 | overlay targets / strategy | Overlay |
| `src/engine/artwork/compositionCandidates.ts` | craft fill, scale, retry | Overlay |
| `src/engine/artwork/artMotifMatch.ts` 215 | atom skor | Overlay |
| `src/engine/artwork/panelRenderers/frontPanel.ts` 94, 140–163 | skip vs matchMotifs | Kapı |
| `src/engine/designSystem/resolve.ts` 92 | visualConceptFor 4 arg | DesignSystem |
| `src/engine/artwork/paletteTable.ts` | `LanguageId` | İsim çakışması, palet |

---

## 9. BU DİLİMDE YAPILMAYAN

Motor kodu yok. Test yok. Concept satırı yok. Tie-break yok.

Onay beklenen sonraki dilim: **VL-1 taşıyıcı** (identity, freeze golden).
