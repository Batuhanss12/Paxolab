# Paxolab — Creative Brain Expansion Audit

**Tarih:** 2026-09-18 · **Kod değişikliği:** yok · **Yöntem:** her iddia bir dosya:satır ya da bir ölçüme bağlı. Tahmin olan yerlerde "tahmin" yazıyor.

Kapsam: mevcut beynin gerçek zinciri (§1), stüdyo repertuarının sayımı (§2), `TASARIM REF` klasöründeki 31 görselin kataloğu ve DNA çıkarımı (§3–4), mevcut DNA ile karşılaştırma (§5), darboğaz analizi (§6), zincir doğrulamaları (§7), repertuar matrisi (§8), uygulama planı (§9) ve 13 audit sorusunun cevabı (§10).

---

## 0. Önce iki düzeltme — audit'in kendi varsayımlarına

1. **"Botanik ağırlıklı illüstratör"** doğru ama eksik ifade. Ölçüldü: `species.ts` (1.213 satır) **16 tür × 7 düzen × 2 stil**; hepsi bitki. Motorun *tek* özne çizicisi bu. Diğer 10 zemin (`backgrounds.ts`) doku/geometridir, özne değildir. Yani sorun "botanik çok" değil, **"özne çizen tek modül var ve o bitki çiziyor"**.
2. **"Archetype selection brief-independent"** — kısmen yanlış. Görsel kelime ("mermer", "arma", "dalga") arketipi *değiştiriyor* ve bu test edilmiş (`studioDirectionBrief.test.ts` R4: "same sector, different visual brief → different archetype"). Bağımsız olduğu şey **marka kişiliği**: `scoreArchetype` (`direction.ts:366-408`) marka adı, hedef kitle, kanal, fiyat katmanı, his, konumlandırma ve referanslardan **sıfır** terim okuyor. Kesin ifade §6.4'te.

---

## 1. Mevcut beynin gerçek zinciri

Üretim yolu tektir: `FormaLocalEngine.generate` ile `overrides.studio = true` (`App.tsx:400` her zaman). Aşağıdaki satır numaraları `src/engine/FormaLocalEngine.ts`.

```
brief
 ├─ applyKnowledgeToBrief            :143   aktif kurallar → avoidMotifs / directorCue (KNOWLEDGE_DERIVED)
 ├─ createPlan  (DesignDirector)     :145   → DesignPlan
 │     styleRule (DesignRules)               6 stil × 11 alan
 │     lookupVocabulary (SectorVisualVocabulary)  sektör×altürün satırı
 │     composeGrammar (CompositionGrammar)   8 kompozisyon niyeti + heroZone + opticalCenter
 │     attachArtDirection (ArtDirection)     hero/pattern/primitive seçimi, visualConcept, decorationBudget
 │     studioRecipe (VariationRecipes)       kit varyasyon reçetesi
 │     principlesFor (DesignKnowledge)       8 ilke etiketi
 │     rememberArt (DesignMemory)            anti-tekrar hafızası
 ├─ studioHintsFromKnowledge         :177   aktif stüdyo kuralları → DirectionHints
 ├─ hintsFromPlan  (studioPlanBridge):178   plan → YALNIZ typePairing / frame / ornament
 ├─ hintsFromBriefDepth              :179   priceTier / feeling → YALNIZ ornament
 ├─ applyPlanToSystem                :181   plan → DesignSystem  (stüdyo okumuyor, bkz. §7.1)
 ├─ decideDirection  (studio/direction.ts) :200
 │     rankDirectionPool → scoreArchetype → uniqueFamilyRows → MOOD_WALK_OFFSET → pick
 │     materializeDirection → varyFace, pickAxis, copyBankFor, seed → variant
 ├─ composeStudioArtwork             :224   arketip switch → labelLayouts / boxLayouts → backgrounds / species → ledger
 ├─ paintStudioFront × 8             :260   teklif adaylarının ön yüzleri
 ├─ runPreflight + applyStudioPreflight :287
 ├─ critiquePlan(...) → needsRepair: false  :294   ← RAPOR, ONARIM DEĞİL
 ├─ planStudioRepair (1 geçiş, title/logo scale)  :303
 ├─ ledger > 0 → arketip adımı ≤3   :322
 ├─ craft < STUDIO_CRAFT_FLOOR (50) → arketip adımı ≤3  :336
 ├─ repairPlan  — yalnız !studioOn   :346   ← ÜRETİM YOLUNDA DEĞİL
 ├─ scoreVisualCraft (rapor)         :368
 ├─ captureGenerateDecision          :369   → DesignDecisionLog (içinde critiqueDesign :424)
 ├─ observeFeedback (geri bildirim varsa) :409 · observeCritic (yalnız studioLedger) :418
 └─ sonra: noteExport/Download/Rating → observeOutcome → LearningEngine → aday → doğrulama → aktif kural
```

### 1.1 Modül tablosu — girdi / çıktı / tüketici / karar etkisi / test

"Karar etkisi" sütunu **stüdyoda boyanan yüzü** ölçer. Kit yolu (`composeArtwork`, ~12.000 satır) `App.tsx:400` yüzünden ulaşılamaz; oraya giden etkiler sayılmadı.

| Modül | Girdi | Çıktı | Stüdyoda tüketen | Boyanan yüze etkisi | Test |
|---|---|---|---|---|---|
| `DesignDirector.createPlan` | brief, template, style, cue, variationIndex | `DesignPlan` | `studioPlanBridge` (typography.authority/displayFace/trackingIntent, positioning, visualIntent, color.metallic, composition.negativeSpace, density.front, decorationBudget) · `critiquePlan` · `scoreVisualCraft` · karar logu | 3 eksen (tip ikilisi / çerçeve / süs), `intentFit × 0.05` + `pickAxis` üzerinden | `designBrainV1.test`, `designBrainV1.principles.test` |
| `DesignRules.styleRule` | style | 11 alanlı kural | `createPlan` | köprü üzerinden: authority+face+tracking → typePairing; positioning+metallic → frame; negativeSpace → ornament | `designBrainV1` |
| `CompositionGrammar.composeGrammar` | style, surface, lockup, negativeSpace, variationIndex | `composition` — **8 niyet** (symmetric, asymmetric, grid, offset, diagonal, editorial, floating, full-bleed), heroZone, opticalCenter, lockupBand | **hiçbiri** — köprü yalnız `negativeSpace` okuyor, o da zaten `styleRule`'dan geliyor | **0.** Ressamlar `plan`'ı hiç almıyor: `makeCtx(panel, direction, copy, brief, …)` imzasında plan yok; ressamların okuduğu alanlar ölçüldü (`d.palette` 123, `d.ornament` 15, `d.typePairing` 13, `d.background` 13, `d.archetype` 9, `d.frame` 4, `d.temperament` 2) — `lockup` DNA'dan, `intent` yok | `designBrainV1` |
| `ArtDirection.attachArtDirection` (+`artDirectionPickers`, `artDirectionAllowed`) | ctx | heroGraphic, patternSystem, illustrationSystem, backgroundTreatment, visualConcept, visualLanguage, density, crop | `decorationBudgetOf(plan)` → `ornamentFromPlan` | yalnız süs seviyesi (bütçe ≤0.24 quiet / ≥0.40 rich) | `designBrainV1` |
| `VisualConcept.visualConceptFor` | style, sector, hero, subProduct | concept (family, budget, strategyBias, avoid, motifLexicon) | `ornamentFromPlan` (budget) | yalnız süs | — |
| `SectorVisualVocabulary` (`VOCAB` + kurallar) | sector, subProduct | heroFamilies, patternFamilies, backgroundTreatments, ornamentLevel, forbidden*, `typographyVoice` | `createPlan` (vocab.id), `critiquePlan` (bleed) | **0.** Kelime dağarcığı kit adlarıyla yazılı (crest/seal/harvest/monstera, contour/lattice…); hiçbir stüdyo ressamı bunları yaymıyor; `typographyVoice` hiç okunmuyor | `designBrainV1` |
| `VariationRecipes.studioRecipe` | variationIndex | reçete (hero/pattern slot, crop, chrome, typeScale, trackingScale…) | `createPlan`, `applyPlanToSystem` — ikisi de kit'e gidiyor | **0.** Stüdyo varyasyonu ayrı: `varyFace` (zemin yürüyüşü) + `pickAxis` + `variant` seed | — |
| `DesignKnowledge` (8 ilke) | style, surface | `principles[]`; konu→ilke haritası | `critiquePlan.labelHint`, `LearningEngine.principleForRecommendation` | 0; ipuçlarını ve öğrenilen kuralları *etiketler* | `designBrainV1.principles` |
| `CritiqueEngine.critiquePlan` | plan, scorecard, faceMarkup | KEEP/MODIFY + `needsRepair` | hesaplanıyor, sonra `needsRepair: false` ile **eziliyor** (:294); loga yazılıyor | **0** — danışma | (kit) |
| `RepairPlanner.repairPlan` | plan, report | plan' | yalnız `!studioOn` (:346) | **üretim yolunda değil** | `designBrainV1` |
| `applyPlan.applyPlanToSystem` | system, plan | system' | stüdyo `system.wrapSeam / markRecipe / key` okuyor — üçü de `resolveDesignSystem`'den, plan'dan değil | **0** | — |
| `DesignScore.scoreDesign` | artwork, preflight, copy, plan | scorecard | `critiquePlan` girdisi | 0 (atılan bir bayrağı besliyor) | `scoreConfig.test` |
| `scoreVisualCraft` (+`visualCraftScores`, `geometryMetrics`) | artwork, preflight, copy, plan | 10 boyutlu kart | **F-8 kapısı**: `< 50` → sonraki arketip, ≤3 adım, monoton | **gerçek kapı** — ama sinyallerin çoğu kit sözlüğü (§7.4) | `craftScore`, `craftGate`, `studioCraft` |
| `studioCritic.studioCriticActions` | collisions, outOfBounds, temperament | quieter / vary | sohbet (C6), `DesignCritic` (ledger kanıtı), `observeCritic` | kullanıcı tetikli yeniden üretim | `studioCritic.test` |
| `DesignCritic.critiqueDesign / critiqueAsFeedback` | plan, critique, preflight, ledger, craft | bulgular | karar logu; `observeCritic` (yalnız ledger satırları) | 0; öğrenme girdisi | `designCritic.test` |
| `DesignDecisionLog.captureGenerateDecision` | her şey | adaylar, winner.why, critiques, outcome | LearningPanel, OutcomeTracker, LearningEngine | 0; **hafıza** | `designDecisionLog.test` |
| `OutcomeTracker` | designId + olay | outcome yaması → `observeOutcome` | LearningEngine | 0 anlık | `learningGate` |
| `LearningEngine` | log, feedback, outcome | gözlem → örüntü → aday → aktif kural | `applyKnowledgeToBrief`, `studioHintsFromKnowledge` | **sonraki** üretimde: arketip/zemin/tip/çerçeve/süs pin ya da avoid (güven ≥ 0.6) | `learningGate` (7), `studioLearning` (3), C7 döngüsü (12) |
| `DesignKnowledgeStore` | kurallar | aktif kurallar, sürüm, geri alma | yukarıdakiler, LearningPanel | yukarıdaki gibi | `learningGate` |
| `applyKnowledge` / `studioKnowledge` | brief | brief' / DirectionHints | `createPlan` / `decideDirection` | bilgi → ipucu (plan ve derinlikten sonra, kullanıcıdan önce) | `craftGate` ("F-8 knowledge on the three axes") |
| `DesignMemory` | style, hero, pattern | forbidLastFamilies | `attachArtDirection.antiRepetition` → kit | **0** | — |
| `moodPriors`, `styleHeroConfig`, `scoreDesignCard`, `learningUi`, `vocabularyRules` | — | — | kit / UI | 0 | — |

### 1.2 Stüdyo tarafındaki "beyin" (brain/ klasöründe değil ama karar veren)

| Modül | Karar |
|---|---|
| `studio/direction.ts` (1.151 satır) | `scoreArchetype` ağırlıkları; `uniqueFamilyRows`; `MOOD_WALK_OFFSET`; `temperamentFor`; `varyFace`; `pickAxis`; `materializeDirection`; `visualOverrideFromBrief`; `productFamilyFit` |
| `studio/referenceDna.ts` | 10+10 arketip DNA'sı: zeminler, tip ikilileri, mizaçlar, çerçeveler, süsler, `lockup`, sektör/stil uyumu, en-boy |
| `studio/family.ts` | 10 aile, kutu↔etiket eşi, alias sözlüğü |
| `studio/panelField.ts` | ikincil panel zemini + yoğunluk/susturma (`FIELD_INTENSITY`, `FIELD_MUTE`) |
| `studio/copyBank.ts` (596) | sektör × dil metin bankası |
| `studio/species.ts` (1.213) | tür çözümleme + botanik çizici |
| `studio/studioRepair.ts` | `planStudioRepair`, `STUDIO_CRAFT_FLOOR = 50` |

**Sonuç:** Üretimde *karar veren* zeka `brain/`'in içinden çok `studio/direction.ts` + `referenceDna.ts`'de yaşıyor. `brain/` modüllerinin çoğu (7.082 satırın kabaca yarısı) kit yoluna konuşuyor ve stüdyo yüzüne dokunmuyor. Bu "beyin yok" demek değil; **beynin iki ayrı dili var ve boyayan taraf yalnız birini duyuyor** demek.

---

## 2. Stüdyo repertuarı — sayılmış

| Boyut | Sayı | Kaynak | Not |
|---|---:|---|---|
| Görsel aile | 10 | `family.ts` | marble, botanical, line-scene, wave, ink, dark-luxe, tech, specimen, atelier, crest |
| Arketip | 10 etiket + 10 kutu | `referenceDna.ts` | 20 ressam: `labelLayouts.ts` 1.336 satır / 13 `paint*`, `boxLayouts.ts` 603 / 7 |
| **Lockup (kompozisyon iskeleti)** | **4** | `types.ts:90` | stacked-center, top-right-pill, left-column, monogram-right — **20 arketipin 16'sı `stacked-center`**; `lockup` DNA'da tek değer, tercih listesi değil |
| Zemin | 10 | `backgrounds.ts` | marble, botanical, diagonal, ink-wash, gradient-wash, line-scene, paper, wave, circuit, arabesque — doku/geometri; özne yok |
| Tip ikilisi | 4 | `types.ts:56` | 3 font ailesi üstünde: Cormorant Garamond (500/500i/600/700), Montserrat (300/500/700), Great Vibes (400) = 8 gömülü yüz; `mono` gömülü değil |
| Mizaç | 6 | `types.ts:62` | palet = `paletteFromBrief` × mizaç işlemi |
| Çerçeve | 7 | `referenceDna.ts:459` | none, thin-double, corner-brackets, rounded-card, band-hairline, fleuron-crown, bezel |
| Süs seviyesi | 3 | | quiet / measured / rich |
| **Düzen varyantı** (`variant` 0–2) | nominal 3 | `direction.ts:1008` | **20 ressamın 7'si okuyor** (etiket: line-scene, wave-panel; kutu: botanical-card, diagonal-tech, ink-wash, marble, noir-stack). 13'ü için aynı arketip = aynı yerleşim |
| Özne çizici | 16 tür × 7 düzen × 2 stil | `species.ts` | hepsi bitki; 6 çiçek tipi; meyve parametresi |
| Fayda ikonu | 12 | `types.ts:92` | |
| Metin bankası | 10 sektör × 2 dil | `copyBank.ts` | sektör başına: 1 slogan, 1 kategori, 1 hikâye, 2 çip, 4 manifesto, 3 önek, 3 fayda |
| İkincil panel kuralı | var | `panelField.ts` | ikincil zemin + yan/kapak/kanat/arka yoğunluğu; **panel rolü ataması** (hangi yan sanat, hangisi marka) yok |
| Donmuş yüz | 18 | `studioGolden.ts` | DNA + hash |
| Teklif | 8 | `DIRECTION_OFFER_SIZE` | aile başına 1 |
| Zanaat tabanı | 50 | `studioRepair.ts:31` | goldenlar 57–76 ölçülmüş |

**Kit yolunda var, stüdyodan ulaşılamayan:** `HeroFamily` 12 (crest, seal, botanical, emblem, harvest, tech, oval, monstera, palm, organic-wave, zebra, line-scene), `PatternFamily` 11, `MotifFamilyId` 8, `BackgroundTreatment` 5, 8 kompozisyon niyeti, `graphicLibrary/` **1.642 satır** (heroes, motifs, patterns, compositions, primitives), `artwork/heroes/` 11 işaret. `grep` ile doğrulandı: `src/engine/studio/` altında `graphicLibrary` ya da `artwork/heroes` importu **yok**.

---

## 3. Referans kataloğu — `C:\Users\Admin\Desktop\TASARIM REF` (31 JPG)

Dağılım: 15 karton (KUTU), 4 parfüm, 1 şarap, 11 etiket (STİCKER). Her satır görselden okundu; "→" kısmı bu motorun diline çevirisidir. Referanslar **referans olarak kalır**; hiçbir dosya çalışma zamanına girmez.

| ID | Dosya | Ürün / sektör | Kompozisyon | Tipografi davranışı | Grafik dili | Renk | Boşluk | Varlık ilişkisi |
|---|---|---|---|---|---|---|---|---|
| R01 | KUTUREF1 | "The Majestic" — içki kartonu | Gravür tavus **sol kenardan taşıyor ve kıvrımı geçiyor**; marka **90° döndürülmüş** dikey; yan panelde altın ogee/tüy deseni; arkada küçük madalyon | yüksek kontrast serif display + el yazısı "The" + aralıklı küçük kapital meta | gravür hayvan + geometrik ogee deseni | krem / bronz / altın yaldız | ferah | hero kıvrımı geçiyor; desen ikinci alan |
| R02 | KUTU REF 2 | "Berry Bliss" — gıda (peynir bar) | Lacivert/krem **dönüşümlü düz/desenli paneller**; sıkıştırılmış serif "BERRY BLISS" istif; yan panelde döndürülmüş slogan; yuvarlak rozet piktogramlar; arkada besin tablosu | condensed serif display + el yazısı vurgu + küçük sans | malzeme illüstrasyonu (yabanmersini) serpme + ton-üstü-ton dalgalı şekiller | duotone lacivert/krem | orta-yoğun | panel dönüşümü; serpme desen |
| R03 | KUTU REF 3 | Matka "Jasmine & Rosehip" — temizleyici | Kırık beyaz; **tek kahverengi sanat paneli** (makro organik beyaz çizgi formları + benek); oval çizgi mark; serif başlık; **4 ikonlu dikey kolon**; çok küçük metin | hafif serif başlık; küçük sans gövde | soyut organik makro form | krem/kahve duotone | **aşırı boşluk** | sanat tek panele hapsedilmiş |
| R04 | KUTU REF4 | Matka "Golden Radiance" — yağ | R03'ün **açık/koyu tersi**: koyu kahve zemin, krem yaprak deseni paneli, geometrik sans başlık, aynı ikon kolonu | geometrik sans (aynı marka, farklı yüz) | stilize yaprak deseni | koyu duotone | ferah | R03 ile **sistem**: zemin tersi + panel sanatı değişimi |
| R05 | KUTU REF 5 | Dr. Sebaa "Elixir" — serum/yağ | Yoğun siyah-beyaz gravür (çiçek, kedi, ağaç) **tüm panellerde tam taşma**; ortadan geçen **pudra "kemer" bandı** metni taşıyor; yan panelde döndürülmüş marka; imza | küçük serif + aralıklı kapital; imza script | gravür, yoğun, botanik + hayvan | siyah/beyaz + pudra | **yoğun** | sanat çevreliyor; bant kesiyor |
| R06 | KUTU REF6 | "Sola" — krem | Toile-de-Jouy mavi-gri gravür kıvrımlı çiçek **tam taşma**; üstte monogram; ligatürlü serif wordmark; neredeyse hiyerarşi yok | sessiz serif wordmark (ligatür) | miras gravür / toile | krem üstü tek mavi | desen yoğun, tip seyrek | desen zemin, tip üstünde yüzüyor |
| R07 | KUTU REF7 | "Lunara" — gece serumu | Beyaz kutu, **lacivert ön panel**; laciverte çizgi botanik + **gök cisimleri (ay evreleri, yıldız)** iki yan panelde **ayna simetrik**; altın halka mark; ay evresi ikonları | geometrik sans wordmark + ince serif ürün | çizgi botanik + **celestial** | beyaz/lacivert/altın | ferah | koyu ön, aynalı kanatlar |
| R08 | KUTU REF8 | "Blossome" — şampuan karton + şişe | Krem üst, koyu petrol **alt bant (~70/30 yatay bölme)**; yasemin tutan kadın illüstrasyonu **bölmeyi at biniyor**; script slogan; serif başlık; piktogram sırası; **şişe etiketi kartonu aynalıyor** | serif başlık + italik/script slogan | **figüratif (insan)** + botanik, boyamsı | krem/petrol/şeftali | orta | hero bandı at biniyor; karton+etiket tek sistem |
| R09 | KUTU REF9 | "Amora" — göz güneş kremi | Açık mavi düz paneller; **siyah-beyaz fotoğraf yüz** kırpımı; **aşırı büyük döndürülmüş wordmark fotoğrafın üstünden geçiyor** | yüksek kontrast serif, aşırı büyük, döndürülmüş | fotoğraf (vektör dışı) | açık mavi + mono foto | ferah | tip hero'nun üstüne biniyor |
| R10 | KUTU REF10 | "OILY" — kas yağı | Asit sarı-yeşil; iki panelde fotoğraf yüz; **siyah/sarı sıvı blob** şekiller panelleri geçiyor; **ağır grotesk "MUSCLE OIL" sol üst**; küçük malzeme metni | heavy grotesk blok + küçük sans | soyut sıvı blob | neon mono | grafik-yoğun | blob panel geçiyor |
| R11 | KUTU REF11 | "Xfacio Labs" — serum | Siyah; beyaz **çizgi şişe silüeti** önde; **döndürülmüş marka tüm bir panel**; ince sans, geniş aralık; "BIOPHOTONIC GLASS" | hafif geometrik sans, uzatılmış aralık | çizgi ürün silüeti | siyah/beyaz | ferah | döndürülmüş marka paneli |
| R12 | KUTU REF 12 | "Ritual Atelier de Parfums" | Gümüş + pudra mavi; yan panellerde **kabartma** zırh/şövalye çizgi çizimi; önde kask kabartması; "RITUAL" sans; imza | sans + imza script | çizgi çizim, şövalye/heraldik; **kabartma** | metalik-mat kontrast | ferah | anlatı çizimi iki yan panele yayılıyor |
| R13 | KUTU REF13 | "Little Candle Co." — mum | Pembe; **tekrar eden ikon deseni** (mum, alev, şimşek, çiçek, pırıltı) siyah; retro display logo; LC monogram | retro display / script logo | piktogram deseni (düz) | pembe üstü siyah | desen yoğun | her yerde desen + ortada rozet |
| R14 | KUTU REF 14 | Youth To The People "Kale + Green Tea" | Beyaz; **renkli karakter illüstrasyonları her paneli geçiyor**; condensed sans kapital istif; madalyon logo; çok dilli iddialar | condensed sans caps istif | **figüratif karakter**, düz renk | doygun çok renk | yoğun-oyuncu | illüstrasyon sarmalıyor |
| R15 | kutu ref 15 | "Mellis Florae" — EDT | Pembe/sarı; dev **organik blob** panelleri kesiyor; retro yuvarlak-geniş sans; **döndürülmüş aşırı büyük "FLORAE"** yan panel; papatya ikonları | extended/rounded retro sans, aşırı büyük, döndürülmüş | soyut organik blob | iki ton yüksek doygunluk | grafik | blob alan + döndürülmüş marka |
| R16 | PARFUMREF1 | "SYLOVE" — 6 SKU'luk seri | Her SKU farklı düz zemin; **gravür kolaj** (hayvan, bitki, mitolojik figür) ton-üstü-ton **kemer çerçeve** içinde; sabit üst wordmark; **yan döndürülmüş "MYTH / LOVESTORY"**; italik serif + CJK ürün; küçük mühür | serif wordmark + italik serif ürün + aralıklı kapital | gravür kolaj: hayvan + botanik + figür | 6 düz zemin, mono gravür | yoğun | **seri DNA'sı**: iskelet sabit, zemin rengi + özne değişir |
| R17 | PARFUMREF2 | "Roselle" — Jamaika çiçeği şarabı etiketi | Kemer tepe; krem; şarap kırmızısı **gravür hibiskus hero** ortada-altta, arkada **soluk gravür manzara**; dev yüksek kontrast serif "ROSELLE"; katmanlı küçük kapital + fleuron; madalyon; **koyu kırmızı alt bant** spec tablosuyla (hacim/alkol/lot) | yüksek kontrast serif, aşırı büyük + katmanlı küçük kapital | gravür botanik + soluk gravür sahne | krem/şarap/altın saç teli | orta | katmanlı başlık + özne + **spec bandı** |
| R18 | PARFUM REF3 | LOEWE — 6 SKU | Kırık beyaz; ortada **siyah-beyaz botanik özne** (fotoğraf); serif "LOEWE" + varyant adı; ayakta minicik meta | serif wordmark; aralıklı küçük meta | özne (foto; vektörde gravür özne) | mono | **aşırı boşluk** | mevcut `specimen-hero`'nun birebir doğrulaması |
| R19 | PARFUM REF4 | "POES Interlude" — parfüm karton + şişe | Beyaz; **ligatürlü kontrastlı display serif "POES"**; gri **iç dikdörtgen sanat kartı** içinde çizgi şakayık; küçük aralıklı kapital; şişede beyaz kart | ekspresif display serif (ligatür) | çizgi botanik, tek özne | mono + amber | ferah | wordmark + **iç sanat kartı** |
| R20 | VINEREF1 | "Don José" — pisco etiketi | Kemer tepe; krem; **asma çelengi içinde DJ monogram** üstte; katmanlı küçük kapital; dev serif "Don José" altın kenarlı; **gravür manzara** (bağ, hacienda, dağ); madalyon; **siyah alt bant** spec + üretici plaketi | yüksek kontrast serif + katmanlı kapital | gravür manzara + monogram çelenk + heraldik | krem/siyah/altın | orta | monogram taç + katman + sahne + spec bandı |
| R21 | SİTCKER REF5 | Ahtapot konservesi (RU) — gıda | Siyah; **yuvarlak çıkıntılı kesim**; üç büyük gri gravür ahtapot alanı dolduruyor; kırmızı rozet; condensed sans + script; arka aynı sistem | condensed sans + script | gravür hayvan | siyah/gri/kırmızı vurgu | yoğun | tam alan özne kümesi + kesim şekli |
| R22 | STİCKER REF6 | NOMA kombucha — 2 SKU | Beyaz sarma; **psikedelik aynalı mantar/mercan** pembe-mavi gradyan; ekspresif wordmark; serif meta; **spec hücreleri**; yan besin; döndürülmüş iddialar | ekspresif/blackletter wordmark + serif | sürreal organik, **ayna simetrik** | beyaz + doygun gradyan | orta | özne SKU başına değişir |
| R23 | STİCKER REF7 | "MOU:" — sebze, 5 SKU | Krem; **dev düz tek renk silüet** (pancar, mantar, zeytin, şalgam, karnabahar) etiketi dolduruyor; kalın sans "MOU:"; küçük metin ızgarası | heavy grotesk + küçük grotesk ızgara | **düz silüet** | SKU başına bir vurgu rengi | grafik | **seri DNA'sı**: silüet + renk SKU'ya göre |
| R24 | STİCKER REF8 | "Bloom coffee" — 3 SKU | Pastel; **yumuşak gradyan blob çiçek** etiket kenarını **taşıyor**; script / heavy sans dönüşümlü; küçük besin | script ↔ heavy sans | gradyan blob | pastel/gradyan | ferah | hero kesim kenarını kırıyor |
| R25 | STİCKER REF9 | "Pure Bloom" — krem, 3 SKU | Yatay; krem üst alan ton-üstü-ton yaprak silüetleri; **yaprak ligatürlü serif wordmark**; dairesel metin mührü; **alt renk bandı** (yeşil/zeytin/ten SKU'ya göre) ürün adı + barkod | ekspresif serif wordmark + hafif aralıklı sans | ince yaprak silüetleri | SKU başına bant rengi | orta | **iki bantlı yatay bölme**, bant rengi seriyi taşıyor |
| R26 | STİCKER REF 10 | "FORÊT" — botanik soda | Yatay sarma; **aşırı büyük döndürülmüş condensed serif "FORÊT"** solda; **düz kesme-kağıt yaprak kümesi** (petrol) + sarı nokta; **monospace** gövde ızgarası; ikon sırası; sertifika işaretleri; imza | condensed serif display + monospace gövde | düz kesme-kağıt botanik | beyaz/petrol/sarı/siyah | orta | döndürülmüş display + düz hero + tip ızgarası |
| R27 | STİCCKER REF11 | "The Pickle Pantry" — 3 SKU | Yeşil zeminler (SKU'ya göre); **kamuflaj blob** ton-üstü-ton alan; yuvarlak kalın display; **karikatür turşu maskot**; tat rozeti; besin paneli | rounded bold display | maskot + blob | SKU başına zemin | orta | maskot + rozet + blob alan |
| R28 | STİCKER REF 12 | "Pure Life" — zeytinyağı sarma | Beyaz üst / zeytin alt **yatay bölme**; **gravür zeytin dalı bölmeyi at biniyor**; hafif serif "Pure LIFE"; sağ panelde **döndürülmüş hafif serif "Olive Oil"**; ikon sırası; sol panelde besin | hafif serif + döndürülmüş serif | gravür botanik | beyaz/zeytin | ferah | iki bant + at binen hero + döndürülmüş ürün adı |
| R29 | STİCKER REF 13 | 8 siyah/altın zeytinyağı etiketi (stok) | Siyah ya da beyaz alan; **altın çift çerçeve, farklı kesim silüetleri** (kemer, kalkan, kartuş); altın gravür zeytin dalı; serif kapital; **kurdele bantlar** "EXTRA VIRGIN"; defne, yıldız, taç | serif kapital, katmanlı; script alt satır | heraldik/süs + gravür dal | siyah/altın, beyaz/altın | orta | çerçeveli kartuş + kurdele bandı |
| R30 | STİCKER REF 14 | 4 yeşil/altın zeytinyağı etiketi | Koyu yeşil; altın; uzun dikey; **üstte madalyon** (ağaç, damla); script "Olive Oil" + aralıklı kapital; yıldız sırası; **kurdele bandı**; altın saç teli çerçeve; "100% BIO" rozet | script + aralıklı kapital | heraldik + gravür dal | yeşil/altın | orta | madalyon taç + istif + bant |
| R31 | STİCKER REF 15 | "O'live" — zeytinyağı | Siyah; **büyük düz gri zeytin dalı silüeti** altta; küçük marka dalında sarı vurgu; kesme işaretli serif marka; aralıklı kapital; arkada besin | serif marka + aralıklı kapital | düz silüet botanik | siyah/gri/sarı | orta | ayakta aşırı büyük silüet, marka sol üst |

### 3.0 Sahip kararları (2026-09-18, "hepsini onaylıyorum")

| Karar | Sonuç |
|---|---|
| R17/R20 gravür manzara | **kapalı kalır** (F-13 kararı geçerli) |
| R12 kabartma | **alınmaz**; yan panellere yayılan anlatı çizimi fikri alınır |
| İllüstrasyon yolu | **ikisi birden**: parametrik `subjectHero` + küratörlü tek-mürekkep vektör kütüphane (lisanslı / kamu malı; brief'in rengini giyer) |
| Faz 3 golden hareketi | kabul — oynayan yüzler sahibe gösterilip onayla güncellenir |
| Özne sığdırma (Faz 2B bulgusu) | **onaylandı ve uygulandı 2026-09-19 (F-30)** — `paintSpecimenHeroFace` ve `lineScene` artık `fitSubject` ile ölçülen erişime sığdırıyor. İki specimen golden'ı oynadı (`07-bebek-kutu`, `07-bebek-etiket`); önce/sonra tarayıcıda ölçüldü: etikette özne MİA, BEBEK BAKIM, Soft ve SOFT CARE satırlarına 0.4–4.6 mm giriyordu, sonra 0 örtüşme. Hash'ler yenilendi |
| Faz sırası (§9) | onaylandı; Faz 0 başladı |
| **İkinci repertuar** (2026-09-19) | **onaylandı ve uygulandı (F-32)** — sahip: "8 tasarım yönü hiç değişmiyor, 31 referansın tamamını yeni DNA olarak yapalım, 8 öneriye ek olarak yeni tasarımlar çıksın… önizlemede 'tasarımları değiştir' butonu". Sekiz yeni arketip (`refArchetypes.ts`), ayrı repertuar; mevcut on sistem ve 18 donmuş yüz dokunulmadı. **Referans pikselleri alınmadı** — alınan şey gramer: kompozisyon, panel rolü, oran, renk ilişkisi, varlık ilişkisi. Sahibin kendi kuralı (§3, "referanslar referans olarak kalır; hiçbir dosya çalışma zamanına girmez") ve telif gereği; marka adını kaldırmak sanat çalışmasını serbest bırakmıyor |

### 3.0.1 İkinci repertuar — hangi referans hangi iskelete gitti (F-32)

| Aile | Referans | Yeni olan iskelet (on sistemde karşılığı yok) |
|---|---|---|
| kemer taç (`arch-crown`) | R17, R20 | kemer tepe + madalyon taç + katmanlı kapital satırlar + **ayakta künye bandı** |
| gravür kolaj (`collage-plate`) | R16, R05 | sabit marka + **ton-üstü-ton kemer pencere** içinde özne + yandan döndürülmüş kelime + mühür |
| düz silüet (`silhouette-foot`) | R31, R23 | küçük marka bloğu + **alt yarıyı dolduran, kenarlardan taşan tek renk silüet** |
| kurdele arma (`ribbon-crest`) | R29, R30 | **kesim silüetli çift çerçeve** (kemer / kalkan / kartuş) + madalyon + yıldız sırası + **kurdele bandı** |
| mono ızgara (`grid-mono`) | R26 | döndürülmüş dev dar başlık + düz kesme-kağıt özne + **monospace gövde ızgarası** + ikon sırası |
| desen zemin (`pattern-float`) | R06, R13 | **tam taşma desen**, tip küçük sessiz plakada yüzüyor, neredeyse hiyerarşi yok |
| asit blob (`blob-acid`) | R10, R15 | iki loud renk + **yüzü kesen dev blob** + köşeye sıkışmış ağır grotesk blok |
| iç sanat kartı (`inner-card`) | R19, R03 | **içeri gömülü sanat kartı** (zeminden bir ton koyu) + dikey ikon kolonu |

Kapsam dışı bırakılanlar değişmedi: maskot / insan figürü (R08, R14), fotoğraf (R09, R10, R18), kabartma (R12), gravür manzara (R17/R20 sahne katmanı), şişe silüeti (R11) — §3.1.

### 3.1 Sahip kurallarıyla çelişen referanslar (karar gerekir, kod değil)

| Referans | Çelişki | Öneri |
|---|---|---|
| R12 | **kabartma** — sahip kuralı: kabartma/rölyef yok | Kabartmayı almayın; alınacak DNA "iki yan panele yayılan anlatı çizgi çizimi" ve "metalik-mat panel kontrastı" (mat/parlak lak farkı, print-side bilgi olarak) |
| R17, R20 | **gravür manzara** — F-13'te manzara kaldırıldı | Buradaki manzara hero değil, *soluk arka sahne* (R17) ya da *miras gravürü* (R20). Sahip kararı: (a) kapalı kalsın, (b) yalnız "heritage engraving" ailesinde, düşük yoğunlukta, özne arkasında izin verilsin. Bu audit (a) varsayıyor |
| R11 | **şişe silüeti** — kit yolunda sahip vetosu (`remapBannedHero`: bottle silhouettes never paint) | Vetoyu stüdyoya da uygulayın; alınacak DNA "döndürülmüş marka paneli" |
| R09, R10, R18 | **fotoğraf** | Vektör motoru için kapsam dışı; alınacak DNA R09'dan "aşırı büyük döndürülmüş tip hero'nun üstüne biniyor", R10'dan "blob + grotesk", R18'den mevcut `specimen-hero` |
| R08, R14 | **insan figürü / karakter** | Parametrik vektörle inandırıcı insan figürü bu motorun ölçeğinde gerçekçi değil; **almayın**. Alınacak DNA: yatay bant bölmesi (R08), sarmalayan illüstrasyon fikri (R14 → düz silüet/blob ile) |

---

## 4. DNA çıkarımı — 31 referansın ortak dili

Aşağıdaki her satır en az iki referansta görüldü; tek örnekler §3'te kaldı.

### 4.1 Kompozisyon DNA'sı

| DNA | Referanslar | Mevcut karşılık |
|---|---|---|
| Stacked-center masthead (üstte marka, altta ürün, ayakta meta) | R17, R18, R20, R29, R30 | **VAR** — `stacked-center` (16/20 arketip) |
| **Kenardan taşan hero, kıvrımı geçiyor** | R01, R05, R10, R14, R15 | YOK — her ressam paneline kırpılı; panel-ötesi süreklilik yok |
| **Döndürülmüş dikey marka / ürün adı birincil öğe** | R01, R09, R11, R15, R26, R28 (yan: R02, R05, R16) | YOK — döndürme yalnız spine `manifesto` kelimelerinde |
| **Yatay iki bant bölmesi, hero bölmeyi at biniyor** | R08, R25, R28 | YOK |
| **Kemer bandı** — tam taşma sanatın üstünden geçen tip bandı | R05 | YOK (bant ailesinin varyantı) |
| **Tek sanat paneli + sessiz tip paneli** | R03, R04 | YOK — `secondaryField` her yanı aynı zeminle boyar; "hangi yan sanat" kararı yok |
| **Aynalı kanatlar** — düz ön, iki yanda simetrik illüstrasyon | R07, R22 | YOK |
| **Kemer/pencere çerçevesi içinde kolaj, sabit üst wordmark** | R16 | ZAYIF — `crest-panel` roundel; pencere yok |
| **Spec bandı ayakta** (hacim/alkol/lot tablosu, üretici plaketi) | R17, R20, R21, R22 | ZAYIF — `volumeLine` var; tablo bandı yok |
| **Aşırı büyük düz silüet alanı dolduruyor** | R23, R31 | YOK |
| **İç sanat kartı** (sanat kartta, tip alanda) | R19 | ZAYIF — `card-on-art` tersi (tip kartta, sanat alanda) |
| **Düz/desenli dönüşümlü paneller** | R02, R07 | ZAYIF — `SPINE_FIELD` yalnız 2 arketipte farklı zemin; dönüşüm kuralı yok |
| **Sol üst blok başlık + alt meta** (`top-left-block`) | R10, R31 | YOK — `left-column` yakın ama kolon, blok değil |
| **Monogram taç + katmanlı başlık** | R20, R30 | ZAYIF — `atelier-plate` katmanlar, `crest-panel` roundel; monogram çelengi yok |

### 4.2 Tipografi DNA'sı (font adı değil, davranış)

| Davranış | Referanslar | Mevcut |
|---|---|---|
| serif display + sans meta | R17, R18, R20, R29 | **VAR** `serif-display/sans-meta` |
| script vurgu + heavy sans | R02, R24, R30 | **VAR** `script-accent/sans-heavy` |
| light + heavy sans | R04, R11 | **VAR** `sans-light/sans-heavy` |
| aralıklı serif + aralıklı sans | R19, R28 | **VAR** `spaced-serif/spaced-sans` |
| **yüksek kontrast display serif, aşırı büyük** | R01, R09, R17, R20 | ZAYIF — Cormorant 700 en yakın; "aşırı büyük" ölçek davranışı yok (`titleScale` kullanıcı kolu) |
| **condensed display** (serif R02/R26, sans R14) | R02, R14, R26 | YOK — condensed yüz gömülü değil |
| **ekspresif display serif, ligatür** | R19, R25 | YOK |
| **heavy grotesk blok** | R10, R23 | ZAYIF — Montserrat 700; blok davranışı (sol üst, sıkı satır) yok |
| **rounded / retro display** | R13, R15, R27 | YOK |
| **hafif geometrik sans, çok geniş aralık** | R11, R04 | ZAYIF — `sans-light` + tracking; "çok geniş" ölçüsü yok |
| **monospace gövde** | R26 | ZAYIF — `mono` yığın var, gömülü yüz yok (export'ta outline alınamaz) |
| **döndürme bir davranış olarak** | 9 referans | YOK (§4.1) |
| ekspresif wordmark (blackletter) | R22 | YOK — markaya özel; **almayın** (logo işi) |

### 4.3 Grafik DNA'sı

| Dil | Referanslar | Mevcut |
|---|---|---|
| botanik özne (gravür/düz) | R05, R06, R17, R18, R19, R28, R29, R30 | **VAR** `species` 16 tür, `engraved`/`solid` |
| **gravür hayvan** | R01 (tavus), R05 (kedi), R16 (tavşan vd.), R21 (ahtapot) | **VAR** ✅ 2026-09-19 — `creatures.ts` sınırlı küme (kuş, balık, arı, geyik), dört çizim modunda, ürünün kendisinden yönlendirilir (F-33) |
| **miras gravür / toile tam taşma deseni** | R06, (R16 kolaj) | YOK — `botanical` zemin ton-üstü-ton dal; toile değil |
| **celestial çizgi** (ay evresi, yıldız, güneş) | R07, R16 (güneş) | YOK |
| **düz silüet** (tek renk, büyük) | R23, R25, R31 | YOK |
| **kesme-kağıt düz botanik** | R26 | YOK (species `solid` yakın ama sprig ölçeğinde) |
| **organik blob alanı** | R10, R15, R24, R27 | YOK |
| **piktogram tekrar deseni** | R13 | YOK — 12 fayda ikonu var, desen olarak dizilmiyor |
| **ogee / tüy geometrik deseni** | R01 | ZAYIF — `arabesque` kafes var; ogee yok |
| **heraldik çerçeve üyeleri**: kesim silüetli çift çerçeve, **kurdele bandı**, defne, taç, madalyon | R29, R30, R20 | ZAYIF — `thin-double`, `fleuron-crown`, `band-hairline`, roundel var; kurdele/kesim silüeti/defne yok |
| maskot / karakter / insan figürü | R08, R14, R27 | YOK — **kapsam dışı** (§3.1) |
| fotoğraf | R09, R10, R18 | kapsam dışı |
| gravür sahne | R17, R20 | kaldırılmış (F-13) — sahip kararı |

### 4.4 Renk DNA'sı

| DNA | Referanslar | Mevcut |
|---|---|---|
| brief renginden palet, mizaç işlemi | — | **VAR** `paletteFromBrief` × 6 mizaç, `deep` yüzey, akromatik koruma |
| **SKU başına düz zemin rengi, iskelet sabit (seri)** | R16, R23, R25, R27, R24 | YOK — `lineSeed` kompozisyonu seri boyunca sabitler ama **rengi SKU'ya göre yürütmez** |
| duotone (iki renk, ton-üstü-ton) | R03, R04, R06, R31 | ZAYIF — `vivid-mono` yakın; duotone açık bir işlem değil |
| neon / asit mono | R10 | YOK (istenirse mizaç: `acid-mono`) |
| iki ton yüksek doygunluk | R15 | YOK |
| metalik-mat panel kontrastı | R12 | YOK (baskı yüzü bilgisi; §3.1) |

### 4.5 Boşluk DNA'sı

aşırı boşluk (R03, R11, R18) · ferah (R01, R07, R19, R24, R28) · orta (çoğu) · desen-yoğun (R05, R06, R13, R14) · grafik-yoğun (R10, R15). Mevcut: `ornament` 3 seviye zemin yoğunluğunu ölçekliyor; **tip yoğunluğu / kaplama oranı** bir karar değil (`negativeSpace` plan'da var, stüdyo okumuyor).

### 4.6 Varlık ilişkisi DNA'sı

kıvrımı geçme (yeni) · bandı at binme (yeni) · aynalı kanat (yeni) · çevreleyen sanat + kesen bant (yeni) · tek panele hapsolmuş sanat (yeni) · iç kart (yeni) · tip hero'nun üstüne biniyor (R09, yeni) · kesim kenarını kırma (R24, yeni) · ton-üstü-ton silüet tip altında (R25 — **var**, `botanical` zemin) · desen zemin, tip yüzüyor (R06, R13 — zayıf).

### 4.7 Ambalaj (karton) DNA'sı — panel rolleri

Referanslarda görülen yan panel rolleri: sanat paneli (R03/R04), desen paneli (R01), düz blok (R02, R07), döndürülmüş marka paneli (R11, R15), aynalı illüstrasyon (R07), anlatı çizimi (R12), kemerin devamı (R05), sarmalayan illüstrasyon (R14). Mevcut: her ikincil panel aynı `secondaryField` + rol başına yoğunluk. **"Bu yan ne taşır" bir karar değil.**

### 4.8 Etiket DNA'sı — biçim ve fiziksel bağlam

Görülen biçimler: kemer tepe kartuş (R17, R20), yuvarlak çıkıntılı kesim (R21), kesim silüetli çerçeve (R29), yatay sarma (R22, R23, R25, R26, R28), uzun dikey (R30), dikdörtgen (R31). Mevcut yapılar: düz, yuvarlak, oval, sarma, askı, kart. **Eksik:** kemer tepe kartuş, silüet kesimli çerçeve — bunlar `dielineStructures` işidir, ressam işi değil (§9, Faz 12).

### 4.9 Yapısal DNA önerisi (§17)

Tek dize değil, davranış demeti. Mevcut `ArchetypeDna` + `DesignDirection` bunun yarısını taşıyor; eksik alanlar **kalın**:

```ts
type StructuredDna = {
  composition: { lockup, band?: 'none'|'top'|'bottom'|'belt', rotation?: 'none'|'brand'|'product', bleed?: 'none'|'edge'|'fold', flanks?: 'none'|'mirrored'|'art-left'|'art-right', window?: boolean }
  typography:  { pairing, scale: 'normal'|'oversized', caseMode, trackingClass, faceClass: 'serif'|'display-serif'|'condensed'|'grotesk'|'rounded'|'mono'|'script' }
  graphicLanguage: 'texture' | 'botanical' | 'animal-engraved' | 'silhouette' | 'blob' | 'celestial' | 'pictogram' | 'cut-paper' | 'heritage-toile' | 'heraldic'
  spacing: 'extreme' | 'airy' | 'moderate' | 'dense'
  hierarchy: 'brand-first' (sabit — sahip kuralı)
  color: { treatment: Temperament | 'duotone' | 'acid-mono', rangeMode?: 'ground' | 'band' | 'subject' }
  framing: FrameStyle | 'ribbon-band' | 'die-cut-double' | 'medallion-crown'
  assetRelationship: 'confined' | 'crossing' | 'straddling' | 'surrounding' | 'flanking' | 'inset' | 'overlapping'
  density: OrnamentLevel
  packagingCompatibility: { surfaces: StudioSurface[], minFaceMm, needsSecondaryPanels: boolean }
}
```

En az değişiklikle entegrasyon: `ArchetypeDna`'ya `dna: Partial<StructuredDna>` eklemek (mevcut alanlar dokunulmaz; varyasyon 0 ilk girdiyi alır → golden sabit). Bkz. §9 Faz 2.

---

## 5. Mevcut DNA ile karşılaştırma — EXISTING / NEW / WEAK / REDUNDANT / MISSING

### 5.1 Referans DNA'ları → sınıf

| Sınıf | Öğeler |
|---|---|
| **EXISTING** (motor zaten yapıyor) | stacked-center masthead · 4 tip ikilisi · botanik özne (gravür/düz) · brief paleti × mizaç · `deep` ikincil yüzey · ton-üstü-ton silüet zemin · roundel + arabesk (crest) · üç katlı tip plakası (atelier) · ince çift çerçeve / fleuron / bant-saç teli · specimen-hero (R18 birebir) |
| **WEAK EXISTING** (var ama tek değer / karar değil) | `lockup` (tek değer, 16/20 aynı) · `variant` (13/20 ressam okumuyor) · spec bandı (`volumeLine` var, tablo yok) · dönüşümlü panel (`SPINE_FIELD` 2 arketip) · monogram taç · heavy grotesk (yüz var, blok davranışı yok) · mono (yığın var, gömülü yüz yok) · duotone (`vivid-mono` yakın) · heraldik çerçeve üyeleri (kurdele/defne/kesim yok) · ogee (arabesk kafes var) · `negativeSpace` (plan'da var, stüdyo okumuyor) |
| **NEW** (referans getiriyor, motor yok) | kenar/kıvrım taşması · döndürülmüş marka/ürün · yatay bant bölmesi + at binme · kemer bandı · tek sanat paneli · aynalı kanatlar · pencere çerçevesi kolaj · aşırı büyük düz silüet · iç sanat kartı · top-left blok · gravür hayvan · miras toile · celestial · düz silüet · kesme-kağıt · organik blob · piktogram deseni · condensed display · ekspresif serif (ligatür) · rounded/retro display · **SKU başına renk serisi** · panel rolü ataması |
| **MISSING & OUT OF SCOPE** | insan figürü, maskot, fotoğraf, kabartma, gravür manzara (sahip kararı), blackletter wordmark |

### 5.2 Mevcut sistemin kendi içinde REDUNDANT olanları

Bunlar "aynı mantık farklı isimle" durumları; **yeni eklemeden önce** tekilleştirilmeleri gerekir, yoksa yeni DNA ikisine de eklenmek zorunda kalır:

| Çift | Durum | Öneri |
|---|---|---|
| `CompositionGrammar` 8 niyet ↔ `DesignDirection.lockup` 4 iskelet | iki kompozisyon sözlüğü; biri ölü | Stüdyo sözlüğü kazanır. Kit emekliye ayrılınca (Prompt 9) `CompositionGrammar` ya silinir ya da yeni `StructuredDna.composition`'ı üretir |
| `SectorVisualVocabulary.VOCAB` (kit hero/pattern adları) ↔ `referenceDna.sectors` | iki sektör-uyum tablosu; stüdyo yalnız ikinciyi okuyor | `VOCAB.typographyVoice`, `ornamentLevel`, `forbiddenMotifs` alanlarını `ArchetypeDna`'ya taşı; kalanı kit ile gider |
| `VariationRecipes` ↔ `varyFace / pickAxis / variant` | iki varyasyon sistemi | Stüdyo sistemi kalır; `variant`'ı gerçek yap (Faz 2) |
| `moodPriors` ↔ `MOOD_WALK_OFFSET` + `temperamentFor` | iki ruh hali sistemi | Stüdyo kalır |
| `DesignMemory.lastFamilies` ↔ `lineSeed` / teklif aile-tekilliği | iki anti-tekrar | Stüdyo kalır |
| `HeroFamily` 12 + `graphicLibrary` 1.642 satır ↔ `species` | iki çizici havuzu; kit ulaşılamaz | **Kit kütüphanesindeki `crest`, `seal`, `harvest`, `emblem`, `tech`, `monstera`, `palm` işaretleri** stüdyo çizici sözleşmesine (`(w,h,pal,seed,opts) → svg`) taşınabilir mi diye Faz 5'te tek tek bakılır; taşınmayan silinir |
| `ink` ↔ `dark-luxe` ↔ `atelier` ↔ `crest` ↔ `noir-plate` | beş koyu/lüks parfüm dili, hepsi `stacked-center` | Redundant değil (sahip seçti, zeminleri farklı) ama **altıncı bir koyu parfüm ailesi eklemeyin**; parfüm için yeni değer kompozisyondan gelmeli (döndürülmüş marka, pencere kolaj, iç kart) |
| `line-scene` (F-13 sonrası sprig + çizgi) ↔ `specimen-hero` | ikisi de "özne + sessiz alan" | Yakın; `line-scene` klinik tip davranışıyla ayrışıyor. İzleyin; yeni `celestial` dili `line-scene`'e eklenirse ayrım netleşir |

---

## 6. Darboğaz analizi (§28)

Her biri: KÖK NEDEN → MEVCUT → EKSİK YETENEK → ÖNERİLEN GENİŞLEME → TEST.

### 6.1 Botanik illüstrasyon

- **Kök neden:** `speciesHero` motorun tek özne çizicisi; `Species` birliği bitki; zeminler doku.
- **Mevcut:** 16 tür, 7 düzen, 2 stil, 6 çiçek tipi; `lineSeed` ile seri tutarlılığı; `engraved` stil gravür tarama yapıyor.
- **Eksik:** özne sınıfları — hayvan (gravür), düz silüet, blob, celestial, piktogram deseni, kesme-kağıt, toile.
- **Öneri:** `species.ts` sözleşmesini genelleştir: `subjectHero(kind, w, h, pal, seed, opts)`; `kind` ∈ {plant(species), silhouette(shape), blob(seed), celestial(set), pictogram(set), cutpaper(shape)}. Gravür hayvan **sınırlı küme** (kuş, balık/ahtapot, arı, geyik) parametrik çizgi olarak; kalite eşiği: gravür stilinde `species`'in mevcut tarama motoru yeniden kullanılır. İnsan figürü **yok**.
- **Test:** golden 0 hareket; her yeni özne için `refPlates`-benzeri fikstür; `speciesHero.test` kardeşi; ledger sıfır çarpışma; `outlineText` etkilenmez.

### 6.2 4 tip ikilisi

- **Kök neden:** `TypePairing` 4 üyeli birlik; `FACE_STACK` 3 aile; `text.ts:239` switch; DNA listelerinde ilk giriş donmuş.
- **Mevcut:** Cormorant 4 yüz, Montserrat 3, Great Vibes 1 (gömülü, outline'lı); `titleScale` kullanıcı kolu; tracking sabitleri ikiliye göre.
- **Eksik:** condensed, extended/rounded, mono (gömülü), ekspresif display; **davranışlar**: aşırı büyük ölçek, döndürme, blok dizgi, aşırı aralık.
- **Öneri:** "100 font değil, 100 davranış": `TypeSystem = { display: FaceClass, secondary: FaceClass, scaleRatio, trackingClass, caseMode, rotation, weightContrast }`. 3–4 yeni gömülü yüz (bir condensed serif, bir condensed grotesk, bir rounded/extended, bir mono) + `build-font-outlines.py` ile outline. Mevcut 4 ikili aynen kalır (golden); yeni sistemler DNA listelerine **sona** eklenir; seçim marka kişiliğinden (Faz 3) gelir.
- **Test:** teslim SVG'de `<text>` 0 (outline sözleşmesi); `typeMetrics` baskı tabanı 1.5 mm; varyasyon 0 hash sabit; bir brief sweep'inde ≥8 farklı tip davranışı ölçülür.

### 6.3 copyBank

- **Kök neden:** `Bank` sektör × dil; tek slogan/kategori/hikâye; `resolveStudioCopy` brief boşsa bankayı alıyor.
- **Mevcut:** 10 × 2 × (1+1+1+2+4+3+3).
- **Eksik:** kişilik/kitle/katman/altürün boyutları; **metin uzunluğu → kompozisyon** ilişkisi (R23 "MOU:" 4 harf → aşırı büyük silüet + küçük tip; R26 "FORÊT" 5 harf → döndürülmüş aşırı büyük; R20 uzun hikâye → yoğun katman).
- **Öneri:** Prompt 7 planı + bir ek: `copyShape = { brandLen, productLen, hasStory, claimCount }` DNA seçicisine girer; `oversized` ve `rotation` yalnız kısa adlarda uygun; yoğun katman yalnız hikâye varsa.
- **Test:** aynı sektörde 20 brief → slogan tekrarı < %10 (planlı); kısa marka adı → aşırı büyük davranışı ≥1 aday.

### 6.4 Brief-bağımsız arketip seçimi — kesin tanım

- **Kök neden:** `scoreArchetype` = `sectorFit·0.22 + styleFit·0.35 + aspectFit·0.10 + tempFit·0.18 + intentFit·0.05 + productFamily + hintPin + veto + backgroundMismatch` (`direction.ts:402`). Girdiler: sektör, stil, yüz oranı, mizaç (stil + zemin koyuluğu), plan'ın 3 eksen niyeti, ürün kelimeleri. **Sıfır terim** şunları okuyor: `brandName`, `audience`, `channel`, `priceTier`, `feeling`, `avoidLike`, `story`, `references`, konumlandırma. `priceTier`/`feeling` yalnız **süs** seviyesine (`hintsFromBriefDepth`), `positioning` yalnız **çerçeveye** (`frameFromPlan`) gidiyor; `story` yalnız LLM art director'a gidiyor (kapalı; 400 karakter).
- **Mevcut:** görsel kelime pin'i (test edilmiş), sektör önceliği, mizaç yürüyüşü (6 ruh hali → 6 farklı iskelet), `variant` seed'inde marka adı var.
- **Ölçüldü** (6 sektör×ruh hali çifti; "Meridian — kurumsal, sakin zarif, butik" vs "Zapp — 18-25, gösterişli enerjik, mass"): **aynı arketip 6/6**, aynı `variant` 3/6, aynı çerçeve 6/6. İki marka arasındaki tek olası fark `variant` (0–2) — onu da 20 ressamın 13'ü okumuyor. Yani 20 arketipin 13'ünde iki rakip **birebir aynı yerleşimi** alıyor; fark metin ve (renk verdilerse) palet. Yan bulgu: kulaklık/modern çiftinde ikisi de `noir-stack` (parfüm iskeleti) aldı — `MOOD_WALK_OFFSET` indeks tabanlı olduğundan bugün kompozisyonu oynatan tek kol **ruh hali**, marka değil. (Süs bu ölçümde 6/6 aynı çünkü `inspectStudioDirection` derinlik ipucunu almıyor; üretim yolunda `priceTier` süsü oynatır — arketipi ve `variant`'ı yine oynatmaz.)
- **Eksik:** marka kişiliği → skor terimi; DNA'da kişilik uyumu; teklifte çeşitlilik kısıtı.
- **Öneri (DesignDirector'ı atmadan):** (1) `BrandPersonality` vektörü — brief'ten türetilen 5 eksen: `restraint` (sakin↔gösterişli), `warmth` (klinik↔sıcak), `energy` (durgun↔canlı), `heritage` (çağdaş↔miras), `technicality` (organik↔teknik). Kaynak alanlar: `feeling`, `audience`, `channel`, `priceTier`, `avoidLike`, `story`, `styleType`, marka adının biçimi. (2) `ArchetypeDna.personality: Partial<Record<Axis, number>>` — `sectors`/`styles` gibi. (3) `scoreArchetype`'a `personalityFit × 0.12` (ağırlık sweep ile; golden'a etkisi ölçülür — F-8'de `intentFit` 0.05 bir yüzü oynattı, burada da bir–iki yüz oynayabilir; kabul edilebilirse golden güncellenir, değilse ağırlık düşer). (4) Kişilik `variant`'ı da seçer, seed'i değil.
- **Test:** iki-marka süpürmesi: 15 sektör × 6 ruh hali × 2 zıt kişilik → en üst arketip farklı olan çift oranı (hedef ≥ %70; **bugün 6 çiftte %0**); aynı marka + aynı brief → kararlı.

### 6.5 Aday benzerliği

- **Ölçüldü** (3 brief, 8'er aday — eksen başına farklı değer sayısı): arketip **8**, zemin 6–8, çerçeve 5, tip ikilisi 3–4, lockup **2–3** (4'ten), **süs 1, mizaç 1, `variant` 1**. Yapısal sebep: 8 aday = 8 aile (`uniqueFamilyRows`) ama hepsi aynı mizaç/palet, varyasyon 0'da her eksen ilk giriş, 16/20 arketip stacked-center. Yani adaylar zemin, çerçeve ve tip yüzüyle ayrışıyor; **yerleşim, yoğunluk ve renk işlemiyle ayrışmıyor**.
- **Öneri:** aday parmak izi `{ lockup, band, rotation, typeClass, graphicLanguage, spacing, ornament }`; teklif seçici aile tekilliğine ek **parmak izi mesafesi** maksimize eder; mesafe < eşik → `NOT DISTINCT` işareti, loga yazılır. Süs ve mizaç adaylar arasında da yürüyebilmeli (mizaç için sahip kuralı: kullanıcının seçtiği ton pinlenmişse dokunulmaz).
- **Test:** referans brief'lerde 8 adayın ikili mesafe matrisi; bugün lockup+süs+mizaç+variant ekseninde çoğu çift 0 farklı → hedef her çiftte ≥2 eksen farklı.

---

## 7. Zincir doğrulamaları

### 7.1 DNA → Director → Composition → Typography → Asset → Painter → SVG (§18)

| Bağlantı | Durum | Kanıt |
|---|---|---|
| `ArchetypeDna` → `decideDirection` → `DesignDirection` | **KANITLI** | `directionAxes.test`: "every DNA row lists at least one legal value per axis", "variation 0 takes the first entry" |
| direction.archetype → ressam switch | **KANITLI** | `labelLayouts.ts:1237-1255`, `boxLayouts.ts:262-280` |
| direction.frame / ornament → yüz | **KANITLI** | `directionAxes.test`: "the painters draw the frame the direction chose", "the ornament level changes the face and the hierarchy does not move" |
| direction.typePairing → `text.ts` yüz + tracking | **KANITLI** | `text.ts:239-245` |
| direction.background → `paintBackground` | **KANITLI** | `backgrounds.ts:61` |
| `plan.composition.*` → yüz | **KOPUK** | `makeCtx` plan almıyor; ressamlar `d.*` okuyor (§1.1) |
| `plan.heroGraphic / patternSystem / illustrationSystem` → yüz | **KOPUK** | aynı |
| `vocab.typographyVoice` → yüz | **KOPUK** | hiç okunmuyor |
| `applyPlanToSystem` → yüz | **KOPUK** | stüdyo `system.wrapSeam/markRecipe/key` okuyor; plan türevi alanlar (`align`, `type.*`, `decor`, `director`) okunmuyor |

### 7.2 Knowledge → Decision → Render (§19)

- **Öğrenilen kural → yüz: KANITLI.** `learningGate.test` TEST 7–8 "approved knowledge changes a future independent generate (A/B)"; `craftGate.test` "a preferred frame, pairing or ornament becomes a hint and reaches the face".
- **İlke → karar: YAPISAL, CANLI DEĞİL.** `DESIGN_PRINCIPLES` (8) `principlesFor` ile plan'a etiket olarak yazılıyor; `critiquePlan.labelHint` ipuçlarını, `principleForRecommendation` öğrenilen kuralları ilkeyle etiketliyor. Örnek zincir "premium → kontrollü hiyerarşi → tek hero → hero en yüksek ağırlık": stüdyoda hiyerarşi ressamda **kodla sabit** (marka > ürün, `secondaryMax`), tek hero yapısal. Yani ilke *uygulanıyor* ama *danışılmıyor*. Bir "kural motoru" yok; olması da gerekmiyor — ilkeleri kodun sabitleri olarak tutmak sahip kuralını ("hiyerarşi gevşemez") daha iyi korur. Eksik olan, ilkenin **açıklama** olarak karara bağlanması (§10.M, structured reason).

### 7.3 Critique → Repair → Re-render → Critique (§21)

| Döngü | Stüdyoda | Kanıt |
|---|---|---|
| ledger (çarpışma/taşma) → `planStudioRepair` (title/logo scale) → yeniden boya → ledger karşılaştır → temizse tut | **GERÇEK**, 1 geçiş, monoton | `FormaLocalEngine.ts:303-309` |
| ledger > 0 → sonraki arketip ≤3 → temizse tut | **GERÇEK** | `:322-327` |
| craft < 50 → sonraki arketip ≤3 → daha yüksekse tut | **GERÇEK** | `:336-344`; `craftGate.test` |
| `critiquePlan` → `repairPlan` → yeniden boya | **YOK** (kit) | `:294` `needsRepair:false`, `:346` `!studioOn` |
| "typography hierarchy weak → increase title dominance" | **YOK** | `planStudioRepair` yalnız ölçek *küçültür* (çarpışma temizlemek için); güçlendirme deltası yok |
| vision critic → "önerini uygula" → parser → yeniden üret | **GERÇEK ama kullanıcı tetikli**, LLM kapalıyken yok | `studioCritic.ts` `vision` türü, `conversation.ts` critic-apply |

Yani döngü **geometri** için (sığma) ve **kaba bir zanaat tabanı** için var; **tasarım kalitesi bulguları** için (hiyerarşi zayıf, jenerik lüks, gürültü, odak yok) ne bulgu ne onarım var.

### 7.4 Değerlendirici — 12 tasarımcı sezgisi bugün neyi görüyor (§20, §32)

`scoreVisualCraft` kit yolunun işaretleme sözlüğü için yazılmış. **Ölçüldü** (3 stüdyo yüzü, `variationIndex 0`): craft 69–71; alt boyutlar hero 78–82, tipografi **84–87**, sektör 62–78, kompozisyon 64–68, hiyerarşi 65–77, dekorasyon **46–60**, özgünlük 60 (sabit). Sinyaller: `data-art="hero"` **görülüyor** (3/3), `displayFonts` regex'i 3/3 ateşliyor — ama Palatino/Garamond listesi stüdyo yığınındaki *fallback* adlarla (`'Cormorant Garamond'` → `Garamond`, `'Montserrat', 'Inter', 'Segoe UI'` → `Segoe UI`) **kazara** eşleştiği için; yani tipografi puanı her yüzde aynı +12'yi alıp doygunlaşıyor ve **ayırt etmiyor**. Kör olan boyut dekorasyon: `data-pattern=` 0/3, LIBRARY 0/3, `lockout-` 0/3 — stüdyonun zemin dokusu, çerçevesi ve süs seviyesi bu puana hiç girmiyor; puan yalnız opaklık sayımı + `geoDensity`'den geliyor. Bu yüzden goldenlar 57–76'da ve taban 50'ye çekildi: **değerlendirici stüdyonun en çok emek verdiği boyutu (zemin/süs) görmüyor, en az ayırt eden boyutu (tip) sabit yüksek puanlıyor**.

**Faz 0 tam tablo (18 golden, `measure-craft-distribution.ts`):** hero **28–92 (yayılım 64)** — `data-art="hero"` yalnız 7/18 yüzde; çizili özne taşımayan 11 yüz (mermer, noir, mürekkep, diyagonal, dalga, atölye, arma, kart) `scoreHero`'nun "hero gerekli ama yok" dalına düşüp 28 alıyor. Toplam puanın yayılımının (57–76) neredeyse tamamı bu tek kit-devri varsayımından geliyor: *her lüks/klasik yüzün bir kahraman grafiği olmalı*. Tipografi 80–88 (yayılım 8), özgünlük **60 sabit** (yayılım 0), dekorasyon 50–62. Faz 1'in ilk işi `scoreHero`'yu arketipin anatomisine göre okumak: zemin-öncülü bir arketipte "hero yok" bir bulgu değil, tasarımın kendisidir.

| Sezgi | Bugün | Nasıl |
|---|---|---|
| hierarchy conflict | kısmen | `geometryMetrics.fontContrast` + marka/ürün metni var mı |
| visual noise | kısmen | `densityPenalty(geo)` |
| weak focal point | **yok** | `dominantElementRatio` hesaplanıyor, bulguya dönmüyor |
| poor spacing | ledger kadar | çarpışma/taşma; ritim/hizalama yok |
| excessive decoration | zayıf | `scoreDecoration` kit imzaları; stüdyoda yalnız opaklık sayımı + `geoDensity` |
| generic luxury | **yok** | |
| repetitive composition | kit | `repetitionPenalty` kit hero ailesi |
| typography imbalance | zayıf, doygun | `font-weight` sayısı regex; yüz adı regex'i fallback'lerle her yüzde ateşliyor (84–87 sabit) |
| motif dominance | **yok** (metrik var) | `dominantElementRatio` |
| background conflict | **yok** | |
| insufficient contrast | önleme | `ensureAccentContrast` palet aşamasında; kritik değil |
| weak brand identity | **yok** | |

**Sonuç:** değerlendirici repertuar büyümeden **önce** stüdyo sözlüğünü öğrenmeli; yoksa yeni yüzler "hero yok, desen yok" diye puanlanır ve F-8 kapısı genişlemeyle savaşır (Faz 1).

---

## 8. Repertuar matrisi (§27)

| Boyut | Mevcut | Referans ekliyor | Eksik | Entegrasyon (dosya) |
|---|---|---|---|---|
| Composition | 4 lockup (16/20 stacked-center); `variant` 7/20 ressamda | bant bölmesi, kemer bandı, döndürülmüş marka, kenar/kıvrım taşması, aynalı kanat, sanat paneli, pencere kolaj, iç kart, aşırı silüet, top-left blok, spec bandı | `lockup` tercih listesi; `StructuredDna.composition`; panel rolü ataması | `types.ts` LockupStyle, `referenceDna.ts`, `labelLayouts.ts`/`boxLayouts.ts` (yeni yerleşimler), `panelField.ts` |
| Typography | 4 ikili, 3 aile / 8 yüz | condensed, ekspresif serif, rounded/extended, mono, aşırı büyük, döndürme, blok | `TypeSystem` davranış modeli; 3–4 gömülü yüz + outline | `text.ts`, `fontMetrics.json`, `fontOutlines.json`, `build-font-outlines.py`, `outlineText.ts` |
| Graphic language | 10 doku/geometri zemini | blob, piktogram deseni, ogee, toile, celestial | zemin aileleri | `backgrounds.ts`, `referenceDna.ts` BACKGROUND_KEYS |
| Illustration | 16 bitki × 7 düzen × 2 stil | gravür hayvan (sınırlı), düz silüet, kesme-kağıt, celestial set | `subjectHero` sözleşmesi | `species.ts` (genelleştirme), yeni `subjects.ts` |
| Motif | 12 fayda ikonu, fleuron, roundel | kurdele bandı, defne, taç, monogram çelengi, madalyon | çerçeve/süs üyeleri | `labelLayouts.ts` `paintFrame`, `referenceDna.ts` ALL_FRAMES |
| Background | 10 | +5 (blob, pictogram, ogee, toile, celestial-field) | | `backgrounds.ts` |
| Color | brief × 6 mizaç, deep | SKU serisi (zemin/bant/özne), duotone, acid-mono | `rangeMode` | `direction.ts` `lineSeed` yanına `rangeIndex`, `color.ts` |
| Spacing | 3 süs seviyesi (zemin) | aşırı boşluk / yoğun (tip + kaplama) | `spacing` kararı, `negativeSpace` stüdyoya | `direction.ts`, ressam kenar boşlukları |
| Hierarchy | marka > ürün sabit | (değişmez — sahip kuralı) | — | — |
| Asset relationship | confined (panele kırpılı), tone-on-tone | crossing, straddling, flanking, inset, overlapping, edge-breaking | panel-ötesi süreklilik (`composeStudioArtwork` panel başına boyuyor) | `composeStudioArtwork.ts` (komşu panel geometrisi), `svgGeometry.panelClip` |
| Packaging | ikincil zemin + yoğunluk | panel rolü (sanat/desen/düz/döndürülmüş/aynalı) | rol ataması kararı | `panelField.ts`, `boxLayouts.ts` |
| Label | düz/yuvarlak/oval/sarma/askı/kart | kemer kartuş, silüet kesim, çıkıntılı kesim | dieline yapıları | `dielineStructures.ts` (Faz 12) |

---

## 9. Uygulama planı — faz sırası ve gerekçe

Kullanıcının 0–13 sırası korunuyor; **dört yer değişikliği** ve gerekçesi:

1. **Değerlendirme (10) → Faz 1'e çekildi.** §7.4: kapı stüdyoyu görmüyor; repertuar büyümeden önce düzelmezse her yeni yüz cezalanır.
2. **Kompozisyon (6) → tipografi (4) ve grafik (5) önüne.** Sayısal en büyük boşluk kompozisyon (16/20 aynı iskelet, 8 ölü niyet) ve diğer ikisinin **taşıyıcısı**: döndürülmüş wordmark bir kompozisyon; kıvrımı geçen tavus bir kompozisyon. Ayrıca `variant`'ı gerçek yapmak golden'ı bozmadan (varyasyon 0) ucuz bir kazanım.
3. **Brief-aware director (7) kompozisyonun hemen ardına.** §29: repertuar + karar birlikte; seçici markayı okumadan yeni kompozisyonlar yalnız daha çok rastgele seçenek olur.
4. **Ambalaj panel rolü (12'nin karton kısmı) → Faz 2'ye katıldı**; etiket kesim biçimleri (dieline) ayrı ve sonda.

Her fazda: hedef · dokunulan dosyalar · ölçülebilir kontrol · golden kısıtı. Hiçbir faz kit yoluna dokunmaz (Prompt 9 onu kaldırır).

| Faz | İş | Ölçülebilir kontrol | Golden |
|---|---|---|---|
| **0 — Koruma + enstrümanlar** ✅ 2026-09-18 | `studio/fingerprint.ts` (8 eksen, ağırlıksız mesafe, `COMPOSITION_AXES`); teklif satırlarında parmak izi; `REFERENCE_DNA_VERSION` loga; `scripts/measure-offer-distance.ts`, `scripts/sweep-two-brands.ts`, `scripts/measure-craft-distribution.ts` | **Baz ölçüldü.** Teklif (18 golden × 8): süs 1.3 · mizaç 1.0 · variant 1.0 farklı değer; kompozisyon mesafesi min 0.00 her işte; ayrışmayan çift **462/504 (%92)**. İki marka (108 çift, üretim yolu): aynı arketip **107/108**, aynı lockup 107/108, aynı süs 0/108. Zanaat (18): hero 28–92 — `data-art="hero"` 7/18, çizili özne taşımayan 11 yüz 28 alıyor; tipografi 80–88 doygun; özgünlük 60 sabit; dekorasyon `data-pattern` 0/18 | **0/0** |
| **1 — Değerlendirici onarımı** ✅ 2026-09-18 | `brain/studioCraft.ts`: lider öğe arketipe göre (özne / işaret / plaka / zemin); geometri ledger'dan; marka>ürün kuralı puanda (metin-öncülü lockup'ta), işaret-öncülü lockup muaf; tipografi davranışa göre; özgünlük brief'e göre; `focal` · `categoryFit` · `distinctiveness` ayrı; `brandFit` Faz 3'e; `DesignCritic` `hero`/`focal`; kapı `hero < 45`'te de adım atıyor (`needsCraftRoute` / `craftRouteImproves`) | **Ölçüldü.** Golden: 57–76 → **71–77**; hero 28–92 → 80–90; hiyerarşi 62–89 → 81–89; tipografi yayılım 8 → 12; özgünlük sabit 60 → 70–80. Bozuk yüz: lider yok 62–68, hepsi bozuk 54–64 → toplam ayırt etmiyor, lider eşiği ediyor. 216 sıradan yüz 70–78, medyan 75; kapı 234 yüzde 0 yönlendirme. Taban 50 kaldı (veriyle 65'e çıkarılabilir: marj 5). 5 golden'da ürün>marka metin boyu — işaret-öncülü referans dili, skorlayıcı işareti lider sayıyor | **0/0** |
| **2A — Kompozisyon ekseni** ✅ 2026-09-18 | `lockup` tercih listesi (`lockupsFor`, `ALT_LOCKUPS`); `LockupStyle` +2 (`band-split`, `rotated-brand`) generic ressamla (`compositions.ts`), etiket + kutu önü; şerit kuralı (kartlar farklı yerleşim); seçim yerleşimi pinler (`studioLockup`); `render-compositions.ts` | **Ölçüldü.** Teklif lockup çeşitliliği 2.7 → **4.4**; birebir aynı çift 274 → **128**/504; ledger 0/0, export OK, 6 yüz gözle doğrulandı. **Düzeltme:** iki-marka "farklı yerleşim ≥ %50" bu fazın değil Faz 3'ün — seçim marka-bağımsız (bugün %0). `variant` 13 ressamda seed'i 1/2 golden'ları oynatır → kapsam dışı, Faz 3 incelemesine. Yan bulgu ve düzeltme: stüdyo SVG'si XML-geçersiz (`&`), ZIP PNG önizlemesi sessizce yoktu → `xmlSafeSvg` | **0/0** |
| **2B — Ambalaj grameri** ✅ 2026-09-19 | Kompozisyonlar özne taşır (`paintSubject`; `specimen-hero` ve `line-scene` `ALT_LOCKUPS`'ta — Pure Life'ın bandın kenarına oturup içine taşan dalı); `top-left-block` (OILY / O'live); karton rolleri `art-panel` (Matka) ve `flanked` (Lunara) — `paintCompositionSide`, yan panelde kategori dış kenarda dikey, yalnız kutu (`SIDE_LED_LOCKUPS`, `lockupsFor` etikette düşürür); değerlendirici lideri yan panelde okur (`leadMarkup`: hero + focal); **`studio/svgHull.ts`** — çizimin gerçek erişimi işaretlemeden okunur, kompozisyonlar özneyi ölçülen erişimle sığdırır; varyasyon yürüyüşü tur sayar (`axisStep`); `render-compositions.ts` 12 yüz + yanlar; yeni araçlar `sweep-compositions.ts`, `measure-panel-roles.ts`, `render-hero-reach.ts` | **Ölçüldü.** Karton süpürmesi yan rolleri **3** (omurga 139 / sanat 43 / aynalı 34), ledger 0, export 0; 561 kompozisyon isteği: alındı 561, kirli 0, engel 0, lidersiz 0, hero min 78–80, craft min 70–72; teklif lockup çeşitliliği 4.4 → **6.1**, birebir aynı çift 43 → **15**/504, ayrışmayan 289 → 222. `svgHull` tarayıcıya karşı: 1120 hücrede çizimden küçük **0**, alan medyan 1.03. Kıvrımı geçen hero ve spec bandı **yapılmadı** (isteğe bağlıydı; komşu panel geometrisi Faz 12'ye). **Bulgu:** `heroAspect` tablosu gerçek erişimle uyuşmuyor (ark 0.56 vs ölçülen 0.60–1.04) — golden özne ressamı dokunulmadı, sahip kararı (§3.0) | **0/0** |
| **3 — Brief-aware director** ✅ 2026-09-18 | `studio/personality.ts` (5 eksen, yalnız açık brief sinyalleri, marka adı okunmaz); `ARCHETYPE_PERSONALITY`; `scoreArchetype` `personalityFit × 0.35`, kişilik varken heuristik pin 0.85→0.35, ürün-ailesi ×0.5; varyasyon 0'da tip/lockup kişilikle; şerit süs döngüsü; `studioPick` tam parmak izi pini; `reasons[]` + "neden"de kişilik iddiası | **Ölçüldü.** Aynı tasarım **0/108**; ≥2 tasarım ekseninde farklı **%86**, ≥3 %53; aynı arketip 107 → **62/108** (%57 — kalan çoğunlukla 1–2 aile tanıyan sektörler). Aynı brief kararlı. Teklif: süs 1.3 → 3.0 farklı değer, birebir aynı çift 128 → 43/504; "≥2 eksen her çiftte" hedefi **tutmadı** (289/504 ayrışmayan) — mizaç şeritte sabit (müşterinin tonu), variant 13 ressamda ölü; kalan mesafe Faz 2B/2C'nin. "Neden" kişilik alanını söylüyor. **Hedef düzeltmesi:** "≥ %70 farklı arketip" kaba vekildi; doğru ölçü "aynı tasarım = 0" | **0/0** (nötr brief → terim 0, tasarım gereği; golden hiç oynamadı) |
| **4 — Tipografi sistemleri** ✅ 2026-09-19 | `studio/typeSystem.ts`: 10 sistem — 4 eski birebir, 6 yeni (dar serif / mono, dar grotesk, yuvarlak retro, aşırı büyük serif, ağır grotesk blok, ince geometrik geniş aralık); 4 gömülü aile (Instrument Serif, Barlow Condensed, Righteous, IBM Plex Mono — SIL OFL, 7 alt küme, outline + metrik); `copyShape` kısa-ad kapısı; kişilik beynin tip önerisinin üstünde (`axisSource`); şerit tip sistemlerini döndürüyor; iki-ağırlık ressamları (`diagonal`, `line-scene`) yerel ikilide aynı, başka sistemde `titleFaces` ile sistemi giyiyor; sohbet yeni sistemleri anlıyor | **Ölçüldü.** 216 brief: v0'da **8** farklı sistem seçildi (hedef ≥ 8 ✓), şeritte 10, şerit başına 6.1; 6 yeni sistemin her biri teslimde `<text>` 0, eksik glyph 0, taban ≥ 1.5 mm; aşırı büyük sistem kısa markayı ≥ %15 büyük diziyor, marka > ürün korunuyor; 216 sıradan yüz 71–78, kapı 0. **Yol boyunca bulunup düzeltildi:** `06-elektronik-kutu` golden'ı (yatık karton) dışa aktarılamıyordu — yan panelde omurga yoktu; `diagonalTechFront` yatık önde rozet çiplere basıyordu | **0/0** (4 diagonal golden yerel yüzlerini koruyor — mutasyonla kanıtlı) |
| **5 — Grafik dili** ✅ 2026-09-19 (sahip görsel onayı bekliyor) | **Beş alan** (`graphicFields.ts`): `blob` (R10/R15/R24/R27), `ogee` + tüy (R01), `celestial` (R07/R16), `pictogram` tekrarı (R13 — ürünün bitkisine göre 3 ikon), `toile` (R06 — ürünün bitkisinin tek mürekkep gravür sprig'i). **İki heraldik çerçeve** (`laurel` — kendi yaprakları; `cartouche` — motif kütüphanesinden taşınan cartouche + çift çizgi köşe, `motifs.ts`). **İki düz çizim modu** (`cut-paper`, `silhouette`; kişilikten `subjectStyleFor`, sessiz brief seed kuralında). Şerit alanı da döndürüyor, parmak izi alanı taşıyor (`studioPick.background`). Değerlendirici çizili özneyi kendisinden okuyor (`data-hero`). Listeler sona eklendi; yalnız `d.background` okuyan ressamlara | **Ölçüldü.** 5 alan + 2 çerçeve + 3 mod fikstürü: ledger 0, export OK, craft 73–79, gözle tam boy doğrulandı (10 yüz). Erişim (`measure-graphic-reach`): 216 brief'in %95'inin şeridinde en az bir yeni alan; blob 59 / ogee 119 / celestial 61 / pictogram 39 / toile 95 şeritte, laurel 139 / cartouche 109; şerit çeşitliliği alan 7.3 → 7.5, çerçeve 4.2 → 5.3; 216 sıradan yüz 71–78, kapı 0; golden 0/0 (2 mutasyon kanıtı: şerit döngüsü, kişilik modu). **Yapılmayan:** kurdele bandı, düz silüet *alanı* (silüet çizim modu yapıldı), `crest-spot`/`olive-wreath` taşındı ama yerleştirilmedi. **Gravür hayvan ✅ 2026-09-19 tamamlandı** — ayrı satır: F-33 | **0/0** |

**F-33 — gravür hayvan kümesi + yatık kolaj** (2026-09-19, sahip görsel onayı bekliyor). Dört mark (`creatures.ts`: kuş, balık, arı, geyik) dört çizim modunda, saf yol, seeded; `paintCollage`'ın orta plakası. Yönlendirme ürünün kelimelerinden (`creatureFor`), Türkçe tam-kelime ayrıştırmayla — `/\bbal\b/` "balık"ın içinde eşleşiyordu, çünkü noktasız **ı** JS'te kelime karakteri değil. Aynı turda ölçülen ve kapatılan kusur: `collage-plate` kemer pencereyi süpürmenin **48 yüzünde (%22) hiç çizmiyordu** (geniş-alçak yüzde kemer künyenin altına sığmıyor), arketip tipe düşüyordu; yatık yüz artık aynı grameri yana okuyor — plaka sol sütun, tip sağ sütun. **Ölçüm:** penceresiz 48 → **0**, hayvan taşıyan yüz 120 (%56) → **204 (%94)**, hayvan genişliği min 14.2 / medyan 21.4 / max 26.8 mm, craft reference 75.9 → **76.0**. 1 mutasyon kanıtı (yatık dal kapatılınca pencere kapısı kırmızı).
| **6 — Seri (SKU) sistemi** | `rangeMode` (zemin / bant / özne); `lineSeed` + `rangeIndex`; aynı marka farklı ürün → sabit iskelet, değişen tek eksen | 4-SKU Verda süpürmesi: 1 iskelet, 4 zemin/özne; karton+etiket eş | 0/0 |
| **7 — Kritik → onarım (tasarım bulguları)** | `planStudioRepair`'e güçlendirme deltaları (title dominance ↑, spacing ↑, ornament ↓, focal ↑); bulgular Faz 1 kritikten; monoton kalır (yalnız daha iyi puan tutulur) | onarım öncesi/sonrası craft ve mesafe; hiçbir onarım hiyerarşiyi bozmaz | 0/0 |
| **8 — Metin (Prompt 7)** | çok varyantlı banka + brief türetme + `copyShape` → kompozisyon uygunluğu | slogan tekrarı < %10 | 0/0 |
| **9 — Sadakat kolu** | `fidelity` (0–1) DirectionHints'te: yüksek = referans parmak izi bütün (kompozisyon+tip+grafik), düşük = yalnız ilkeler; **tracing yok**; mevcut `vision-reference`/`vision-compare` görevleri kanca | aynı referans DNA'sından iki mod → parmak izi mesafesi ölçülür (yüksek sadakat yakın, türetme uzak) | 0/0 |
| **10 — Öğrenme (tasarım sinyalleri)** | loga parmak izi + seçilen aday + indirilen + puan; `observeOutcome` studio dalı arketip/zemin'e ek `typeSystem`/`lockup`/`graphicLanguage` | **NOT PROVEN** — gerçek müşteri verisi yok; yalnız altyapı + fikstür testi | 0/0 |
| **11 — Sohbet → brief → kişilik** | Prompt 6 sohbetinden kişilik alanları (`feeling`, `audience`, `channel`, `priceTier`, `avoidLike`) zaten yakalanıyor; Faz 3'ün girdisine bağlanır; "özet" kişiliği söyler | mesaj sayısı artmaz (2–3); kişilik 4 açılışta doğru | 0/0 |
| **12 — Etiket kesim biçimleri** | `dielineStructures`: kemer kartuş, silüet kesimli çerçeve, çıkıntılı kesim | dieline cert + export gate | ayrı (dieline) |

**Kapsam dışı (planlanmıyor):** insan figürü, maskot, fotoğraf, kabartma, blackletter wordmark; gravür manzara sahip kararı olmadan.

---

## 10. Audit soruları — A … M

**A. Beynin hangi parçaları gerçekten üretim yolunda?**
Karar veren: `createPlan` (yalnız 3 eksen ipucu), `DesignRules` (köprü üzerinden), `VisualConcept` (bütçe → süs), `applyKnowledge` + `studioKnowledge`, `scoreVisualCraft` (kapı), `studioCritic`, `DesignDecisionLog`, `OutcomeTracker`, `LearningEngine`, `DesignKnowledgeStore` — ve `brain/` dışında asıl seçici `studio/direction.ts` + `referenceDna.ts` + `family.ts` + `panelField.ts` + `copyBank.ts` + `species.ts`. Kanıt §1.

**B. Hangi parçalar yalnız soyutlama (stüdyo yüzüne etkisi 0)?**
`CompositionGrammar` (8 niyet, heroZone, opticalCenter), `ArtDirection` hero/pattern/primitive seçicileri, `SectorVisualVocabulary` (kit adları, `typographyVoice`), `VariationRecipes`, `RepairPlanner`, `applyPlanToSystem` (plan türevi alanlar), `CritiqueEngine.needsRepair`, `DesignMemory`, `scoreDesign` (atılan bayrak), `moodPriors`, `styleHeroConfig`; artı `graphicLibrary/` 1.642 satır ve `artwork/heroes/` 11 işaret. Hepsi kit yoluna konuşuyor; kit `App.tsx:400` yüzünden ulaşılamaz.

**C. En büyük yaratıcı darboğaz nerede?**
**Kompozisyon.** 20 arketipin 16'sı `stacked-center`; `lockup` DNA'da tek değer; `variant` 13/20 ressamda okunmuyor; plan'ın 8 kompozisyon niyeti stüdyoya hiç ulaşmıyor; adaylar zemin ve çerçeveyle ayrışıyor, iskeletle değil. Referanslardaki 14 kompozisyon DNA'sından 1'i tam var, 5'i zayıf, 8'i yok (§4.1). İllüstrasyon ikinci (tek özne sınıfı), tipografi üçüncü (4 davranış).

**D. Yeni referans klasörü hangi yeni DNA'ları getiriyor?**
Kompozisyon: bant bölmesi, kemer bandı, döndürülmüş marka, kıvrım taşması, aynalı kanat, sanat paneli, pencere kolaj, iç kart, aşırı silüet, top-left blok, spec bandı. Tipografi: condensed, ekspresif serif, rounded/extended, mono, aşırı büyük, döndürme. Grafik: gravür hayvan, toile, celestial, düz silüet, kesme-kağıt, blob, piktogram deseni, ogee, kurdele/defne/taç/madalyon. Renk: SKU serisi, duotone. Ambalaj: panel rolü. Tam liste §4–5. Kapsam dışı bırakılanlar §3.1.

**E. Mevcut DNA'ların hangileri redundant?**
Sistem içi çiftler §5.2: iki kompozisyon sözlüğü, iki sektör tablosu, iki varyasyon sistemi, iki ruh hali sistemi, iki anti-tekrar, iki çizici havuzu — hepsinde stüdyo tarafı kalır, kit tarafı Prompt 9 ile gider. Aile düzeyinde gerçek redundant yok; ama beş koyu/lüks parfüm plakası aynı iskeleti paylaşıyor → altıncısı eklenmez, parfüme kompozisyonla değer katılır.

**F. Tipografi repertuarı nasıl genişlemeli?**
Font sayısıyla değil davranışla: `TypeSystem` (display/secondary sınıfı, ölçek oranı, aralık sınıfı, kasa, döndürme, ağırlık kontrastı). 3–4 gömülü yüz (condensed serif, condensed grotesk, rounded/extended, mono) outline'larıyla — export sözleşmesi (0 `<text>`) korunur. Mevcut 4 ikili aynen; yeni sistemler DNA listelerinin sonuna; seçim marka kişiliğinden. §6.2, Faz 4.

**G. Grafik/illüstrasyon repertuarı nasıl genişlemeli?**
`species` sözleşmesini `subjectHero(kind…)` olarak genelleştirip **ucuzdan pahalıya**: blob, düz silüet, kesme-kağıt, piktogram deseni, celestial, ogee, toile; heraldik çerçeve üyeleri; en son sınırlı gravür hayvan kümesi (gravür tarama motoru zaten var). İnsan/maskot/foto yok. Kit kütüphanesinden taşınabilen işaretler tek tek. §6.1, Faz 5.

**H. Arketip seçimi brief-aware nasıl olmalı?**
`scoreArchetype`'a kişilik terimi (§6.4): brief → 5 eksenli `BrandPersonality`; DNA'ya `personality` uyumu; ağırlık sweep ile golden korunur; kişilik yalnız arketipi değil `variant`, `lockup` tercihini ve `TypeSystem`'i de seçer. Mevcut görsel-kelime pin'i, sektör önceliği, mizaç yürüyüşü ve kullanıcı pin'i aynen kalır (öncelik sırası: kullanıcı > aile > görsel kelime > kişilik > sektör). `DesignDirector` atılmaz; girdisi genişler.

**I. Tek brief'ten 3–6 gerçek yön nasıl?**
Teklif zaten 8 aile veriyor; eksik olan *gerçeklik*. Faz 2+3 sonrası her aday `{lockup, band, rotation, typeClass, graphicLanguage, spacing}` parmak iziyle gelir ve seçici mesafeyi maksimize eder. Kullanıcının örneği ("Quiet Editorial / Modern Heritage / Architectural Luxury / Botanical Contemporary / Experimental Type") doğrudan kişilik eksenlerinin köşeleridir: restraint↑ + spacing extreme; heritage↑ + toile; technicality↑ + top-left blok; warmth↑ + silüet botanik; energy↑ + rotated oversized.

**J. Bu yönler nasıl gerçekten farklı olacak?**
`NOT DISTINCT` kuralı: iki adayın parmak izi ≥2 eksende ayrışmıyorsa biri düşer; ölçüm Faz 0 enstrümanıyla, hedef Faz 3'te. Bugün ölçüldü (§6.5): 8 aday arketip/zemin/çerçevede ayrışıyor, **süs·mizaç·`variant`'ta 8'i de aynı**, lockup 4'ten 2–3'ü kullanıyor. "Farklı" olması için yerleşim, yoğunluk ve renk işlemi de adaylar arasında yürümeli.

**K. Mevcut Critique + Repair nasıl daha iyi kullanılır?**
Önce değerlendiriciyi stüdyoya göre kalibre et (§7.4) — bugün kit sözlüğü arıyor. Sonra bulguları ayır: technical / design / brandFit / categoryFit / distinctiveness. Onarımı geometri-ötesine taşı: `planStudioRepair`'e güçlendirme deltaları (Faz 7), yine monoton (yalnız daha iyi puan tutulur). `critiquePlan → repairPlan` kit zinciri stüdyoya taşınmaz; stüdyonun kendi döngüsü büyür.

**L. LearningEngine gelecekte hangi tasarım sinyallerini öğrenmeli?**
Bugün stüdyoda: arketip + zemin (outcome), arketip/zemin avoid (feedback), ledger kritikleri. Eklenmeli: seçilen aday vs gösterilen 8 (log `studioOffer` + sonraki `source:'family'` üretimi bunu geri kazandırır), indirilen/puanlanan yüzün **parmak izi**, `typeSystem`/`lockup`/`graphicLanguage` tercihleri, kişilik-eksen ↔ arketip eşleşmeleri (marka ölçeğinde). **NOT PROVEN**: kapı ve eşikler test edilmiş, gerçek müşteri verisi yok; sahte başarı yazılmaz.

**M. Güçlü tarafları bozmadan Level 5'e minimum mimari değişiklik?**
Beş değişiklik, hepsi *ekleme*: (1) `ArchetypeDna.dna: Partial<StructuredDna>` ve `lockup`'ın tercih listesi olması; (2) `BrandPersonality` + `scoreArchetype` terimi; (3) `subjectHero` sözleşmesi ve `TypeSystem`; (4) değerlendiricinin stüdyo sözlüğü + parmak izi/mesafe; (5) `composeStudioArtwork`'e komşu panel geometrisi (kıvrım taşması) ve `panelField.assignRoles`. Değişmeyenler: hiyerarşi kuralı, ledger, 9 kapı, outline export, golden mekanizması, öğrenme kapısı, kredi modeli.

---

## 11. Başarı kriteri ve yapılmayacaklar

**Başarı** (§39): aynı brief → 8 aday, her çift ≥2 eksen farklı; farklı kişilik → farklı arketip ≥ %70; referans DNA'sı yeni yüzde ölçülebilir etki (fikstür + parmak izi); kritik → onarım → yeniden boya craft'ı düşürmeden yükseltir. Hepsi Faz 0 enstrümanlarıyla sayılır.

**Yapılmayacaklar** (§29): "4 ikili → 40 ikili", "1 slogan → 100 slogan", "botanik → 20 kategori" — her genişleme bir *seçme kuralıyla* gelir. Referans görseli çalışma zamanına girmez. Tracing yok. İnsan figürü, foto, kabartma yok. Golden DNA 0 · hash 0 her fazda; sahip onayı olmadan hiçbir golden güncellenmez. Commit yok.
