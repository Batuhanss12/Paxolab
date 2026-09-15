# ASSET LANGUAGE AUDIT

Ürün: Grapxor. Tarih: 15 Eyl 2026.  
Kapsam: `assetLanguageFor`, composition, motif match, critic, kit overlay skip.  
Kod değişikliği yok. 29 set-0 freeze dokunulmaz.

Soru: **Asset Language gerçekten asset seçimini ve composition ranking’ini belirleyen bir karar katmanı mı, yoksa mevcut kararların sonradan paketlendiği bir facade mı?**

---

## CEVAP

**Facade / compile-identity.** `assetLanguageFor(plan)` Art Direction ve Visual Concept’te **zaten verilmiş** alanları paketler; tek sentezlediği alan `roles` (`preferredRolesForLanguages`). Downstream çoğu yer bu nesneyi okur ama **aynı değerleri** okur. Hard gate’ler Asset Language değil: concept **family** (−1000 / REJECT), **style overlay skip** (25/29 yüz), lockup overlap, retired overlay. Composition ranking geometri + family ağırlıklıdır; dil %8, rol **skorda 0**. Set-0 overlay’in çalıştığı 4 playful işte `roles = []` — rol sıralaması kapalı. `heroFamily` / `patternFamily` / `chrome` Asset Language üzerinde durur, painter onları **bu nesneden okumaz**.

İdeal zincir (`AD → Asset Language → preferred/allowed/forbidden → candidate → ranking → composition`) mimari yorumdur. Çalışan zincir: **eski kararlar → paket → (25 işte overlay yok) → family havuzu → style/sector skor → geometri ranking**.

---

## KARAR ZİNCİRİ (çalışan, set-0)

```
INPUT  brief × style × sector × subProduct × cue
  │
  ├─ buildDesignIntent          DesignDirector.ts
  ├─ visualLanguageFor          visualLanguage.ts   LANGUAGES[style×sector×sub] ± quiet-line
  ├─ visualConceptFor           VisualConcept.ts    family, lexicon, avoid, budget, strategyBias
  └─ attachArtDirection         ArtDirection.ts
        pickHero / pickPattern    artDirectionPickers.ts   allowed ∩ language
        chromeForConcept          conceptKitAlignment.ts   treatment.chrome + concept id
  │
  ▼
DesignPlan  (kararlar burada kilitlenir)
  │
  ▼
assetLanguageFor(plan)          assetLanguage.ts    KOPYA + roles türevi
  languages ← languagesOfConcept(plan)     carrier / concept
  family    ← visualConcept.family
  lexicon   ← visualConcept.motifLexicon
  avoid     ← visualConcept.avoid
  roles     ← preferredRolesForLanguages(languages)   ← tek yeni alan
  heroFamily / patternFamily / chrome  ← plan AD çıktısı
  │
  ▼
renderFrontPanel                frontPanel.ts
  kitGradeSkipsOverlay(style)   conceptKitAlignment.ts
  │
  ├─ TRUE  (luxury|modern|minimal|classic|eco)  → 25/29
  │    overlay zinciri ÇALIŞMAZ
  │    frontDecor kit chrome/frame/grid          plan.visualLanguage, artDirection.chrome
  │    Asset Language composition’a ulaşmaz
  │
  └─ FALSE (playful)  → 4/29
       │
       ▼
     matchMotifs                    artMotifMatch.ts
       collectAtoms                 sheet bank + family files
       selectFamilyPool             query.family HARD (concept family)
       scoreAtom                    mood/sector/color + family ±100/50/−1000
                                    language +10, lexicon +10, avoid −7
       slice top 8
       │
       ▼
     selectMotifComposition         compositionCandidates.ts
       selectFamilyPool             assets.family  (identity of concept family)
       compositionTargets           style density/air + treatment.airBias +0.06
       allowedStrategies            style + concept.strategyBias + avoid/blockCorners
       generateCompositionCandidates
         atomsForConcept            plan.visualConcept.family  (assets.family DEĞİL)
         buildCandidateSlots
           STOCK recipes            artMotifCompose.pickForSlot  — roles YOK
           CUSTOM                   layoutCustomSlots.pick         — roles geç sıralama
         fillDecorationBudget       concept id + treatment.mayGrowFill
         family filter              atomFitsConceptFamily HARD
       scoreCompositionSlots        geometri %40+ ; family 14% ; dil 8% ; rol 0%
       critiqueCandidate            family REJECT ; avoid MODIFY −12
       chooseCompositionWinner      total ±0.8
       │
       ▼
     paintMotifSlots                artMotifCompose.ts   mevcut painter
     frontDecor                     kit yüzü; Asset Language chrome okunmaz
```

---

## 1. ASSET LANGUAGE AUTHORITY

Kaynak: `assetLanguage.ts` `assetLanguageFor`. Yorum satırı: “Identity of existing plan fields.”

| Alan | Üretim (asıl) | Asset Language | Override / kim kazanır | Composition/painter okur mu? |
|---|---|---|---|---|
| `languages` | `visualLanguageFor` → `plan.visualLanguage`. Carrier boşsa concept satırı | `languagesOfConcept` kopyası | Carrier kazanır (`languagesOfConcept`) | Evet: targets, pick sort, scoreAtom, treatment, critic fidelity. **Aynı fonksiyonun başka adı.** |
| `family` / `supportFamily` | `visualConceptFor` CONCEPTS | `plan.visualConcept.family` kopyası | Concept satırı. AL üretmez | **Karışık.** `selectMotifComposition` `assets.family`; `atomsForConcept` / critic / score **`plan.visualConcept.family`**. Identity. Hard gate concept’te. |
| `lexicon` | CONCEPTS `motifLexicon` | `lexiconOf` kopyası | Concept. AL üretmez | Evet: pick novelty (dil match’ten **önce**), pairStyleScore, conceptFidelity |
| `avoid` | CONCEPTS `avoid` | `avoidOf` kopyası | Concept. AL üretmez | Soft: pick demote, scoreAtom −7, critic MODIFY −12. **REJECT değil.** Strategy: `heavy-frame` / `dense-pattern` / `generic-corners` blok |
| `roles` | `preferredRolesForLanguages(languages)` | **Tek sentez** | Dil vektörü. `organic`+`geometric` → `[]` | Custom `pick()` 6. anahtar. **Skor kartı okumaz.** `targets.preferredMotifRoles` yazılır, `scoreCompositionSlots` kullanmaz. Stock recipe `pickForSlot` roles yok |
| `heroFamily` | `pickHero` AD-1 ∩ language | plan kopyası | Art Direction; overlay override `forceHero` | **AL’den hayır.** `focalStrength` / `hasHero` `plan.heroGraphic.family`. Kit hero `paintPlanHero` |
| `patternFamily` | `pickPattern` AD-2 ∩ language | plan kopyası | Art Direction; repair değiştirebilir | **AL’den hayır.** Pattern painter plan’dan |
| `chrome` | `chromeForConcept` (treatment + concept id + avoid) | plan kopyası | Kit `chromeForConcept` tekrar hesaplar | **AL’den hayır.** `frontDecor` `plan.artDirection.chrome` + `plan.visualLanguage` |

**Üretim sırası:** Asset Language, AD/concept’ten **sonra** gelir. Preferred / allowed / forbidden listesini **kendisi seçmez**; AD `allowedHeroes`/`allowedPatterns` ve concept `avoid` zaten seçmiştir. AL `allowed` alanı bile taşımaz.

---

## 2. ASSET SELECTION

Aday havuzu Asset Language’ın preferred/forbidden kümesi değil.

### Hard filter (Asset Language değil)

1. `kitGradeSkipsOverlay(style)` — 25/29 catalog yüzünde motif search yok.
2. `selectFamilyPool(family, support, conceptId)` — concept **motif family**. Match’te wrong family **−1000**, slice `score > -500`.
3. `rejectRetiredOverlayAtoms`.
4. `atomsForConcept` generate sırasında **tekrar** `plan.visualConcept.family`.

### Soft score (match) — `scoreAtom` (`artMotifMatch.ts`)

| Sinyal | Delta | Baskınlık |
|---|---|---|
| Family exact / support / compatible / wrong | +100 / +50 / +50 / **−1000** | Hard |
| Mood + sheet vocab | ~±5–9 | Style |
| Sector vocab | ±3 | Sector |
| Color align | 0–4 | Kit palet |
| Luxury frame/corner role | +2 | Style, AL roles değil |
| **Language match** | **+10** | AL languages (query’den) |
| **Lexicon hit** | **+10** | Concept lexicon |
| **Avoid** | **−7** | Soft |
| Oval ticks cezası | −6 | Dil regex |

Family wrong atom havuza giremez. Havuzdaki sıralamada style/sector/mood, dil ile **aynı mertebede değil**: family +100, language +10. “Preferred asset” diye bir AL kümesi yok; preferred = lexicon hit + language regex + family file.

### Style / sector / concept / kit hâlâ daha baskın mı?

**Evet.**

- Style: overlay on/off; `rankAtomsForRegion(style, sector)`; `allowedStrategies` style dalları; `moodPrior`; luxury/classic framed-content.
- Sector: sheet vocab, food art-deco cezası.
- Concept: family hard, lexicon novelty **language’den önce** (pick comparator), budget, strategyBias, concept id special-case (`air-paper`, `soft-oval`, `capsule-field`).
- Kit: `kitSuppliesFocalLockup` slot sayısını keser; `kitLexiconUsed` novelty’yi tüketir; lockup chrome family’den bağımsız (`serif-cartouche` focal, hero harvest olsa bile).

---

## 3. COMPOSITION — quiet-line örneği

Slot yerleşimi **strategy fonksiyonu**dır, Asset Language “kaç motif / hangi rol” tablosu değil.

`layoutCustomSlots` (`compositionCandidates.ts`):

| Strategy | Motif sayısı (hedef) | Placement | AL’den gelen |
|---|---|---|---|
| `minimal-accent` | 1 | heroX’e göre nw/ne | atom pick (lexicon→lang→roles) |
| `asymmetric-editorial` | 1–3 | köşeler + band eğer budget ≥ 0.32 | companion = unused lexicon |
| `hero-with-support` | 0–3 | kit focal ise hero-stamp **atlanır** | kit, lexicon; roles geç |

Strategy listesi: `allowedStrategies` — **style + concept.family + strategyBias + density/budget**, sonra AL `avoid` ve `languageTreatmentFor(langs).blockCorners`.

`quiet-line` geldiğinde gerçekten değişen / değişmeyen:

| Eksen | Değişir mi? | Mekanizma |
|---|---|---|
| Token okuma | Evet | `assets.languages` includes quiet-line |
| Whitespace hedefi | Evet, **+0.06** tavan 0.82 | `treatment.airBias` → `compositionTargets.whitespaceTarget` |
| Motif **sayısı** | Hayır (dil yüzünden) | Strategy + budget + kit focal. Quiet-line slot cap yok |
| Motif **rolü** | Sadece custom pick, 6. anahtar | `preferredRolesForLanguage('quiet-line')` = corner/accent/frame. Catalog overlay’de quiet-line **yok** (playful = organic+geometric, roles []) |
| Placement | Hayır | heroZone.x, stock recipe geometrisi |
| Hero relationship | Hayır (AL heroFamily) | `kitSuppliesFocalLockup` + `plan.heroGraphic` |
| Motif scale `small` | **Derlenir, uygulanmaz** | `constrainAtomScale` yalnız `motifScale === 'bold'` (linear) |
| Chrome quiet | Kit’te evet, AL chrome’dan değil | `chromeForConcept` / `shouldPaintSectorFrame` treatment.chrome; concept id `air-paper` aynı kapıyı **tekrar** kapatır |
| Overlay | Catalog quiet-line işleri kit-grade | 03/04/07/16/17/20 overlay **skip** — composition zinciri yok |

Sonuç: quiet-line catalog’da **kit chrome/air** ve **hedef whitespace** (hesaplanır ama overlay yoksa ranking’e girmez). Overlay yüzünde “az motif, doğru rol, hero’dan uzak” diye bir AL politikası yok.

---

## 4. RANKING — Aday A vs Aday B

Ağırlıklar `COMPOSITION_SCORE_WEIGHTS` (`compositionStrategy.ts`):

| Eksen | Ağırlık | Asset Language mi? |
|---|---|---|
| hierarchy | 0.16 | Hayır — visualWeight geometri |
| familyConsistency | 0.14 | Concept family (AL family kopyası) |
| balance | 0.12 | Hayır |
| whitespace | 0.12 | Hedef: style air + **treatment.airBias** |
| styleConsistency | 0.10 | Tag/family; lexicon pair +8 |
| decorationDensity | 0.08 | Budget/density, concept |
| **conceptFidelity** | **0.08** | Dil + lexicon + avoid (`conceptFidelityOf` hâlâ `languagesOfConcept`, AL değil) |
| assetCompatibility | 0.06 | styleConsistency kopyası |
| alignment | 0.06 | Neredeyse sabit 86 |
| rhythm | 0.05 | Strategy layout |
| collisionSafety | 0.04 | Lockup/hero |
| productionSafety | 0.03 | Collision |

Geometri (hierarchy+balance+whitespace) = **0.40**. Family = **0.14**. Dil (conceptFidelity) = **0.08**. Rol = **0**.

### Kullanıcının senaryosu

- **A:** preferred lexicon, doğru rol, doğru dil, doğru composition  
- **B:** allowed, yanlış-ish rol, generic concept match  

**Rol:** `scoreCompositionSlots` `targets.preferredMotifRoles` okumaz. Yanlış rol B’yi cezalandırmaz. Custom `pick()` içinde rol, lexicon novelty’den **sonra** gelir; stock recipe’de rol anahtarı yok.

**Dil:** A fidelity 100, B 50 → Δtotal ≈ `50 × 0.08 = 4.0`. Eş geometri + eş family’de A kazanır (eşik 0.8).

**Geometri B lehine 25 hierarchy puanı:** `25 × 0.16 = 4.0` — dil avantajını yer. Whitespace 20 puan: `2.4`. Ranking **layout craft**’a açık.

**Family:** A EXACT / B COMPATIBLE → `50 × 0.14 = 7.0` — dilden büyük. Wrong family zaten REJECT.

**Avoid:** critic REJECT değil; −12 conceptFidelity × 0.08 ≈ **0.96** total. Pick’te sona düşer, elenmez.

**Set-0 overlay (4 playful):** `roles = []` → rol sıralaması no-op. Winner freeze: vintage-badge. Bu, AL preferred-role otoritesi değil; family/lexicon/sheet + mevcut pick.

### Pick comparator (custom slot) — sıra

1. avoid demote  
2. unused **lexicon** hits  
3. family file (lexicon hit varken)  
4. lexicon index  
5. language match  
6. **roles**  
7. compositionRoleFit (strategy meta, AL değil)  
8. `rankAtomsForRegion(style, sector)` (stabil)

Preferred asset (lexicon) language’den ve rol’den **önce**. Ideal “preferred → allowed → forbidden” değil; **lexicon novelty → language → role**.

---

## 5. DUPLICATE AUTHORITY

Aynı seçim birden fazla yerde, çoğu AL’den bağımsız veya AL ile identity.

| Karar | 1 | 2 | 3 | Hangisi hard? |
|---|---|---|---|---|
| Dil vektörü | `visualLanguageFor` / `plan.visualLanguage` | `assetLanguageFor.languages` | `languagesOfConcept` inside `conceptFidelityOf` | Carrier. AL kopya |
| Family havuzu | `matchMotifs` selectFamilyPool | `selectMotifComposition` assets.family | `atomsForConcept` **plan.visualConcept.family** | Hepsi aynı değer; üç çağrı |
| Family fail | scoreAtom −1000 | `slotsPassFamilyConstraint` drop | critic REJECT −1000 | Üçü birden hard |
| Avoid | pick demote | scoreAtom −7 | critic MODIFY −12 + `conceptFidelityOf` −12/slot | Soft, **çift** fidelity cezası |
| Chrome | `chromeForConcept` AD’de | `assets.chrome` kopya | `frontDecor` tekrar `chromeForConcept` / treatment | Kit 3. kez; AL unused |
| Whitespace | `airOf` intent | `treatment.airBias` +0.06 | concept tag `'air'` | İkisi OR |
| Strategy | concept `strategyBias` | style dalları | avoid/blockCorners | Style+concept baskın |
| Overlay on/off | `kitGradeSkipsOverlay(style)` | — | AL yok | Style. Dil bağlanmadı |
| Roles | `preferredRolesForLanguages` | `assets.roles` | `targets.preferredMotifRoles` (ölü alan) | Custom pick only |

`conceptFidelityOf` Asset Language **import etmez**; plan primitive’lerini tekrar okur. Critic `assetLanguageFor(plan).avoid` der, fidelity ayrı `avoidOf`.

---

## 6. SET-0 REGRESSION

Bu audit kod değiştirmedi. Son yeşil koşu (15 Eyl 2026, `designBrainV1.test.ts` + phase 17/18/21/22/24/25):

| Kilit | Durum |
|---|---|
| 29/29 createPlan fingerprint | Korunuyor (`CATALOG_FREEZE` concept/hero/chrome/lockup/optical/compositionTargets) |
| 25/4 overlay split | `kitGradeSkipsOverlay` style-only; generate 25 skip / 4 search |
| vintage-badge winner | 4 playful `winnerAssetId` `vintage-badge\|badge\|vintage` |
| lockup Y | 01/03/04/08/14 opticalY/brandY freeze |
| Retired overlay ids | SVG’de yok |
| `assetLanguageFor` identity | 29 işte languages/family/lexicon/avoid/roles/hero/pattern/chrome = plan |

Freeze’in korunması AL’nin otorite olduğu anlamına **gelmez**. Identity freeze, ranking’i değiştirmediğinin kanıtı.

---

## İDEAL vs GERÇEK

**İdeal**

```
Art Direction → Asset Language → preferred/allowed/forbidden
  → candidate generation → ranking → composition → painter
```

**Gerçek**

```
Art Direction + VisualConcept + VisualLanguage  →  DesignPlan
  → assetLanguageFor() paket
  → 25/29: kit painter (AL composition yok)
  → 4/29: family havuzu → style/sector match → strategy(style)
        → lexicon-first pick → geometri ranking → mevcut painter
```

Asset Language “kullanılıyor.” Bu doğru ve yetersiz. Kullanım: **okuma yönlendirmesi**. Karar: **hâlâ plan alanlarında ve style/family gate’lerinde.**

---

## BUNU YAPMA (audit sonrası)

- Painter’a yeni knob (sector-frame stroke, hero scale)
- Overlay skip’i dile bağlamak
- `assetLanguage`’i zorunlu DesignPlan alanı yapmak (şişirme + stubPlan)
- “roles targets’a yazıldı”yı otorite saymak — skor okumuyor
- Identity test’i ranking kanıtı saymak

Otorite dilimi (ayrı iş, freeze ile): preferred/allowed/forbidden’ı AL’de üretmek; family/style gate’ten **sonra** değil **onun yerine** havuzu kesmek; conceptFidelity + role’ü skorda lexicon/family ile yarışır hale getirmek; stock recipe’ye roles bağlamak. Bu freeze’i deler — bu audit’te yok.
