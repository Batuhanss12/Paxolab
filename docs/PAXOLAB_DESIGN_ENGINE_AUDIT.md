# Paxolab — tasarım motoru audit'i

**Tarih:** 2026-09-19 · **HEAD:** `97839ea` (bu audit turunda kaynak kodu değişmedi; önceki turların işi sahip tarafından commit'lendi) · **Tetikleyen:** sahibin talebi — motoru *"dekoratif SVG üreten AI"*dan *"profesyonel grafik tasarım kararları verebilen computational packaging design engine"*e çıkarmak.

**Bu audit'in kuralı:** hiçbir iddia varsayılmadı. Her satırın arkasında ya okunmuş kod ya çalıştırılmış ölçüm var. Sahibin listelediği kök nedenlerin **bir kısmı doğrulandı, bir kısmı yanlış çıktı** — ikisi de aşağıda.

**Bu turda kod değiştirilmedi.** Yalnız iki ölçüm aracı eklendi (`audit-element-roles.ts`, `measure-cut-overflow.ts`).

---

## 0. Tek cümlelik bulgu

**Tasarım modelleri var; mürekkebin yarısını göremiyorlar.**

Motor 9 eksenli bir zanaat karnesi, bir sanat yönetmeni katmanı, bir kritik döngüsü ve bir onarım bütçesi taşıyor. Ama çizilen görsel öğelerin **%53'ü yerleştirme defterine (ledger) hiç kaydedilmiyor** — boyanıyor, yerleştirilmiyor. Ledger'ın göremediği bir öğe çarpışma denetiminden, onarımdan ve zanaat puanından da görünmez. Bu yüzden "dekorasyon" kelimenin tam anlamıyla **tasarım modelinin dışında**.

Sahibin ekran görüntüsü bunun tek karelik kanıtı: botanik dal "DAĞDAN" kelime markasının üstünden geçiyor, ve sistem **"0 çarpışma"** diyor.

---

## 1. Kanıt — sahibin ekran görüntüsü

`line-scene` ailesi, 70 × 90 kavanoz etiketi. Ön yüzün ledger'ında **5 kutu**:

```
element  brand-mark#1     x26.6 y4.5   16.8×12.0
text     brand#2          x23.9 y19.3  22.2×4.3
text     product#3        x19.0 y42.4  32.1×7.3
text     spaced#4         x23.1 y51.8  23.9×2.6
text     net-quantity#5   x24.2 y84.0  21.5×2.3
```

Markanın üstünden geçen dal **listede yok**. `çarpışma: 0 · export: true`.

---

## 2. Ölçüm — ledger neyi görüyor

`scripts/audit-element-roles.ts` (yeni) · 18 aile × 2 yüzey = **36 yüz**

| | |
|---|---:|
| en az bir görsel öğesi ledger'da olmayan yüz | **19 / 36 (%53)** |
| görünmeyen `frame` | 13 yüz |
| görünmeyen **`hero`** | **5 yüz** |
| görünmeyen `collage` | 2 yüz |
| görünmeyen `pictograms` | 2 yüz |

`hero`'nun görünmediği yüzler: `line-scene` (kutu + etiket), `ink-wash`, `ink-panel`, `noir-plate`. **Ana illüstrasyon yerleştirilmiyor.**

**Kritik not:** `specimen-hero` illüstrasyonunu **kaydediyor** (`fitSubject` → `ledger.add('element', 'specimen', …)`). Yani çözüm yeni mimari değil — **var olan sözleşmenin tutarlı uygulanması.**

---

## 3. Sahibin kök neden listesi — koddan doğrulama

| iddia | durum | kanıt |
|---|---|---|
| decorative atom overuse | ✅ **doğru** | %53 yüzde görsel öğe ledger dışı |
| no semantic relationship between assets | ✅ **doğru** | dal, marka kutusuyla ilişkilendirilmiyor; ilişkilendirilemez, çünkü kayıtlı değil |
| fixed slot dependency | ⚠️ **kısmen** | 5 kompozisyon (`band-split`, `rotated-brand`, `top-left-block`, `art-panel`, `flanked`) arketipten bağımsız seçilebiliyor — ama her biri kendi sabit yerleşimini taşıyor; gerçek bir çözücü değil |
| no focal-point model | ⚠️ **kısmen** | `scoreHero` lideri ölçüyor, `leadMarkup` yan panelde lideri okuyor — ama odak *seçen* değil, sonradan *puanlayan* bir model |
| no visual hierarchy model | ❌ **yanlış** | `scoreHierarchy` var (9 eksenden biri) |
| no typographic hierarchy solver | ❌ **yanlış** | `typeSystem.ts` — 10 davranış tabanlı sistem (izleme sınıfı, kasa, ölçek, ağırlık kontrastı, kopya şekli) |
| no art-direction model | ❌ **yanlış** | `brain/ArtDirection.ts`, `decideDirection`, `ARCHETYPE_PERSONALITY`, `personality.ts` — 5 eksenli kişilik → arketip/lockup/tip seçimi |
| no information architecture | ❌ **yanlış** | `scoreInformationDesign` var |
| no design rationale | ❌ **yanlış** | `DesignDirection.reasons[]` `{axis, chosen, because, alternative}`, `claims` `authority: REAL` ile; sohbette "neden" cevaplanıyor |
| no candidate diversity | ❌ **yanlış** | F-28 ölçümü: 108 çiftte **birebir aynı tasarım 0**, ≥2 eksende farklı %86 |
| no rejection based on aesthetic quality | ⚠️ **kısmen** | `needsCraftRoute` → 3 adımlık arketip kaydırma, `craftRouteImproves` ile kabul. **Ama sert bir zemin yok**: düşük zanaat puanı ihracatı engellemiyor |
| quality gate technical only | ❌ **yanlış** | 9 eksenli `scoreVisualCraft`: hero, composition, hierarchy, typography, decoration, sectorFit, productFit, informationDesign, originality |
| no sector-specific visual grammar | ❌ **yanlış** | `SectorVisualVocabulary` + `vocabularyTable` (`VOCAB`, `resolveSubProduct`) |
| weak composition solver | ✅ **doğru** | çözücü yok; kompozisyon bir *liste seçimi*, hesaplanan bir yerleşim değil |
| insufficient negative-space reasoning | ✅ **doğru** | whitespace puanı **yalnız** `artwork/compositionCandidates.ts`'te (emekli kit dönemi arama motoru); stüdyo yolunda kullanılmıyor — `DesignCritic` ve `DesignDecisionLog` yalnız *debug tipini* import ediyor |
| no brand identity model | ✅ **doğru** | aşağıda §5 |

**Özet:** listenin 13 maddesinden **4'ü doğru, 6'sı yanlış, 3'ü kısmen.** Motor sandığından çok daha zengin; sorun modellerin yokluğu değil, **körlüğü ve bağlanmamışlığı.**

---

## 4. Gerçek kök neden zinciri

1. Dekoratif ve kahraman öğeler **ledger'a kaydedilmiyor** (%53 yüz)
2. → çarpışma denetimi, onarım ve 9 eksenli zanaat puanı **eksik bir tasarımı** değerlendiriyor
3. → `scoreDecoration` ve `scoreComposition` göremedikleri mürekkebi puanlıyor
4. → düşük puan **engellemiyor**, yalnız 3 adım arketip kaydırıyor
5. → sonuç: "element placement" hissi, çünkü öğe gerçekten *yerleştirilmiyor*

Buna ikinci bir zincir ekleniyor:

6. Boşluk (negative space) akıl yürütmesi **emekli yolda kaldı** — stüdyo yolunun whitespace modeli yok
7. → kompozisyon "sığdı mı" ile ölçülüyor, "nefes alıyor mu" ile değil

---

## 5. Logo / referans — en büyük gerçek boşluk

**Logo hiç analiz edilmiyor.** `logoHref` kod tabanında yalnızca *yerleştirilecek bir görsel referansı* olarak geçiyor (`anatomy.ts:163,381,464`). Renk çıkarımı, geometri, yoğunluk, şekil dili, tipografi karakteri — **hiçbiri yok.**

Sahibin istediği `BrandDesignDNA` için mevcut karşılık aranmalı: `DesignBrief` + `DesignDirection` + `brain/DesignKnowledge` üçlüsü zaten kanonik modeller taşıyor. **Dördüncü bir model yaratılmamalı**; DNA bu üçünden hangisine ait olduğu kararlaştırılmalı.

---

## 6. Canvas — yapılandırılmamış bilgi blokları

Canvas **yalnız metin** düzenliyor. 12 `data-edit` hedefi: `brand, product, tagline, cta, volume, usage, ingredients, warnings, manufacturer, address, barcode, edition`.

**Besin tablosu için `data-edit` yok.** Tablo yapılandırılmış bir nesne değil, boyanmış bir çizim — bu yüzden taşınamıyor, yeniden boyutlandırılamıyor, satır eklenemiyor. Sahibin raporu birebir doğru.

Aynı durum şu bloklar için de geçerli: besin tablosu, alerjen bloğu, sertifika ikonları, geri dönüşüm işaretleri, piktogram sırası, teknik özellikler.

---

## 7. Bu oturumda zaten kapatılanlar (bağlam)

Audit'in kapsamı dışında ama aynı alanda: kesim poligonu kapısı (yuvarlak/oval barkod), beyan kırpılması, kemer arkası taşması, seçim ekranının kendini davet etmesi — F-42'de ölçülüp kapatıldı. Panel tutarlılığı (F-34), tek motor (F-37), öğrenme kapısı (F-39) da bu oturumda.

---

## 8. Önerilen yön — mevcut mimariyi koruyarak

**Faz 1 — Görünürlük (en yüksek getiri, en düşük risk).**
Her boyanan görsel öğe ledger'a bir **rol** ile kaydedilsin: `focal | brand | product | information | regulatory | rhythm | framing | support`. `fitSubject`/`fitDrawing` sözleşmesi zaten var ve 13 yüzde çalışıyor; kalan 19'a genişletilsin. Bu tek adım çarpışmayı, onarımı ve 9 ekseni aynı anda gerçek veriye bağlar.
*Kabul ölçütü:* `audit-element-roles` → görünmeyen görsel öğe **0**; `line-scene` yüzünde dal ile marka çakışması ledger tarafından **yakalanır**.

**Faz 2 — Rolü olmayan öğe çizilmez.** Bir öğe rol beyan edemiyorsa boyanmaz. Sahibin "boşluk doldurmak için eklenmesin" kuralının uygulanabilir hâli budur.

**Faz 3 — Boşluk ve odak stüdyo yoluna.** `compositionCandidates`'in whitespace mantığı emekli yolda; stüdyo için karşılığı yazılsın ve `scoreComposition`'a bağlansın.

**Faz 4 — Zanaat zemini ısırsın.** Düşük zanaat puanı bugün yalnız yeniden yönlendiriyor; bir taban altında **engellesin** (bütçeli: 3 aday, sonra dürüst bir uyarı).

**Faz 5 — Logo analizi → Design DNA.** Yeni model yaratmadan, mevcut üçlüden birine bağlanarak.

**Faz 6 — Yapılandırılmış bilgi blokları.** Besin tablosu önce; canvas ↔ SVG tek kanonik temsil.

---

## 9. Risk

- **Faz 1 golden'ları oynatabilir.** 18 donmuş yüzün ressamları değişmez, yalnız kayıt eklenir — ama `fitSubject`'e geçen yüzlerde hash oynar (F-30'da iki golden bu yüzden oynadı, sahip onayıyla).
- **Faz 4 üretimi durdurabilir.** Zemin yanlış seçilirse geçerli tasarımlar engellenir. Önce ölçüm: mevcut zanaat dağılımı 216 sıradan yüzde 71–78.
- **Faz 5 dördüncü bir model doğurabilir.** Sahibin kendi uyarısı; `DesignBrief`/`DesignDirection`/`DesignKnowledge` birleştirme kararı önce verilmeli.

---

## 10. Bu audit'te yapılmayanlar (dürüst kapsam)

Sahibin 25 maddelik listesinden şunlar **henüz ölçülmedi**: sektör bazında (cosmetics/pharma/household…) ayrı ayrı görsel gramer denetimi; sleeve/pouch/mailer yapıları; çoklu aday üretiminde gerçek yön çeşitliliği (editorial / minimal geometric / image-led / typographic / illustrative ayrımı); PDF export zinciri; referans görsel (logo dışı) analizi; human review loop mimarisi. Bunlar bir sonraki turda ölçülmeli — **varsayımla doldurulmadı.**
