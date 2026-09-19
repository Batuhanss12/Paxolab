# Faz 1 — uygulama haritası ve risk değerlendirmesi

**HEAD:** `97839ea` · **Bu turda kod yazılmadı.** Sözleşmeler gerçek kod üzerinden doğrulandı; audit'teki dosya adları körü körüne kabul edilmedi.

---

## 1. Doğrulanan sözleşmeler

| iddia | doğrulama |
|---|---|
| `brain/scoreVisualCraft.ts` 9 ekseni birleştiriyor | ✅ `weightedCraftScore(VISUAL_CRAFT_WEIGHTS)`, toplam 1.0 |
| hiyerarşi kuralı burada | ❌ **hayır** — `brain/studioCraft.ts:255` `studioHierarchy`. Audit'imde bu dosyanın adı **hiç geçmiyordu** |
| çerçeve sözleşmesi notu | `brain/studioCraft.ts:319` `studioDecoration` |
| stüdyo yüzünde hangi puanlayıcı | `visualCraftScores.ts` `ctx.studio` varsa `studioCraft`'a devrediyor (`hierarchy`, `typography`, `decoration`) |
| export kararı | `production/preflight.ts:83` `exportOk` — 10 teknik koşulun **AND**'i; `:212` `blocking = items.some(fail)` |

### 1.1 Bağımlılık yönü ters — planı değiştiriyor

```ts
// scoreVisualCraft.ts:69
const production = spec.preflight.exportOk ? 88 : spec.preflight.blocking ? 22 : 48
```

**`scoreVisualCraft` preflight'ı tüketiyor.** `FormaLocalEngine`'de sıra: preflight → craft. Export'u craft'a bağlamak **döngü** yaratır.

Sonuç: tasarım kapısı preflight'ın *içine* girmeyecek. İki koordineli kapı olacak — sahibin §4.1'de istediği ayrımın ta kendisi:

```
TECHNICAL GATE   preflight.exportOk        (bugünkü hâliyle, dokunulmuyor)
DESIGN GATE      craft sonrası, ayrı       (yeni)
FINAL            technical AND design
```

### 1.2 Gerçek hiyerarşi kuralı — icat edilmedi, keşfedildi

```ts
const brandIsDisplayLine = DISPLAY_LINE_LOCKUPS.has(ctx.report.direction.lockup)
if (!brandIsDisplayLine) score += 4   // "işaret lider; ürün başlığının büyük olması tasarım, kusur değil"
else if (ratio >= 1.3) score += 8
else if (ratio >= 1.1) score += 4
else if (ratio < 1) { score -= 15; notes.push('Ürün adı markadan büyük — hiyerarşi kuralı ihlali') }
```

`DISPLAY_LINE_LOCKUPS = {stacked-center, band-split, rotated-brand, top-left-block, art-panel, flanked}`

Kural **koşullu**: yalnız yön marka-öncelikli dediğinde ihlal. Sahibin ifadesiyle (*"when the direction specifies brand-first hierarchy"*) birebir aynı. Genişletilmeyecek.

---

## 2. ÖLÇÜM SAHİBİN FAZ 1 TASARIMINI ÇÜRÜTÜYOR

Plan *"zanaat zemini ısırsın"* diyordu. Ölçtüm:

```
216 golden-olmayan yüz · visualCraft dağılımı
min 71 · p05 72 · p25 74 · medyan 75 · max 78

taban 50 → 0/216 engellenir
taban 55 → 0/216
taban 60 → 0/216
taban 62 → 0/216
taban 65 → 0/216
```

**Dağılım 71–78'e sıkışmış.** Makul hiçbir taban iyiyi kötüden ayırmıyor. Sahibin ekran görüntüsündeki kusurlu yüz de **71** — dağılımın dibinde ama "normal".

**`visualCraft` üzerine zemin koymak işe yaramaz.** Bu, ölçmeden uygulansaydı hiçbir şey değişmeyecek, faz "PASS" görünecekti.

### 2.1 Ama ayırt eden sinyaller var — ve puanın dışındalar

Kusurlu yüz: `focal 45 · categoryFit 20 · distinctiveness 39` (diğer eksenler 56–92).

`VISUAL_CRAFT_WEIGHTS` yalnız 9 ekseni içeriyor: `hero .18 · composition .14 · hierarchy .14 · informationDesign .12 · decoration .10 · typography .10 · sectorFit .10 · productFit .06 · originality .06`.

`focal`, `categoryFit`, `distinctiveness` karneye **`weightedCraftScore` çağrıldıktan sonra** ekleniyor (`scoreVisualCraft.ts:98-102`). Yani **üç ölçülmüş sinyal hesaba hiç katılmıyor.** `focal 45`'in puanı aşağı çekmemesinin sebebi bu.

---

## 3. Faz 1'in düzeltilmiş tasarımı

Zemin yerine **iki ayaklı** tasarım kapısı:

### Ayak A — ayrık sert ihlaller (skor değil, olgu)

Bunlar puan değil, **evet/hayır** gerçekler ve zaten tespit ediliyorlar:

| blocker | kaynak | bugün |
|---|---|---|
| `HIERARCHY_VIOLATION` | `studioHierarchy` notu | −15 puan, not |
| `DESIGN_CONTRACT_FRAME` | `studioDecoration` notu | −6 puan, not |
| `REQUIRED_INFO_MISSING` | `studioInformation` ("Gıda nutrition yok") | not |

→ **`exportAllowed = false`**, açık sebep.

### Ayak B — dışlanmış sinyaller karara girsin

`focal`, `categoryFit`, `distinctiveness` **onarım sinyali** olarak kullanılacak (skor tabanı olarak değil, çünkü ölçüm tabanın işe yaramadığını gösterdi): en zayıf eksen hedefli aday kaydırmayı tetikler.

Mevcut `needsCraftRoute` 3 adımlık mekanizması korunur; farkı: **hangi eksenin zayıf olduğuna göre** yön seçer, bugünkü gibi yalnız toplam puana bakmaz.

---

## 4. Dosya bazında plan

| dosya | mevcut sözleşme | değişiklik | bağımlılık | risk | test |
|---|---|---|---|---|---|
| `brain/studioCraft.ts` | not üretiyor, puan düşürüyor | notların yanında **yapılandırılmış blocker** döndür | — | düşük | yeni birim test |
| `brain/scoreVisualCraft.ts` | `VisualCraftScorecard` | karneye `blockers[]` + `repairSignals[]` ekle; `focal/categoryFit/distinctiveness` korunur | ↑ | düşük | mevcut craft testleri |
| `brain/scoreConfig.ts` | ağırlıklar | **dokunulmuyor** (ağırlık değişimi golden'ları oynatır) | — | — | — |
| `FormaLocalEngine.ts` | preflight → craft → spec | craft sonrası **tasarım kapısı**; `needsCraftRoute` zayıf eksene göre hedeflensin | ↑↑ | **orta** | golden, 216 süpürme |
| `production/preflight.ts` | teknik `exportOk` | **dokunulmuyor** — döngüyü önlemek için | — | — | — |
| `types.ts` | `DesignSpec` | `craftScore` zaten var; `exportAllowed` taşıyıcısı netleştirilir | ↑ | düşük | tsc |

**Dokunulmayacaklar:** `/api/paxolab/run`, editor, export zinciri, auth, veritabanı, `VISUAL_CRAFT_WEIGHTS`.

---

## 5. Riskler

| risk | olasılık | azaltma |
|---|---|---|
| Sert blocker geçerli tasarımları engeller | **yüksek** | Önce ölçüm: 216 yüz + 324 iş×aile + 18 golden üzerinde blocker sayısı raporlanacak. Beklenen 0'dan büyükse **önce ressam düzeltilir**, kapı sonra açılır |
| 18 golden'dan bazıları ihlal taşıyor olabilir | **orta** | Golden'lar üretimin referansı; biri ihlal taşıyorsa bu **gerçek bir kusur** demektir → sahibe raporlanır, golden otomatik güncellenmez |
| `needsCraftRoute` hedefli olunca farklı arketip seçer | orta | Golden 0/0 zorunlu; varyasyon 0'da davranış değişmemeli |
| Döngü riski | düşük | Aday bütçesi mevcut 3 adımda kalır |

### 5.1 Faz 1 öncesi zorunlu ölçüm

Kapıyı açmadan önce şu çalıştırılacak: *"bugün kaç yüz `HIERARCHY_VIOLATION`, `DESIGN_CONTRACT_FRAME` veya `REQUIRED_INFO_MISSING` taşıyor?"* — 216 sıradan yüz, 324 iş×aile, 18 golden.

Sayı büyükse sıralama değişir: **önce ressamlar düzeltilir, kapı sonra.** Kapıyı açıp yüzlerce tasarımı engellemek "enforcement" değil, üretimi durdurmaktır.

---

## 6. Kabul ölçütleri (Faz 1)

```
Test A  zayıf kompozisyon + sert blocker yok   → onarım adayı denenir
Test B  hiyerarşi ihlali (display-line lockup) → exportAllowed = false
Test C  çerçeve sözleşmesi ihlali              → exportAllowed = false
Test D  temiz tasarım                          → exportAllowed = true
Test E  aday bütçesi aşılmaz (sonsuz döngü yok)
Test F  golden DNA 0 · hash 0 — kasıtlı değişiklik varsa gerekçesiyle raporlanır
```

---

## 7. Sahibin onayı gereken tek nokta

Faz 1'in **zemin** ayağı ölçümle çürüdü; yerine **ayrık sert ihlaller + hedefli onarım** kondu. Bu, planın ruhuna (*"ölçülen sinyal boşa gitmesin"*) uygun ama harfine değil.

Onay verilirse sıra: §5.1 ölçümü → sonuca göre ya kapı ya ressam → test → Faz 2.

---

## 8. UYGULAMA SONUCU (F-43) — ölçüm iki kez planı değiştirdi

### 8.1 Yaygınlık ölçümü: 192 ihlalin 129'u dedektör hatasıydı

`scripts/measure-blocker-prevalence.ts` (yeni, kalıcı) — §5.1'in zorunlu ölçümü:

```
BAŞLANGIÇ          216 süpürme   324 iş×aile   18 golden
HIERARCHY               7 (%3)       18 (%6)      0
CONTRACT_FRAME         39 (%18)      27 (%8)      1
REQUIRED_INFO          24 (%11)      72 (%22)     4

gerçek kusur 63 · YANLIŞ POZİTİF 129
```

Sahibin kuralı — *"blocker'ın gerçek render kusurundan mı hatalı scoring logic'ten mi geldiği raporlanmalı"* — ve
*"prevalence yüksekse önce ressam düzeltilir"*. %18 yüksek, üstelik çoğu dedektör hatası. **Kapı açılmadan önce düzeltildi.**

| blocker | kök neden | tür |
|---|---|---|
| `REQUIRED_INFO_MISSING` 100 | dedektör `BESİN DEĞERLERİ` arıyordu — F-37'de emekliye ayrılan **kit** yolunun yazımı | dedektör |
| `DESIGN_CONTRACT_FRAME` 29 | kart `data-art="title-card"` olarak çiziliyor, dedektör `data-frame=` arıyor | dedektör |
| `DESIGN_CONTRACT_FRAME` 22 | kompozisyon arketip ressamına ulaşmıyor; `paintFrame` bu iki tür için `''` dönüyor | render |
| `DESIGN_CONTRACT_FRAME` 16 | `line-scene` yuvarlak kenarı çiziyor ama işaretsiz | render |
| `HIERARCHY_VIOLATION` 25 | `line-scene` markayı 4.4 mm, başlığı 7.5 mm tavanla çiziyor — marka lider olamıyor | render |

**Golden'ların hiçbiri gerçek kusur taşımıyordu** — tek golden ihlali her iki sayımda da dedektör hatasıydı.
§5'teki "orta" riski böylece kapandı.

```
DÜZELTME SONRASI   216 süpürme   324 iş×aile   18 golden
üç blocker da            0            0             0        → 558 yüz, sıfır ihlal
```

Kapı **bugün hiçbir üretimi engellemiyor**. Regresyon için var, birikmiş iş için değil — sahibin
*"yüzlerce mevcut üretimi sessizce geçersizleştirme"* şartı sayıyla karşılandı.

### 8.2 Ayak B de ölçümle düştü

§3'ün B ayağı `focal/categoryFit/distinctiveness`'i onarım sinyali yapacaktı. Ölçüldü:

```
216 süpürme: 178/216 yüz (%82) onarım sinyali taşıyor
focal dağılımı: min 45 · p25 45 · medyan 45 · p75 60 · max 85
```

`studioFocal` odak öğesi panelin %6'sından küçükse 45, %6'da 85 dönüyor — medyan tam uçurumun dibinde.
**Dört yüzden birine değil, dördüne ateş eden okuma kusur dedektörü değildir.** Tetikleyici yapılsaydı 178 yüz
arketipini yeniden atardı; bu enforcement değil, üretimi durdurmaktır — §2'deki zemin hatasının aynısı.

**Karar:** sinyaller karnede **raporlanıyor, yönlendirmiyor**. Önkoşul: `studioFocal` kalibrasyonu (Faz 2 malzemesi).

### 8.3 Kapsam dışı bırakılan tek şey

`exportAllowed` karnede taşınıyor ama **export zincirine bağlanmadı** — sahibin dokunulmazlar listesinde
"export zinciri" ve `production/preflight.ts` var. `FINAL = technical AND design` birleşimi tek satır,
sahibin onayını bekliyor.

---

## 9. FAZ 1.5 (F-44) — iki açık madde kapandı, bir Faz 1 kararı geri alındı

### 9.1 Export topolojisi

Canlı zincir ölçüldü. `downloadSvg/downloadDxf/printPdf/downloadZip` **ölü kod** — hiçbir yerden çağrılmıyor.

```
UI onZip → api/credits → sunucu buildDeliveryZip → buildOutlinedExportFiles
        → buildUserExportFiles → buildExportBundle → buildCombinedSvg   ← tek darboğaz
```

| soru | cevap |
|---|---|
| `exportAllowed` hangi tip üzerinden taşınıyor | `VisualCraftScorecard.exportAllowed` (`brain/scoreVisualCraft.ts`) |
| final kararı kim veriyor | `buildCombinedSvg` — boyanmış yüzü taşıyan her builder ona iniyor |
| teknik karar nerede | `preflight.exportOk`, `production/preflight.ts:83` |
| en düşük riskli birleşme noktası | `production/exportDecision.ts` — tek fonksiyon, `buildCombinedSvg` ve UI ikisi de onu okuyor |
| export/editor/API davranışını bozar mı | Hayır. Teknik kapı aynen; ölü yardımcılar aynı kararı okuyor; API şekli değişmedi |

**Aynı ifadenin ikinci kopyası bırakılmadı.** İndirme düğmesi `preflight.exportOk` okumaya devam etseydi,
buton "hazır" derken exporter dosyayı reddedecekti.

**Sunucu.** `exportBundle.ts`'in 1. kuralı *"istemcinin verdicti asla güvenilmez"*. `craftScore` de preflight ile
aynı çağrı JSON'undan geliyor, bu yüzden sunucuda **yeniden türetiliyor**; aksi hâlde kapı tam paranın el
değiştirdiği yerde dekoratif kalırdı. Planı olmayan spec tasarım verdicti taşımaz — teknik kapı tek başına karar verir.

### 9.2 Kapıyı bağlamak dördüncü bir popülasyon ortaya çıkardı

`catalogExports` 9 testi kızardı: **katalog × sektör, 41 yüz** — Faz 1'in ölçmediği popülasyon.

| bulgu | adet | karar |
|---|---|---|
| `DESIGN_CONTRACT_FRAME` — yuvarlak kapak / oval etiket | 3 | **yanlış pozitif.** Ressam dikdörtgen çerçeveyi kesimin dilinde çiziyor (bezel / hairline ring), söylemiyordu. Halka artık bildiriyor |
| `REQUIRED_INFO_MISSING` — tam beyan sığmayan şekiller | 8 | **Faz 1 kararı geri alındı**, nota indirildi |

**Geri alma gerekçesi.** Tam beyan 18.2 mm ister, 60 mm kapağın yasal bandı 12–16 mm. Motor bilerek tablo çizmiyor
ve `ds-nutrition-fit` ile müşteriye gövde etiketini söylüyor — bu F-42'de karara bağlanmıştı:
*"a gate that demands a row of a table that is not there is testing the label's size, not its honesty."*
Sert blocker yapmak bir bölüm yukarıda düzeltilmiş hatayı tekrarlıyordu. Üstelik `nutritionTable` "sığmadı" ile
"renderer bozuldu" için aynı boş markup'ı dönüyor ve iz bırakmıyor — **ayırt edilemeyen şey dayatılamaz.**

### 9.3 `focal` neden 45'te sıkışıyordu

Olasılıklar tek tek elendi; kazanan **ledger blindness + missing semantic role**, eşik hatası değil.

```
focalRatio → ledger (ctx.boxes), yalnız kind ∈ {element, container}
  uygun kutu: ortalama 1.6 / yüz · 106 yüzde HİÇ YOK · 238 yüzde tek kutu
  kind='text' yüzünden dışlanan: ortalama 6.0 / yüz
  en sık kazanan: brand-mark → 147 yüz, panelin %2.9'u → 0.06 eşiğinin altı → sabit 45
  işaretleme ne diyor: en büyük grup `frame`, panelin %71.4'ü
  ledger ile işaretleme farklı kazanan: 416/558 (%75)
```

Elenenler: score clamp (45/60/85 fonksiyonun kendi sabitleri), koordinat uzayı (`specimen` %19.8,
`window` %36.2 — oranlar tutarlı), test fixture, normalizasyon.

**Çözüm yeni model değil.** Bilgi zaten `PlacedBox.id`'de. 558 yüzün sayımı net kopuş gösteriyor:

| kompozisyon taşıyıcısı | max panel payı | mobilya | max panel payı |
|---|---|---|---|
| `inner-card` | %59.9 | `brand-mark` | %8.4 |
| `window` | %59.2 | `brand-pill` | %6.9 |
| `specimen` | %57.3 | `claim-band` | %8.3 |
| `title-card` | %56.7 | `chip` | %3.0 |
| `plate` | %45.9 | `medallion` | %2.8 |
| `roundel` | %13.3 | `picto-*` | %0.6 |

Pozitif küme seçildi: yeni bir piktogram sessizce odak adayı olmamalı; yeni bir taşıyıcının alan-öncelikli
okunması iki hatanın hafif olanı. **`role` alanı eklenmedi** — id'nin zaten taşıdığı olgunun ikinci modeli olurdu.
Ayrıca `0.55 < r ≤ 0.6` bandı iki testin arasından düşüp 45 veriyordu; bantlar bitişik yapıldı.

```
ÖNCE   3 farklı değer · 45 → %49 · 85 → %32 · 60 → %19
SONRA  5 farklı değer · 60 → %58 · 85 → %31 · 35 → %8 · 45 → %2 · 40 → %1
onarım sinyali yaygınlığı: %82 → %60 (focal katkısı 139 → 45)
```

45 artık gerçekten *"odak var ama panelin %6'sından küçük"* demek; 35 *"ne odak ne alan"*.

### 9.4 Sinyaller hâlâ yönlendirmiyor

`repairSignals` `studioRepair.ts` içinde **hiç geçmiyor** ve bu bir testle sabitlendi. 3 adımlık aday bütçesi aynen
duruyor. Kalibrasyon `focal`'ı düzeltti; `categoryFit` (59) ve `distinctiveness` (51) bu fazın kapsamı dışındaydı ve
%60'ın çoğunu onlar üretiyor — aktifleştirme kararı için önce onların da ölçülmesi gerekir.
