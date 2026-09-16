# Grapxor — Stüdyo Aşaması Geliştirme Auditi

**Tarih:** 15 Eyl 2026 (gece)  
**Ürün:** Grapxor / Paxolab (`Desktop/Paxolab`, `main` `dac32ef` OLAYBUDUR)  
**Amaç:** Fable stüdyo sıçramasından *sonraki* tüm yönlerde kontrollü geliştirme listesi. Kod değişikliği yok.  
**Kanıt kaynağı:** `src/engine/studio`, `FormaLocalEngine`, sohbet, LLM, knowledge, preflight, freeze testleri, `TASARIM REF`.

Kilit: **LLM SVG çizmez. Packfy / SAM / YOLO / raster-to-SVG / image-gen yok. 29 katalog freeze durur. Learning Gate global’i otomatik açmaz.**

---

## 0. Bugün neredeyiz

Fable’nin TASARIM REF DNA’sı + Grok’un sohbeti stüdyoya bağlaması, canlı yüzeyi harvest kitinden **referans anatomisine** taşıdı. Kullanıcı bunu tasarım kalitesinde sıçrama olarak gördü. Bu doğru.

Olgunluk (yalnızca bu aşama, 13 Eyl tam-sistem audit’indeki 2/5 kit notunun yerine):

| Eksen | /5 | Not |
|---|---:|---|
| Referans anatomisi (kutu/etiket yüzü) | **3.5** | 6 kutu + 6 etiket arketipi; tam foto değil, vektör damıtma |
| Sektör ayrışması | **4** | Kahve/parfüm/elektronik net; serum line-scene, bebek line-scene, temizlik wave; krem botanik kalır |
| Sohbet → brief | **3** | Sektör≠marka, MAX_ASK, 4 kritik soru; hâlâ sihirbaz kokusu |
| LLM orkestrasyon | **2.5** | Kapı var; endpoint yoksa heuristik; art director kapalı sözlük |
| Öğrenme halkası | **2** | Gate kodda; UI yok; `runLearningCycle` uygulamada çağrılmıyor |
| Üretim (PDF/X, trap, QR, font gömme) | **2.5** | Dieline PDF/X-4 sRGB dürüst; QR placeholder; stüdyo fontları yüklenmiyor |
| Aile sistemi (kutu+etiket aynı DNA) | **3.5** | `studioFamily` kutu→etiket kardeş arketipi kilitler; S4 |
| Freeze / determinizm | **4.5** | 29 kit + 18 stüdyo yüz hash ayrı; boş knowledge = baseline |

**Toplam tasarım olgunluğu (stüdyo yüzü): ~3.2 / 5.** Ajans referansının altında; harvest kitinin açıkça üstünde.

Çalışan generate (sohbet):

```
Brief (+ provenance)
  → applyKnowledgeToBrief
  → createPlan (kit plan hâlâ üretilir, stüdyo onu boyamaz)
  → hintsFromBrief + knowledge + LLM DirectionHints
  → resolveDirection (kapalı arketip)
  → composeStudioArtwork (ledger + DNA painter)
  → applyStudioPreflight
  → critiquePlan (kit critic; stüdyoda repair kapalı)
  → DesignDecisionLog
```

Katalog / freeze job: `overrides.studio` yok → eski `composeArtwork`. İki painter **bilinçli** duruyor.

---

## 1. Kilitler (yapma)

- LLM’e path / stroke / viewBox / SVG / “şunu çiz” sordurtma
- Packfy, SAM, YOLO, OCR, raster-to-SVG, AI image plate
- 29 set-0 fingerprint, overlay skip style-only, vintage-badge KEEP, lockup Y, family −1000
- Character/density’yi `visualLanguageFor` anahtarı yapmak
- Knowledge’ı painter geometrisine bağlamak
- Global knowledge auto-activate, RL, SVG fine-tune
- İkinci paralel tasarım motoru (kit’i silip her şeyi stüdyoya zorlamak freeze’i kırar)

---

## 2. Yön 1 — Görsel craft (TASARIM REF farkı)

Referans klasör gerçek illüstrasyon / mermer foto / tam botanik silüet. Stüdyo **prosedürel vektör**: damar path, yaprak blob, ay-manzara, diyagonal blok. Bu bilinçli; foto gömmek yasak listede.

### Var

- Arketip + temperament + type pairing + frame + lockup (`referenceDna.ts`)
- 10 background family; seeded `mulberry32`
- Anatomi: lockup, claim band, benefit, badge, net ℮, legal kolon, spine manifesto, nutrition/notes, barkod
- Kahve → `marble-frame` + beverage copy (GURME GIDA sızıntısı kapatıldı)

### Gap (kaliteyi en çok burası büyütür)

| ID | Gap | Kanıt | Risk |
|---|---|---|---|
| V1 | Botanik katmanlı negatif-mekan yaprak (evenodd cutout) | `botanical()` | Kapandı S5 |
| V2 | Guess manzara: kübik sırt + ay yansıması + su | `landscapeMoon` | Kapandı S5 |
| V3 | Elite Brew mermer: akışkan damar + altın toz | `marble()` | Kapandı S5 |
| V4 | Tipografi stack stüdyoda Cormorant/Montserrat/Great Vibes **adlı**, uygulamada yalnızca Instrument Sans/Serif yükleniyor | `studio/text.ts` vs `src/index.css` | Yüksek — referans “yüzü” bozulur |
| V5 | Glyph genişliği em tahmini; gerçek font metrics yok | `FACE_EM` | Orta — taşma/boşluk |
| V6 | QR kare placeholder, gerçek QR yok | `qrPlaceholder` | Düşük (örnek) |
| V7 | Serum / bebek / temizlik botanik’ten ayrıldı (S3). Krem hâlâ `botanical-card` (bilinçli) | galeri 02 botanik; 03/07/09 değil | Kapandı S3 |
| V8 | VariationIndex havuzu top-3; “başka bir yön” çoğunlukla aynı ailenin kardeşi | `resolveDirection` `pool.slice(0,3)` | Orta |
| V9 | Kit `createPlan` stüdyoda boyanmıyor ama hâlâ hesaplanıyor; critic/score kit dilinde | `FormaLocalEngine` repair skip | Orta — yanlış critic |

**Sıra:** V4 font yükle (stüdyo yüzleri) → V7 sektör-spesifik 3. arketip (klinik serum, bebek line-scene, temizlik wave) → V1–V3 doku yoğunluğu → V5 ölçüm kalibrasyonu. Foto/plate yok.

---

## 3. Yön 2 — DNA kapsamı ve aile sistemi

Bugün 6+6 arketip, hepsi TASARIM REF’ten damıtılmış. Yeni referans = yeni DNA kaydı + layout; prompt değil (`referenceDna.ts` yorumu).

| ID | Gap | Yapılacak |
|---|---|---|
| D1 | Kutu+etiket aynı brief’te **aynı arketip ailesini** paylaşır (`studioFamily`) | Kapandı S4 |
| D2 | Şablon kartı stüdyo arketipini göstermiyor; kullanıcı tuck vs wrap seçiyor, mermer vs botanik değil | Template picker’a “görsel sistem” değil yapı; yön sohbette / vary’de |
| D3 | `generic` sektör zayıf; hediye / e-ticaret / kargo DNA’sı yok | Yeni arketip ancak referans + layout ile |
| D4 | Sleeve / snap-lock / reverse-tuck dieline’ı stüdyo front’a bağlandı; flap hâlâ sade zemin | `paintBoxFlap` zenginleştir (marka + hacim) — freeze dışı |
| D5 | Label wrap vs flat: `isLandscape` iki kolon; küçük kavanoz `isTiny` anatomi düşürüyor — test az | Tiny/landscape golden cases |

**Sıra:** D1 aile anahtarı (kahve kutu marble ise etiket marble) → D4 flap/top tutarlılığı → D3 yalnız referans geldikçe.

---

## 4. Yön 3 — Sohbet ve brief

### Var

- ASK_CRITICAL: yüzey, sektör, marka, ölçü
- Sektör/yüzey adı marka olamaz; `şablon` marka değil
- Provenance; MAX_ASK; açılış cümlesi sektörü yansıtır
- Landing kısayolları yalnız yüzey: Kutu / Etiket / Kutu + Etiket (C1, 16 Eyl)

### Gap

| ID | Gap |
|---|---|
| C1 | Hâlâ sıra soru (yüzey→sektör→marka→ölçü). Tam cümle (“Elite Brew kahve kutusu premium mermer”) tek turda generate’e yaklaşır; test var, canlı LLM kapalıysa heuristik yetmez |
| C2 | `productName` kritik değil; lockup boş ürün + kategori. Referanslarda ürün hattı (Mocha Frappe) zorunlu his |
| C3 | “daha premium / daha mermer / daha sakin” stüdyo `DirectionHints` + kit cue | Kapandı S4 |
| C4 | Çift teslimat: “etiketi de üret” aynı `studioFamily` | Kapandı S4 |
| C5 | Süreç notu stüdyo cümlesi; kullanıcı “neden bu yön”i değiştiremiyor (veto chip yok) |
| C6 | LLM brief-extract endpoint’siz çalışmaz; canlı ELEKTORNIK sınıfı hata heuristik+typo ile kapatıldı, uzun TR/EN karışık cümle hâlâ kırılgan |

**Sıra:** C3 stüdyo iterasyon sözlüğü (daha koyu / daha mermer / daha sakin → `DirectionHints`) → C1 tek-paragraf generate (LLM varsa) → C4+D1 → C5 veto.

---

## 5. Yön 4 — LLM orkestrasyon

Kapı: `LLMProvider.generateStructured`. Görevler: `brief-extract | feedback-interpret | critique | copy | intent | studio-direct`.

| ID | Gap |
|---|---|
| L1 | `VITE_FORMA_LLM_URL` yoksa tüm LLM `null` — art director heuristik `hintsFromBrief` |
| L2 | `studio-direct` kapalı sözlük; geçersiz arketip düşer. Prompt sözleşmesi testte mock’lanıyor, canlı sözleşme kırılgan | Kapandı S8 — `sanitizeStudioDirection` |
| L3 | `critiqueWithLlm` otomatik çağrılmıyor (doğru); stüdyo ledger’a bakmıyor | Kapandı S8 — ledger kanıt; geometri drop |
| L4 | Copy LLM stüdyo bank’ını ezebilir; generic tagline filtresi yalnız “masada duran lezzet” | Kapandı S8 — `mergeLlmCopy` |
| L5 | Model adı Design Brain’de yok (doğru); log `llmUsed.direction` var |

**Sıra:** L1 fail-open durur. L2–L4 kapandı S8. Fine-tune (FAZ 9) park.

---

## 6. Yön 5 — Critic, skor, öğrenme

### Var

- Observation → aggregate → candidate → validate → approve / rollback
- Studio outcome: onaylanan arketip `prefer`, reddedilen `avoid`
- Brand key hash; PII yok
- Eşikler belgelenmiş

### Gap

| ID | Gap |
|---|---|
| K1 | **UI yok.** `runLearningCycle` Workspace’te yok; adaylar görünmez; insan global onay yok | Kapandı S7 |
| K2 | `critiquePlan` kit overlay/hero; stüdyo yüzünde `needsRepair` zorla kapatılıyor | `FormaLocalEngine` |
| K3 | Studio ledger collision/minText → preflight’a gidiyor; DesignCritic category/target’a tam map değil |
| K4 | RatingBar yıldız → OutcomeTracker; stüdyo prefer bağının kullanıcıya izahı yok | Kapandı S7 — süreç notu `Öğrendim: …` |
| K5 | A/B knowledge (FAZ 7b) park — doğru; veri yokken açma |
| K6 | Preference model / RL park |

**Sıra:** K1+K4 kapandı S7. K5 A/B ve K6 RL park.

---

## 7. Yön 6 — Üretim ve dürüstlük

| ID | Gap |
|---|---|
| P1 | Bilinen kırmızı: `printReady` SVG’de `PDF/X-4 sRGB` metni (test bekliyor), `formaBoxCert`, `structure.test` cut/perf, P9-A timeout | `DESIGN_BRAIN_NEXT` |
| P2 | Stüdyo export `exportOk` ledger fail’de kapanır; combined SVG null olabilir — galeri script preflight’ı bypass etti |
| P3 | QR / gerçek GS1 / INCI doğruluğu örnek; üretim iddiası yok (doğru) — UI “örnek” işaretini stüdyo yüzünde küçük tut |
| P4 | Font gömme SVG/PDF’de yok; matbaa fallback Georgia/Arial | V4 ile birlikte |
| P5 | 3D önizleme stüdyo markup’ı kullanıyor mu doğrulanmalı (eski kit texture varsayımı) |
| P6 | CMYK / FOGRA yok — dürüst kopya kalsın |

**Sıra:** P1 kırmızıları stüdyodan bağımsız kapat → P2 stüdyo export yeşil kapısı → P4 font subset → P5 3D.

---

## 8. Yön 7 — Çift painter ve freeze

İki yol kalacak:

| Yol | Ne zaman | Dokunma |
|---|---|---|
| Kit `composeArtwork` | katalog, blankCanvas job, `studio` yok | Freeze |
| Stüdyo `composeStudioArtwork` | sohbet generate | DNA / layout / copy bank |

| ID | Gap |
|---|---|
| F1 | `createPlan` stüdyoda israf + yanlış critic | Plan’ı stüdyoda “shadow” log’la veya critic’i ayır |
| F2 | Asset catalog 46 atom stüdyoda kullanılmıyor | Bilinçli; stüdyoya atom basmak freeze+dil karışır — **park** veya yalnız playful |
| F3 | 18 stüdyo yüz hash CI’da (`STUDIO_FACE_GOLDEN`); 29 kit ayrı | `studioGolden.test.ts` | Kapandı S6 |

**Sıra:** F3 stüdyo golden → F1 critic ayrımı. F2 park.

---

## 9. Yön 8 — Ürün yüzeyi

| ID | Gap |
|---|---|
| U1 | Vary / StyleBar hâlâ kit kostüm dili; stüdyo temperament chip’i yok |
| U2 | Karşılaştırma tab’i stüdyo yön farkını (marble vs botanical) yazmıyor |
| U3 | Knowledge / critic / LLM kapalıysa kullanıcı “neden böyle”yi süreç notundan okuyor, değiştiremiyor |
| U4 | Galeri script (`scripts/export-sector-gallery.ts`) ürün değil; tekrar üretilebilir dursun |

---

## 10. Kontrollü faz sırası (freeze-safe)

Önceki FAZ 4–7 **kapalı**. Bundan sonra **Stüdyo-A…** (kit freeze’e paralel).

| Faz | İçerik | Çıkış kapısı | Park / kilit |
|---|---|---|---|
| **S0** | Bu audit + kırmızı test envanteri | Doküman + P1 listesi | — |
| **S1** | Stüdyo font yükle + SVG `font-family` gerçek | Referans kutu/etiket yüzü Instrument değil, DNA tipi | **Kapandı** |
| **S2** | Stüdyo critic (ledger → DesignCritique) + kit repair stüdyoda hiç | Critic SVG mute; kit testleri yeşil | **Kapandı** |
| **S3** | Sektör erimesi: serum klinik, bebek line-scene, temizlik wave; kahve/parfüm/elektronik dokunma | Galeri 03/07/09 arketip ≠ botanical-card | **Kapandı** |
| **S4** | Aile anahtarı kutu→etiket; iterasyon sözlüğü DirectionHints | “etiketi de üret” aynı family | **Kapandı** |
| **S5** | Doku yoğunluğu (botanik silüet, mermer damar, manzara) seeded | Aynı seed = aynı path | **Kapandı** |
| **S6** | Stüdyo golden 18 yüz hash | CI’da stüdyo set; 29 kit ayrı | **Kapandı** |
| **S7** | Learning UI (aday / onay / rollback) | Global insan; boş depo = baseline | **Kapandı** |
| **S8** | LLM sözleşmesi + copy birleşimi | Endpoint fail-open | **Kapandı** |
| **S9** | Üretim: export kapısı, font subset, 3D, P1 kırmızılar | Dürüst PDF/X iddiası | **Kapandı** — FOGRA yok |

Bir fazı bitirmeden sonrakine atlama. S1–S9 kapandı.

---

## 11. Bilinçli park (yine)

- Overlay skip → dil anahtarı
- GraphicLibrary şişirme, lockup Y, budget
- `assetLanguage` zorunlu DesignPlan
- FAZ 8 preference model, FAZ 9 LLM fine-tune, RL
- Fotoğraf plaka, Packfy, CV
- Kit painter’ı silmek

---

## 12. S1+S2 — uygulandı (15 Eyl 2026 gece)

- `src/index.css` + stüdyo SVG `data-art="studio-fonts"`: Cormorant Garamond, Montserrat, Great Vibes.
- `critiqueDesign({ studioLedger })` kit lockup/density hint’lerini yutmaz; çarpışma/taşma/punto ledger’dan gelir; SVG mute.
- `FormaLocalEngine` stüdyoda `repairPlan` çağırmaz.

Sonraki PR: **S7** Learning UI (aday / onay / rollback).

---

## 13. S3 — uygulandı (15 Eyl 2026 gece)

- Serum / bebek → `line-scene` (DNA Pharma klinik çizgi sahne); `bakım` artık bebekte botanik karta düşmez.
- Temizlik → `wave-panel` (FERAH dalga bantları).
- Krem / şampuan botanik kartta kaldı. Kahve mermer, parfüm mürekkep/manzara, elektronik diyagonal — dokunulmadı.
- `hintsFromBrief` + `productFamilyFit` ayrıştı; kutu ve etiket painter’ı aynı yüzü paylaşır (`paintLineSceneFace`, `paintWavePanelFace`).
- Kit freeze path stüdyosuz durur.

---

## 14. S4 — uygulandı (16 Eyl 2026)

- `studioFamily` (marble / botanical / line-scene / wave / landscape / ink / dark-luxe / tech): kutu generate yazar, “etiketi de üret” kardeş arketipi kilitler (botanical-card → card-on-art, dark-landscape → ink-panel).
- Iterasyon sözlüğü stüdyo `DirectionHints`: daha mermer / botanik / dalga / koyu / sakin / klinik / canlı. Kit cue durur; ikinci motor yok.
- Aile hint `resolveDirection`’da last-merge; LLM arketipi aileyi ezmez.

---

## 15. S5 — uygulandı (16 Eyl 2026)

- Botanik: üç katman + `fill-rule="evenodd"` delikli yaprak; orta kart boşluğu kenar yoğunluğunda durur.
- Mermer: kenardan akan S-damar, `data-texture="veins"` + altın `dust` (daire/elips). Raster yok.
- Ay manzarası: 4 kübik sırt, ay yansıma kolonu, kıvrık su çizgisi. Meadow sırtları aynı kübik `ridge`.
- Aynı seed = aynı path (`backgrounds.test.ts`). Kit freeze stüdyosuz.

---

## 16. S6 — uygulandı (16 Eyl 2026)

- 18 stüdyo yüz (9 sektör × kutu/etiket) `STUDIO_FACE_GOLDEN`: arketip + doku + aile + SHA-256 yüz hash.
- Galeri işleri `studioGalleryJobs.ts`; dump: `scripts/dump-studio-golden.ts`.
- Katalog 29 freeze ayrı slug; stüdyo generate `studio:true`. 03/07/09 botanik değil.

---

## 17. S7 — uygulandı (16 Eyl 2026)

- Üst çubuk **Öğrenme** paneli: `runLearningCycle({ approve: 'automated' })` user/brand açar, global doğrulanmış kural insan **Onayla / Reddet** bekler.
- Rollback önceki aktif kümeye döner; geçmiş silinmez. Boş depo = baseline.
- Süreç notu: `Öğrendim: kahvede marble frame arketipi tercih.` Generate döngü çalıştırmaz.
- A/B ve RL yok.

Sonraki PR: **S8** LLM sözleşmesi + copy birleşimi.

---

## 18. S8 — uygulandı (16 Eyl 2026)

- `sanitizeStudioDirection`: kapalı sözlük; uydurma arketip / hex / SVG gerekçe düşer. Endpoint yoksa `null` → heuristik.
- `mergeLlmCopy`: kullanıcı sloganı kazanır; LLM tagline yalnız boilerplate değilse; aksi halde sample, stüdyo yüzünde bank (`isGenericTagline`).
- `critiqueWithLlm` stüdyo ledger’ı kanıt olarak alır, geometri satırını yutar; pipeline otomatik çağırmaz.
- Fine-tune yok.

Sonraki program: **C0–C8 sohbet stüdyosu** — `docs/STUDIO_CHAT_AUDIT.md`. FOGRA / CMYK park.

---

## 19. S9 — uygulandı (16 Eyl 2026)

- Combined SVG `exportOk` olmadan üretilmez; galeri ve katalog combined’ı preflight fail’de yazmaz.
- `printReady` prova 3 mm güvenli + bleed; yorum `PDF/X-4 sRGB · trap yok · FOGRA değil`.
- Dieline SVG `data-type="cut"|"crease"|"perf"`; formaBoxCert + structure.test.
- Export yüzü Google `@import` düşer; `@font-face` unicode-range Latin+TR, local() + Georgia/Arial. Binary WOFF yok.
- 3D kutu/etiket yüzleri stüdyo panel markup’ını boyar (`renderPanelSvg`).
- P9-A timeout 20 s. `buffer-global` Node `Buffer` tipine çarpmaz.
- QR yüzünde `data-sample`; combined SVG’de “örnek, ISO/IEC 18004 değil” notu. GS1/FOGRA iddiası yok.

