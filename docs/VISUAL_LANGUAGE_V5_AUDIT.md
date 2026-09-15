# VISUAL LANGUAGE V5 AUDIT

Ürün: Grapxor. Tarih: 15 Eyl 2026.  
Kapsam: `DesignIntentBlock`, `VisualIntent`, `Density`, `visualLanguageFor`, `LANGUAGES`, `styleRule`, call-site’lar.  
Kod değişikliği yok. 29 set-0 freeze dokunulmaz. AD-2 (pattern ∩ dil) bekletildi; bu dilim mimari soru.

Soru: **DesignIntent içindeki hangi alanlar gerçekten yaratıcı karar taşıyor, mevcut VisualLanguage token’ları hangileri, character/density nerede tanımlı, bunlardan hangileri language resolution’a dönüştürülebilir?**

---

## CEVAP (tek paragraf)

Bugün dil **kostüm kimliği**nden türüyor: `intent.style × sector × subProduct` (`visualLanguage.ts` `LANGUAGES` + `languagesForStyleSector`). `character` / `density` / `negativeSpace` / `metallic` imzada `void`. Yaratıcı karar taşıyan ama lehçeyi seçmeyen alanlar `character` (VisualIntent) ve `density`/`negativeSpace`/`restrainExtras` (hava ve doluluk). Bunlar lehçeye **tek başına** çevrilemez: `elegant` hem luxury parfüm (`heraldic`) hem luxury gıda (`botanical, organic`) hem classic (`heraldic` veya `heraldic, art-deco`). Güvenli dönüşüm, `style×sector` anahtarını silmek değil; character/air’i **ikinci eksen** (modifikatör veya aynı-dil tie-break) yapmak. Catalog set-0’da cue `none` olduğu için character hâlâ styleRule’un birebir kopyası — style’ı character ile değiştirmek 29 vektörü bozar.

---

## 1. DESIGNINTENT ALANLARI

Tanım: `DesignPlan.ts` 199–211. Üretim: `buildDesignIntent` (`DesignDirector.ts` 106–126) ← `resolveDirectedStyle` ← `styleRule` + cue.

| Alan | Tip | Kaynak (set-0, cue none) | Dil okur mu? | Yaratıcı mı? | Bugün ne işe yarıyor |
|---|---|---|---|---|---|
| `style` | StyleType | brief / createPlan arg | **Evet — LANGUAGES anahtarı** | Kostüm ID, lehçe değil | Dil + concept + hero tabloları |
| `sector` | SectorId | `resolveSector(brief)` | **Evet — 2. anahtar** | Kategori | Dil satırı, VOCAB, concept |
| `character` | VisualIntent | `styleRule.visualIntent` veya cue | `void` | **Evet — mood** | `plan.visualIntent` kopyası; compositionTargets `=== 'air'` |
| `density` | Density | `styleRule.density` veya cue | `void` | **Evet — doluluk** | `plan.decor.density`; painter/crop/primitives; critic density |
| `negativeSpace` | NegativeSpace | `styleRule.negativeSpace` veya cue | `void` | **Evet — hava** | `compositionTargets` whitespace (airOf) |
| `metallic` | MetallicRole | `styleRule.metallic` veya cue | `void` | Malzeme, lehçe değil | `plan.color.metallic`; chrome değil |
| `restrainExtras` | boolean | false; cue tighten/open-air true | `void` | Restraint bayrağı | studio recipe kapalı, crop open, densityTarget düşük |
| `positioning` | Positioning | `styleRule.positioning` | `void` | Style’ın neredeyse 1:1 kopyası | summary; concept seçmez |
| `hierarchyPolicy` | `'brand'` | sabit | `void` | Karar yok | Critic hiyerarşi zaten brand-first |
| `surface` | box/label | packagingMode | `void` | Yapı | principles (legal), lockup wrap |
| `cue` | DirectorCue | override | `void` (dolaylı) | Girdi | character/density/air/metallic’i yeniden yazar |

**DesignIntent’te yok:** `subProduct`. Dil 3. anahtarı brief’ten `visualLanguageFor(intent, sector, subProduct)` ile giriyor. Intent nesnesi lehçenin tam anahtarını taşımıyor.

**Intent’te var, dil fonksiyonu okumuyor:** `intent.sector`. `visualLanguageFor` ikinci argüman `sector`’ü kullanır; `intent.sector` ne `void` listesinde ne lookup’ta. Catalog’da ikisi aynı (`plan.sector`); yine de taşıyıcı bütünlüğü kırık: üç anahtardan biri nesnede yok (`subProduct`), biri nesnede var ama çağrı argümanı kazanıyor (`sector`), biri nesneden geliyor (`style`).

### Routing vs yaratıcı

- **Routing (lehçe SoT bugün):** `style`, `sector`, (+ call-site `subProduct`).
- **Yaratıcı, lehçe değil:** `character`, `density`, `negativeSpace`, `restrainExtras`.
- **Malzeme / chrome komşusu:** `metallic`.
- **Sabit / yapı:** `hierarchyPolicy`, `surface`.
- **Girdi, alan değil:** `cue` — `resolveDirectedStyle` içinde character/density/air’e erir. Dil fonksiyonunda hem cue hem character okumak çift sayım olur.

---

## 2. VISUALLANGUAGE TOKEN’LARI

Sekiz token, iki kopya union: `VisualLanguage` (`visualLanguage.ts` 18) ve `ConceptLanguageId` (`DesignPlan.ts` 56).

| Token | Set-0 örnek | Kit etkisi | Overlay |
|---|---|---|---|
| `heraldic` | 01 nocturne-crest, 02 heraldic-crest | crest hero; full chrome (quiet-line yok) | stamp/corner/frame roller |
| `botanical` | 08 earthen, 12 harvest-kraft | harvest/monstera | corner/accent/band |
| `organic` | botanical satırlarının 2. token’ı; playful 1. | harvest/emblem | atom regex vintage/grain |
| `oval` | 03/17 soft-oval | botanical hero (oval hero retired → none) | stamp/accent; ticks cezası |
| `quiet-line` | 04/16 air-paper; cream luxury 2. token | quiet chrome; line-scene/none | +0.06 whitespace overlay |
| `linear` | 06/27 index-stripe; 14 tech-glyph | emblem veya tech; balanced-corners blok | band/divider; craft-fill |
| `geometric` | electronics 2. token; playful 2. | tech/emblem/harvest | |
| `art-deco` | 10/18 heraldic-cartouche 2. token | harvest + cartouche lockup | frame/corner/stamp |

`preferredRolesForLanguage` (`visualLanguage.ts` 215–222) `organic` ve `geometric` için boş dizi döner — token var, overlay rol tablosu yok.

`MotifFamilyId` ile çakışan string’ler: `heraldic`, `botanical`, `quiet-line`, `harvest` family ≠ language. Ayrı katman, aynı sözlük.

`paletteTable.LanguageId` (`perfume-luxury` …) **renk paleti**; Visual Language değil.

LANGUAGES 18 satır (`visualLanguage.ts` 35–54). `visualLanguageFor` yalnızca `intent.style` + `sector` + `subProduct` okur (117–131).

---

## 3. CHARACTER VE DENSITY NEREDE TANIMLI

### Tipler

- `VisualIntent` = `'elegant' | 'restrained' | 'high-contrast' | 'air' | 'warm' | 'graphic'` — `DesignPlan.ts` 6
- `Density` = `'sparse' | 'balanced' | 'dense'` — `designSystem/types.ts` 44
- `NegativeSpace` = `'high' | 'med' | 'low'` — `DesignPlan.ts` 7

### Varsayılan tablo — `styleRule` (`DesignRules.ts` 19–98)

| Style | character (`visualIntent`) | density | negativeSpace | metallic | positioning |
|---|---|---|---|---|---|
| luxury | elegant | dense | med | foil | luxury |
| modern | high-contrast | balanced | med | off | premium |
| minimal | air | sparse | high | off | premium |
| eco | warm | balanced | med | off | natural |
| playful | graphic | dense | low | off | playful |
| classic | elegant | balanced | med | restrained | premium |

`restrained` **hiçbir style’ın default’u değil.** Yalnız `cue === 'luxury-tighten'` (`DesignDirector.ts` 74–79).

### Cue remap (`resolveDirectedStyle` 74–100)

| Cue | character | density | air | başka |
|---|---|---|---|---|
| luxury-tighten | restrained | sparse | tightenSpace → typically high | metallic restrained, restrainExtras |
| luxury-arrive | rule.visualIntent | rule.density | rule | foil, extras açık |
| open-air | (değişmez) | sparse | high | restrainExtras |
| warm-natural | warm | balanced | (değişmez) | |
| graphic-push | playful→graphic else high-contrast | sparse→balanced else dense | | |
| force-overload | (değişmez) | dense | low | extras açık |

Catalog generate `variationIndex: 0`, cue none → character **style ile kilitli**. 29 job’da `plan.designIntent.character === plan.visualIntent === styleRule(style).visualIntent`.

### Runtime okuma (dil dışı)

- `character` / `plan.visualIntent === 'air'` → `compositionTargets` highAir (`compositionStrategy.ts` 131). Minimal zaten `negativeSpace: 'high'`; air bayrağı yedek.
- `density` → `plan.decor.density` → densityTarget, patternOpacity, primitives, applyPlan system.density, critic `density`/`densityFront`.
- `negativeSpace` → `airOf` → whitespaceTarget (slice 3). Quiet-line/oval overlay’de +0.06.
- Repair: density sparse + air high; `mirrorDesignIntent` character’ı `plan.visualIntent`’ten kopyalar (repair character’ı değiştirmez).

`visualConceptFor` ve `visualLanguageFor` character/density’yi `void` eder (`VisualConcept.ts` 316–317, `visualLanguage.ts` 122–123).

---

## 4. HANGİSİ LANGUAGE RESOLUTION’A DÖNÜŞÜR

### Dönüşmez (çarpışma)

Aynı `character: 'elegant'` set-0’da üç lehçe ailesi:

| Job | style | character | languages[] |
|---|---|---|---|
| 01 parfüm luxury | luxury | elegant | heraldic |
| 08 zeytinyağı luxury | luxury | elegant | botanical, organic |
| 03 krem luxury | luxury | elegant | oval, quiet-line |
| 02 kolonya classic | classic | elegant | heraldic |
| 10 kurabiye classic | classic | elegant | heraldic, art-deco |

`character → language` tablosu 01 ile 08’i ayıramaz. Anahtar **sector** kalmak zorunda.

Aynı `density: 'dense'`: luxury heraldic ve playful `organic, geometric`. Density lehçe değil, doluluk.

Aynı `negativeSpace: 'med'`: luxury, modern, eco, classic — dört lehçe ailesi.

### Zaten dil olan (yeniden map etme)

| character (default) | style | bugünkü dil (tipik) |
|---|---|---|
| air | minimal | quiet-line |
| warm | eco | botanical, organic |
| graphic | playful | organic, geometric |
| high-contrast | modern | linear (± geometric electronics) |
| elegant | luxury/classic | sektöre göre üç aile |

Default character, style’ın takma adı. Character’ı anahtar yapmak style’ı ikinci kez yazmak demek; 29 vektör aynı kalır **yalnızca** style×sector durursa.

### Dönüştürülebilir — ikinci eksen, identity-first

Anlam: `LANGUAGES[style,sector,sub]` **birincil** kalır. Character/air **modifikatör**. Catalog cue none’da modifikatör no-op.

| Kaynak | Güvenli invert (hedef, kod yok) | Freeze |
|---|---|---|
| `character: 'air'` | Vektöre `quiet-line` ekle (yoksa). Primary (heraldic vb.) silinmez. | Set-0 minimal zaten quiet-line. Luxury+air cue yok. |
| `character: 'restrained'` | İkinci token `quiet-line`; chrome zaten quiet’e kayabilir. | Catalog cue none — no-op. Cue tighten **yeni** dil vektörü; ayrı golden. |
| `negativeSpace: 'high'` / `restrainExtras` | Dil değil; whitespace zaten airOf. Quiet-line eklemek dil ile havanın çift sayımı. | Dokunma |
| `density: 'sparse'` | Dil değil. Quiet-line’a eşlemek luxury-tighten parfümü heraldic+quiet-line yapar → chrome quiet, 01 freeze delinir. | Yasak anahtar |
| `metallic` | Token yok. Chrome/foil katmanı. | Dil tablosuna koyma |
| `positioning` | style ile koliner. | Yoksay |
| `character` aynı-dil concept tie-break | VL-4 kapısı: heraldic içinde nocturne vs heraldic-crest. İkisi de style ile ayrılıyor; character ikisinde elegant. | Set-0 no-op; character yetmez |

### Önerilen VL-5b uygulama sırası (bu dilim değil)

1. **Modifikatör tablosu, identity.** `visualLanguageFor`: base = `languagesForStyleSector`; `character === 'air' \|\| 'restrained'` ise `quiet-line` append (zaten varsa no-op). Test: 29 vektör bitwise eşit. Cue tighten ayrı test, catalog generate cue none.
2. **Character ≠ style çakışma testi.** Synthetic: luxury + character air → `heraldic + quiet-line` (ör. 01). İnsan bakışı olmadan catalog generate’e bağlama.
3. **Density/air dil anahtarı değil.** Whitespace ve densityTarget’ta kalsın.
4. **subProduct’u DesignIntent’e taşı** (anahtar bütünlüğü). Dil çözümlemesi intent nesnesinden tam yapılsın; brief’ten 3. arg kalksın. Lookup formülü aynı. Freeze no-op.

AD-2 (pattern ∩ dil) bu invert’ten bağımsız bekler.

---

## 5. HEDEF EKSEN AYRIMI (kod yok)

| Karar | Taşıyıcı | Token uzayı |
|---|---|---|
| Lehçe (ne çizgi) | Visual Language | 8 VisualLanguage |
| Kostüm / sektör | style × sector × sub | LANGUAGES keys |
| Mood | character (VisualIntent) | 6; lehçeyi **modifiye** edebilir |
| Doluluk | density | sparse/balanced/dense |
| Hava | negativeSpace + restrainExtras | compositionTargets |
| Folyo | metallic | chrome komşusu, dil değil |
| Named idea | Visual Concept id | nocturne-crest … |

Karıştırılmaması gereken: `elegant` ≠ `heraldic`. Elegant bir mood; heraldic bir çizgi lehçesi. Mood lehçeyi ancak sector bağlamında daraltır.

---

## 6. BU DİLİMDE YAPILMAYAN

Motor yok. `visualLanguageFor` void’ları duruyor. AD-2 yok. Character anahtar değil.
