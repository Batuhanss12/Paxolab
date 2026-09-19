# Paxolab — audit 2 ve master uygulama planı

**Tarih:** 2026-09-19 · **HEAD:** `97839ea` · **Bu turda kod yazılmadı.** Üç ölçüm aracı eklendi: `audit-element-roles.ts`, `audit-candidate-diversity.ts`, `audit-sector-grammar.ts`.

---

## 1. Tamamlanan audit

| bölüm | durum | araç |
|---|---|---|
| A · sektör görsel grameri | ✅ ölçüldü | `audit-sector-grammar.ts` — 12 sektör × 7 eksen |
| B · ambalaj yapıları | ✅ sayıldı | katalog: 34 şablon, **19 yapı**, 15 katalog sektörü |
| C · gerçek tasarım çeşitliliği | ✅ ölçüldü | `audit-candidate-diversity.ts` — 3 brief × 8 aday × 6 okuma |
| D · logo analizi | ✅ 12 sorunun hepsi cevaplandı | kod okuması |
| E · referans görsel | ✅ ölçüldü | `referenceAnalysis.ts` okundu |
| G · canvas bileşenleri | ✅ sayıldı | 12 `data-edit` hedefi |
| I · zanaat kapısı | ✅ ölçüldü | 9 eksen + `geometryMetrics` karşılaştırması |
| F · referans → tasarım testi | ⬜ **yapılmadı** | aşağıda §10 |
| H · insan geri bildirimi | ⚠️ kısmen | mevcut altyapı bulundu, UI eksikliği ölçülmedi |

---

## 2. Yeni bulgular

### 2.1 Motor sorunları buluyor ve dinlemiyor — **audit 2'nin başlığı**

Sahibin ekran görüntüsündeki yüzün zanaat karnesi:

```
visualCraft 71 · composition 68 · hierarchy 66 · typography 92 · hero 84
decoration 60 · sectorFit 76 · productFit 64 · informationDesign 56 · originality 68
focal 45 · categoryFit 20 · distinctiveness 39
notlar: "Ürün adı markadan büyük — hiyerarşi kuralı ihlali"
        "Çerçeve rounded-card seçildi, çizilmedi"
        "Gıda nutrition yok"
```

Motor **üç gerçek kusuru ismiyle yazıyor** — biri sahibin dokunulmaz dediği hiyerarşi kuralının ihlali — ve tasarım **71 puanla geçiyor**. `focal 45`, `categoryFit 20`, `distinctiveness 39` hesaplanıyor ve hiçbir şeyi tetiklemiyor.

**Kök neden "model yok" değil: model var, ateşleniyor, kimse dinlemiyor.**

### 2.2 Ledger körlüğünün sınırı — audit 1'i düzeltiyorum

Aynı yüzde: **geometri 27 öğe görüyor** (25 şekil, 2 metin), **ledger 5 kutu**.

Yani zanaat puanının geometri yarısı (`computeGeometryMetrics`) **markup'ı** tarıyor ve dalı *görüyor*. Audit 1'de "modeller mürekkebin yarısını göremiyor" demiştim — bu **kısmen yanlış**. Doğrusu:

- **Ledger kör** → çarpışma denetimi ve onarım dalı göremez → dal markanın üstünden geçer, "0 çarpışma"
- **Geometri kör değil** → kaplama, ağırlık merkezi, denge dalı sayar
- **Ama geometri anonim** → şekil #17'nin *ne olduğunu* ve markayla ilişkisini bilemez

Bu ayrım planı değiştiriyor: Faz 1'in getirisi çarpışma + onarım + anlamsal ilişki; kaplama metrikleri zaten çalışıyor.

### 2.3 Referans analizi **var** ve çöpe gidiyor — audit 1'i düzeltiyorum

Audit 1'de "logo hiç analiz edilmiyor" demiştim. **Yanlış.** `src/engine/referenceAnalysis.ts` şunları çıkarıyor: `colors, brightness, contrast, saturation, layout (centered|grid|asymmetric|minimal|dense), density, sectorHint, styleHint`.

Gerçek kusur daha keskin:

1. Analiz **yalnızca** `!brief.colors || !brief.styleType` iken çalışıyor. Müşteri *"siyah ve altın, lüks"* dediyse **hiç çalışmıyor**.
2. Çalıştığında `analysisToBriefPatch` 8 alandan **2'sini** kullanıyor (`colors`, `styleHint`) ve onları da yalnız brief boşsa.
3. `layout`, `density`, `contrast`, `brightness`, `saturation`, `sectorHint` hesaplanıp **atılıyor**.
4. Sonuç **hiçbir yere kaydedilmiyor** — sonraki üretimleri besleyemez.

### 2.4 Logo — D bölümünün 12 sorusu

| # | soru | cevap |
|---|---|---|
| 1 | SVG mi raster mı | `FileReader.readAsDataURL` → `new Image()` → canvas. **Raster hattı.** `.ai/.eps/.pdf` açık mesajla reddediliyor; **`.svg` kabul ediliyor** (MIME `image/svg+xml` filtreden geçiyor) ve rasterleştiriliyor |
| 2 | SVG path/shape okunabiliyor mu | **Bugün hayır** — ama `dataUrl` içinde duruyor ve **`svgHull` zaten elimizde** (bu oturumda özne ölçümü için yazıldı) |
| 3 | Baskın renk | ✅ **var** (`dominantColors`) |
| 4 | Logo geometrisi | ❌ yok |
| 5 | En/boy oranı | ❌ çıkarılmıyor (`image.width/height` analiz anında elde) |
| 6 | Görsel yoğunluk | ✅ **var** (`density`) — atılıyor |
| 7 | Şekil dili | ❌ yok |
| 8 | Logo içi tipografi | ❌ yok |
| 9 | Organik/geometrik | ❌ yok |
| 10 | Kontur/dolgu karakteri | ❌ yok |
| 11 | Karmaşıklık | ⚠️ vekil (`density` + `contrast`), açık ölçü yok |
| 12 | Monokrom/çok renkli | ⚠️ türetilebilir (`colors.length` + `saturation`), hesaplanmıyor |

**Teknik sınır:** analiz **64 × 64**'te örnekliyor. Renk/yoğunluk/kontrast için yeterli; geometri, şekil dili, kontur/dolgu ve tipografi için **değil**.

### 2.5 Sektör gramer matrisi (A)

Aynı marka, ürün, yapı, ölçü ve ruh hali; yalnız sektör değişiyor:

| eksen | sektörün ürettiği farklı değer |
|---|---|
| arketip | 8 / 12 |
| alan (background) | 8 / 12 |
| çerçeve | 4 / 12 |
| arka yüz bilgi mimarisi | 4 / 12 |
| süs seviyesi | 3 / 12 |
| tip sistemi | **3 / 12** (10 sistem var, 3'ü kullanılıyor) |
| mizaç | **1 / 12 — sektör hiç dokunmuyor** |

**Görsel parmak izi: 12 sektör → 9 ayrı.** Çakışanlar: `parfüm = ev = tekstil`, `sağlık = ilaç`.

**İki ciddi bilgi mimarisi boşluğu:**
- **`ev` arka yüzünde hiçbir yasal blok yok** (`—`)
- **`ilaç` kozmetikle aynı arkayı alıyor**: doz, etkin madde, seri/son kullanma yok — düzenlenmiş bir sektör için kabul edilemez

Ayrıca **iki ayrı sektör sözlüğü** var: katalogda 15 Türkçe sektör, motorda 10 `SectorId`. Aralarındaki eşleme tek kanonik yer değil.

### 2.6 Gerçek çeşitlilik (C)

| brief | görsel olarak ayrı çift (≥3 okuma) |
|---|---|
| lüks parfüm kutu | 23/28 (**%82**) |
| gıda bal etiket | 17/28 (**%61**) |
| elektronik kutu | 26/28 (**%93**) |

**En kötü çift:** `atelier-plate ↔ crest-panel` — altı okumanın **hiçbirinde** farklı değil. Sekiz teklifin ikisi aynı kompozisyon.

**İki yapısal bulgu:**
- **Odak neredeyse her tasarımda `0.50, 0.50`** — tam merkez. Yalnız `line-scene`, `diagonal-tech`, `marble-frame`, `botanical-card`, `wave-panel` oynatıyor. Sahibin hissettiği "ortalanmış yığın" bu.
- **Kaplama iki uçlu:** ya ~%0 ya ~%90. Arada yok — bir grafik öğenin yüzün %30'unu bilinçli tuttuğu tasarım üretilmiyor.

Sahibin saydığı yönlerden (`editorial · minimal geometric · image-led · typographic · illustrative · botanical · luxury restrained · bold commercial · information-led`) bugün **ayrı kompozisyon olarak** var olanlar: `illustrative` (line-scene), `botanical`, `image-led` (pattern/blob full-bleed), `typographic` (grid-mono, noir-stack). **Yok olanlar:** `editorial`, `minimal geometric`, `information-led`, `bold commercial`, `luxury restrained` — isim olarak da yok, kompozisyon olarak da.

### 2.7 Yapı envanteri (B)

34 şablon, **19 yapı**: `tuck-end-box (10) · flat-label (3) · polygon-box (3) · mailer-box (2) · product-carrier-tray (2) · wrap-label · simple-tray · round-label · oval-label · sleeve · pillow-box · snap-lock-box · rigid-gift-box · reverse-tuck-end-box · tray-box · tuck-top-auto-bottom · rsc-carton · hang-tag · insert-card`.

**Pouch yok.** Kutu/etiket gramerinin karıştığı nokta bu oturumda zaten bulunup kapatıldı (etiket kapısı `data-art="spine"` okuyor, F-32).

**Açık:** `polygon-box` panellerinde ressam döndürülmemiş dikdörtgende çalışırken kalıp döndürülmüş paralelkenar yerleştiriyor (F-42'de tespit, kasıtlı olarak kapı dışında bırakıldı).

---

## 3. Audit 1'de doğrulanan bulgular

- Ledger %53 yüzde görsel öğeyi görmüyor (`hero` 5 yüzde) — **geçerli**
- Kompozisyon çözücüsü yok, liste seçimi var — **geçerli**
- Boşluk akıl yürütmesi emekli yolda kaldı — **geçerli**
- Canvas yalnız metin düzenliyor, besin tablosu yapılandırılmış nesne değil — **geçerli**
- `no visual hierarchy model / no art-direction model / no design rationale / quality gate technical only / no sector-specific grammar` iddiaları **yanlış** — modeller var

## 4. Yanlış çıkan varsayımlarım (audit 1)

1. *"Modeller mürekkebin yarısını göremiyor"* → geometri yarısı **görüyor**; kör olan ledger.
2. *"Logo hiç analiz edilmiyor"* → analiz **var**, 8 alan çıkarıyor, **2'si kullanılıyor, 6'sı atılıyor**, ve yalnız brief boşsa çalışıyor.

---

## 5. Gerçek kök nedenler (sıralı)

1. **Ateşlenen sinyal dinlenmiyor.** `focal 45`, `categoryFit 20`, `distinctiveness 39` ve üç açık kusur notu üretimi etkilemiyor; zanaat zemini yok.
2. **Ledger kör.** Çizim ile kayıt ayrı işler; %53 yüzde görsel öğe kayıtsız → çarpışma ve onarım eksik veriyle çalışıyor.
3. **Geometri anonim.** 25 şekil sayılıyor ama rolü yok → "bu dal markayla çakışıyor" cümlesi kurulamıyor.
4. **Odak sabit merkez.** Kompozisyon bir *seçim listesi*; odak hesaplanmıyor.
5. **Kaplama iki uçlu.** Ya boş ya tam taşma; kontrollü yoğunluk kademesi yok.
6. **Referans analizi bağlanmamış.** Çıkarım var, sanat yönetmenine gitmiyor, saklanmıyor, brief doluysa hiç çalışmıyor.
7. **Logo geometrisi okunmuyor.** SVG kabul ediliyor, rasterleştiriliyor, path verisi atılıyor.
8. **Sektör mizaca ve tipografiye dokunmuyor.** 12 sektör 3 tip sistemi ve 1 mizaç paylaşıyor.
9. **Düzenlenmiş sektörlerin bilgi mimarisi yok.** `ilaç` = kozmetik arkası; `ev` = arka yok.
10. **Yapılandırılmış bilgi blokları çizim.** Besin tablosu düzenlenemiyor çünkü nesne değil.
11. **`sectorFit`/`productFit` düz dize eşlemesi.** `scoreSectorFit` literal `2004.78` (bir SVG yol koordinatı) ve `EAU DE` arıyor; `scoreProductFit` `CERAMIDE|SHEA|CENTELLA` arıyor. Ölçüm değil, kırılgan sezgisel.
12. **DNA boyanmayanı vaat ediyor.** `"Çerçeve rounded-card seçildi, çizilmedi"` — yön, ressamın çizmediğini bildiriyor.

---

## 6. Kanonik mimari kararı

**Yeni model yaratılmayacak.** Mevcut üç kanonik model arasında sahiplik şöyle bölünür:

| bilgi | kanonik sahip | gerekçe |
|---|---|---|
| Müşterinin söylediği | **`DesignBrief`** | zaten kalıcı, kaydediliyor, sohbetten doluyor |
| Logo/referanstan **çıkarılan** özellikler | **`DesignBrief.referenceDna`** (yeni *alan*, yeni model değil) | brief zaten kalıcı ve üretimle birlikte taşınıyor; `ReferenceAnalysis` tipi genişletilir |
| Tasarımın **verdiği kararlar** | **`DesignDirection`** | arketip, alan, tip, süs, çerçeve, mizaç zaten burada; `reasons[]` de burada |
| Zamanla **öğrenilen** | **`DesignKnowledge`** | kapsam/durum/versiyon makinesi zaten var (F-39) |

`BrandDesignDNA` **ayrı bir model olarak yazılmayacak**; `ReferenceAnalysis` genişletilip `DesignBrief`'e bağlanacak ve `assembleStudioHints` üzerinden `DesignDirection`'a ipucu olarak akacak — bu yol **zaten var** (`hintsFromPlan`, `hintsFromBriefDepth`, `studioHintsFromKnowledge`).

**Ledger rol sözlüğü:** mevcut `PlacedBox.kind` (`ground | container | text | element`) *katman* anlatıyor, *rol* değil. Rol ayrı bir alan olarak eklenir; mevcut vocabulary ile çakışmaz.

---

## 7. MASTER UYGULAMA PLANI

Sıra sahibin önerisinden **iki yerde farklı**, gerekçesiyle.

| faz | iş | neden bu sırada |
|---|---|---|
| **1** | **Zanaat zemini ısırsın** | *Sahibin sırasında 4. idi.* Öne alındı: sinyal **zaten var ve doğru**; bağlamak en ucuz ve en büyük kazanç. `focal 45` ve "hiyerarşi ihlali" notu bugün sessiz. |
| **2** | **Ledger görünürlüğü + rol** | Çarpışmayı, onarımı ve anlamsal ilişkiyi açar. `fitSubject` sözleşmesi zaten 13 yüzde çalışıyor. |
| **3** | **Rolsüz öğe çizilemez** | 2 olmadan uygulanamaz. |
| **4** | **Odak + negatif alan** | 2'nin rolleri olmadan odak seçilemez. |
| **5** | **Referans/logo → brief → yön** | *Sahibin sırasında 5–6 idi.* Çıkarım zaten var; yalnız bağlanacak. |
| **6** | **Yapılandırılmış bilgi blokları (besin tablosu önce)** | Bağımsız; 1–4 ile çakışmaz, paralel gidebilir. |
| **7** | **Sektör gramerini derinleştir** | 5'in DNA'sı ve 4'ün odağı hazır olunca anlamlı. |
| **8** | **Aday yön çeşitliliği** | 4 + 7 olmadan "editorial vs minimal geometric" gerçek kompozisyon olamaz. |
| **9** | **İnsan geri bildirimi → bilgi** | F-39'un zinciri hazır; UI eksik. |
| **10** | **Üretim sertleştirme** | `polygon-box` kesim sorusu, pouch, PDF zinciri. |

---

## 8. Dosya bazında plan (Faz 1–3)

| dosya | mevcut rolü | değişiklik | neden | bağımlılık | risk | test |
|---|---|---|---|---|---|---|
| `brain/scoreVisualCraft.ts` | 9 ekseni birleştirir | zemin eşiği + `blocking` sebebi döndür | sinyali bağlar | — | **orta**: geçerli tasarım engellenebilir | mevcut 216 yüz dağılımı 71–78 → zemin ölçümle seçilir |
| `FormaLocalEngine.ts` | `needsCraftRoute` 3 adım | zemin altında **aday bütçesi**, sonra dürüst uyarı | sonsuz döngü yok | ↑ | orta | golden 0/0 korunur |
| `studio/text.ts` (`Ledger`) | kind + kutu | `role` alanı ekle | rol sözleşmesi | — | düşük | yeni kapı |
| `studio/subject.ts` | `fitSubject`/`fitDrawing` | rol parametresi | tek yerden geçiyor | ↑ | düşük | mevcut testler |
| `studio/labelLayouts.ts` · `boxLayouts.ts` · `refArchetypes.ts` | ressamlar | kayıtsız `hero`/`frame`/`collage`/`pictograms` kaydedilsin | %53 → 0 | ↑ | **orta**: golden hash oynayabilir | `audit-element-roles` = 0 |
| `studio/composeStudioArtwork.ts` | yüzü birleştirir | rolsüz çizim reddi | Faz 3 | Faz 2 | orta | yeni kapı |

**Faz 5 (referans) dosyaları:** `engine/referenceAnalysis.ts` (alanları genişlet), `types.ts` (`DesignBrief.referenceDna`), `App.tsx` (koşulu kaldır, sonucu sakla), `studio/direction.ts` (`assembleStudioHints`'e ipucu).

---

## 9. Test planı

| kapı | ölçüt | araç |
|---|---|---|
| görünmeyen görsel öğe | **0** | `audit-element-roles.ts` |
| rolsüz dekorasyon | **0** | yeni kapı |
| çarpışma kapsamı | `line-scene` dal–marka çakışması **yakalanır** | yeni test |
| zayıf kompozisyon | zemin altı tasarım **sessizce export edilemez** | yeni test |
| hiyerarşi kuralı | "ürün markadan büyük" notu **engeller** | yeni test |
| besin tablosu | canvas'ta düzenlenebilir, export'ta hayatta kalır | yeni test |
| referans etkisi | logo ile / logosuz aynı brief **farklı yön** üretir | Faz 5, F bölümü testi |
| aday yönleri | görsel ayrım **%61 → ≥%85**, "hiçbiri" çifti **0** | `audit-candidate-diversity.ts` |
| golden | **DNA 0 · hash 0** her fazda | `diff-studio-golden.ts` |

---

## 10. Riskler ve yapılmayanlar

**Riskler**
- **Faz 1 zemini yanlış seçilirse üretim durur.** 216 sıradan yüz bugün 71–78 arasında; zemin bu dağılımdan seçilmeli, tahminle değil.
- **Faz 2 golden'ları oynatır.** F-30'da iki golden bu yüzden oynadı, sahip onayıyla. Aynı onay gerekecek.
- **Faz 5 dördüncü model doğurabilir.** §6'daki sahiplik kararı yazılı tutulmalı.
- **Faz 8 çeşitlilik ile tutarlılık çatışır.** Sekiz gerçekten farklı yön, sekiz *tutarsız* yön demek olmamalı.

**Bu turda yapılmayanlar (dürüst kapsam)**
- **F bölümü** — referans ile/referanssız üç yollu karşılaştırma testi: koşulmadı. Bugünkü kodda referans zaten yönü etkilemediği için sonuç baştan belli; Faz 5'ten *sonra* anlamlı olacak.
- **H** — geri bildirim UI'ı: mevcut zincir (F-39) okundu, UI eksikliği ölçülmedi.
- PDF export zinciri, pouch yapısı, `polygon-box` kesim sorusu, logo dışı referans (moodboard) davranışı.
