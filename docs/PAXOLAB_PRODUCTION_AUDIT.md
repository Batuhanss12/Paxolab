# Paxolab — üretim öncesi kapsamlı audit

**Tarih:** 2026-09-19 · **HEAD:** `1dcc142` (commit yok) · **Tetikleyen:** sahibin dieline ekran görüntüsü — *"ön yüzü Antalya arka kısımları Konya"*, *"hayvanat bahçesi mi"*, *"artık production'a geçeceğiz ama her şey daha karmaşık oluyor"*.

Aşağıdaki her satırın arkasında ya okunmuş kod, ya çalıştırılmış ölçüm, ya da uygulamada uçtan uca denenmiş bir akış var. Ölçüm yapılmadan yazılmış tek bir iddia yok.

**Kendi iddialarımdan yedisini düzelttim**, hepsi yerinde işaretli: (1) "sistem örtüşmesi %23" kötü bir vekildi → imza taşıma; (2) "referans 13 panelden 2'sini çiziyor" — filtrem `<path>` sayıyordu; (3) "12.142 satır *ulaşılamayan* kod" — 85'i statik olarak ulaşılabilirdi, doğrusu *çalışma zamanında ölü*; (4) **C2 tamamen geri çekildi** — `textContent` ekran okuyucunun okuduğu şey değil; (5) **C5 hafifletildi** — sistem zaten güvenli düşüyor ve kendini onarıyor; (6) **Ö-2 geri çekildi** — bir satırı okuyup devamını okumamışım, sonuç sinyali çalışıyordu; (7) **C1'in eşiği düzeltildi** — kırılma 1280'de değil 768'de.

Bu düzeltmeler listenin zayıflığı değil işleyişi: ölçülmeyen her iddia, ölçüldüğünde ya sertleşti ya düştü.

---

## 0. Kısa cevap

**Motor iyi, teslimat değil.** Ön yüzler gerçekten profesyonel seviyede. Kusur, ön yüzün dışında kalan her şeyde: arka panel, yan panel, marka işareti ve hayvan çizimleri. Sahibin gördüğü şey bir izlenim değil, ölçülebilir bir kusur — ve kök nedeni tek bir satırda.

Bu hâliyle **production'a açılmaz.** Üç madde (A1, A2, A3) müşterinin matbaaya göndereceği dosyada görünür; A3 ayrıca hukuki risk.

---

## 1. Kök neden — tek satır

```ts
// boxLayouts.ts:313 (paintBoxBack) ve :476 (paintBoxSide)
const arche = d.archetype as BoxArchetype
```

F-32'de sekiz yeni arketip yazıldı. Hepsi **yalnız ön yüz** ressamı. `paintBoxBack` ve `paintBoxSide` gelen arketipi `as BoxArchetype` diye zorla eski on stüdyo adının birine kabul ediyor; sekiz yeni ad bu iki fonksiyonda **hiç tanınmıyor** ve sessizce varsayılan dala düşüyor. `as` kullanıldığı için TypeScript de uyarmıyor — kapı yok, test yok.

Sonuç: müşteri "kemer taç" seçiyor, kemeri yalnız dört panelden birinde alıyor.

---

## 2. Ölçüm — kartonun panelleri

`scripts/measure-panel-coherence.ts` (yeni, kalıcı) · 108 kutu brief'i × 2 repertuar · 1531 panel

| repertuar | panel | zemin aynı | **imza taşıma** | tip örtüşmesi | **işaret bölünmesi** |
|---|---:|---:|---:|---:|---:|
| studio | 917 | 46% | **75%** | 85% | 78/917 (%8) |
| reference | 614 | 100% | **54%** | 84% | **116/614 (%19)** |

**İmza taşıma** = ön yüzü *o arketip* yapan öğelerin (kemer penceresi, mühür, kurdele, plaka, yıldız sırası, çerçeve, hero) başka bir panele geçme oranı.

**İşaret bölünmesi** = ön yüz kendi işaretini çizerken bir yan/arka panelin *ortak sektör işaretini* takması. Ekran görüntüsündeki kusur birebir bu: önde **yuvarlak madalyon**, yanlarda **üçgen**. Aynı kartonda iki marka işareti.

> **Kendi ölçümümü düzelttim (1).** İlk turda "sistem örtüşmesi %23, iki repertuarda da çökük" yazmıştım. O ölçü `data-art` kümelerinin Jaccard'ıydı ve arka paneli, meşru olarak taşıdığı yasal kolon ve besin tablosu yüzünden cezalandırıyordu — yani kötü bir vekil. İmza taşımaya geçince gerçek tablo çıktı: **studio tutarlı (%75), referans değil (%54).** Studio kartonu tam boy render'da gerçekten tutarlı: mermer alan, altın, üçgen işaret ve REBULL dört panelde de var.

> **Kendi ölçümümü düzelttim (2).** Bir ara "referans kartonlar 13 panelden yalnız 2'sini çiziyor" diye okudum. Yanlıştı: filtrem `<path>` sayıyordu, referans yan panelleri rect ve gradient ile çiziliyor. Paneller boş değil — **yanlış sistemde dolu.**

**Görsel delil:** `scripts/render-panel-coherence.ts` (yeni, kalıcı) → `.compositions-out/panel-coherence.html`. Dört karton (studio mermer, studio karanlık lüks, referans kemer taç, referans gravür kolaj) × dört ana panel, tam boy.

---

## 3. Düzeltilmesi gerekenler (production'ı tek başına durduranlar)

| # | Kusur | Delil | Neden şimdi |
|---|---|---|---|
| **A1** | **Sekiz referans arketipin arkası ve yanı yok.** İmza %54, işaret bölünmesi %19. Aynı kusur etiket arkasında da var (`paintLabelBack` / `paintRoundBack` arketipi hiç okumuyor). | `boxLayouts.ts:313,476` · ölçüm §2 · `panel-coherence.html` | Müşterinin gördüğü ilk şey. Sahibin raporunun tamamı bu. |
| **A2** | **Gravür hayvan kümesi kabul edilebilir değil.** Sahip reddetti. Ölçüm kötü haberi büyütüyor: hayvan **216 kolaj yüzünün 204'üne** (%94) çiziliyor — yani zayıf çizim geniş yüzeye yayılmış durumda. | `creatures.ts` · `render-creatures.ts` | Kalite eşiği sahibin gözüydü; göz "hayır" dedi. |
| **A3** | **Uydurma besin değeri teslim dosyasında.** Kahve etiketinin arkasında "Enerji 2 kJ / 1 kcal · Protein 0,1 g". Bir gıda etiketinde uydurma besin beyanı hukuki sorumluluk. | Uygulamada görüldü (Elite Brew · kahve, arka yüz) | Matbaaya giden dosyada. |

---

## 4. Geliştirilmesi gerekenler

| # | Konu | Ölçü | Not |
|---|---|---|---|
| B1 | **Ulaşılamayan eski kit yolu hâlâ pakette** | `src/engine/artwork` **12.142 satır**, motorun %23'ü | Planın 9. promptu. Pakette taşınıyor (gz 392 KB). |
| B2 | **Motor büyüyor** | 45.803 → **52.072 satır** (+%14, bu fazlarda) | Sahibin "her şey daha karmaşık oluyor" cümlesinin sayısı. `studio/` tek başına 15.025 satır / 38 modül. |
| C1 | **Dar ekranda düzen bozuluyor** ✅ **kapandı** (iddia düzeltildi) | Ölçüldü: 1440 / 1280 / 1100 / 1024 / 900 **temiz**; kırılma **768'de** başlıyor, 390'da sayfa **782 px** kalıp yana kayıyordu | *"1280 altında"* yanlıştı — tarayıcı panelinin dar olmasını uygulamanın kusuru sanmışım. İki sebep: üst çubuk `flex-wrap: nowrap`, ve `grid-template-columns: var(--left) 1fr` — **sabit grid kolonu küçülmez**. → F-40 |
| ~~C2~~ | ~~**Kart düğmelerinin metninde CSS sızıntısı**~~ — **iddia geri çekildi** | Erişilebilir ad hesaplandı: `"1 mermer · Mermer zemin… · Bunu seç"` — temiz | **Benim ölçüm hatam.** `textContent` ile ölçmüştüm; o `aria-hidden` altındaki ve `<style>` içindeki metni de kapsar. Kartın önizlemesi zaten `aria-hidden` sarmalayıcısında, `@import` dizesi ekran okuyucuya **hiç gitmiyor**. Düzeltilecek bir şey yoktu. Kalan küçük not: erişilebilir adda kelimeler bitişik okunuyor (`1mermerMermer zemin…`) — cila işi, kusur değil. |
| C3 | **Sohbette "tasarımları değiştir" repertuarı değiştirmiyor** ✅ **kapandı** | Denendi: yalnız yeniden çiziyordu ("Bunlarla yeniden çiziyorum") | Düğmenin kendi yazısı sohbette başka bir iş yapıyordu. Artık iki yön de sohbetten çalışıyor; **ilk sürümde "ilk tasarımlara dön" numaralı seçiciye takılıp "1. yön" diye cevaplandı** — takas olmuştu ama cümle yanlıştı. → F-41 |
| C4 | **Durum bildirmeyen düğmeler** ✅ **kapandı** | 9 kontrol zaten ARIA durumu taşıyordu, **9'u taşımıyordu** — `is-active` bir renktir, durum değil | İddiam Ön / Arka ile sınırlıydı; yazdığım statik kapı **5 tanesini daha** buldu, aralarında **ana sekme çubuğu** (birincil gezinme) vardı. → F-38 |
| C5 | **Geçersiz aile sessizce yutuluyor** — **iddia hafifletildi** | Ölçüldü: geçersiz pin **pinsizle birebir aynı** tasarımı veriyor, ve brief gerçek aileyle **yeniden damgalanıyor** (`dark-luxe`) | *"Sessiz yanlış tasarım"* fazla ağırdı: sistem zaten güvenli düşüyor ve kendini onarıyor — `studioFamily` tipli, `hintsFromFamily` zaten doğruluyor. Erişilebilir tek yol eski oturumdan gelen bayat bir anahtar. Davranış kapıyla sabitlendi. **Kalan gerçek boşluk kapandı:** düşen pin artık sohbette söyleniyor. → F-38, F-41 |

---

## 5. Uçtan uca denenen akışlar (uygulamada, bu oturumda)

| Akış | Sonuç |
|---|---|
| Boş sayfadan zengin brief → ilk tasarım | **Çalışıyor.** Tek mesajda marka + ürün + sektör + yüzey yakalandı. **4 kullanıcı turu + 1 düğme** ile 8 tasarım. |
| Numarayla seçim (`1`, `1. yön`) | **Çalışıyor.** |
| Yapı seçimi + ölçü + "Tasarımı başlat" | **Çalışıyor.** |
| Dieline / 2D Vektör / Karşılaştır / 3D / Üretim sekmeleri | **Hepsi açılıyor ve çiziyor.** |
| Üretim ön kontrolü | **23/27 geçti.** Açık 4: barkod GS1 değil, örnek legal, stüdyo prova, taşma/güvenli kilitli değil — hepsi prova öncesi dürüst. |
| "Baskıya hazırla" düğmesi | **Çalışıyor.** 23/27 → **25/27**, prova açıldı. Sihirli cümle artık zorunlu değil. |
| İndirme kapısı | **Kapalı.** "Baskı dosyalarını indirmek için sağ üstten giriş yap." |
| "Tasarımları değiştir" düğmesi | **Çalışıyor.** 8 studio ailesi → 8 referans ailesi (kemer taç, gravür kolaj, düz silüet, kurdele arma, mono ızgara, desen zemin, asit blob, iç sanat kartı). |
| "Yeni" (sıfırlama) | **Çalışıyor, onay soruyor.** İlk denememde hiçbir şey olmadı sandım — `window.confirm` tarayıcı panelinde bastırılıyormuş; **uygulama hatası değil**, benim ortamımın kusuru. |

---

## 5.1 Aynı oturumda yapılanlar (audit sonrası)

| # | Durum | Sonuç |
|---|---|---|
| **A1** | ✅ **kapandı** | `as BoxArchetype` altı çağrı yerinden kalktı; `paintReferenceSkin` arka, iki yan ve kapağı arketibin kendi ana hattıyla giydiriyor; etiket arkası hem giysiyi hem kendi tipografi sistemini aldı. **İşaret bölünmesi 116 → 0**, **imza taşıma %54 → %65** (studio %62). 1 mutasyon kanıtı. → F-34 |
| **A2** | ✅ **kapandı** (sahip kararı: *tamamen kaldır*) | `creatures.ts` + testi + render betiği silindi; kolajın üçüncü plakası ikinci bir eşlikçi bitki. Motor 7 modül küçüldü. **Dürüst not:** referanslar botaniğin üstüne hayvan seriyor; o katman artık yok. → F-33a |
| **yeni** | ✅ **kapandı** | A1'in kapısı, mevcut süpürmelerin görmediği bir kesişimde **7 dışa aktarılamayan tasarım** buldu (18 galeri işi × 18 aile = 324 eşleşme). Hepsi geniş-alçak yüzlerde. Beş ressam düzeltildi, `sweep-job-families.ts` kalıcı araç oldu. **324 → kirli 0, engelli 0.** → F-35 |
| **A3** | ✅ **kapandı** | Besin değerleri artık boş ve tablo `· ÖRNEK` diye işaretli; yeni ön kontrol `ds-nutrition-sample` müşteriye indirmeden önce söylüyor. Yol boyunca **ters bir kapı** bulundu: mevcut gıda kapısı `/>100 g</` arayarak *uydurma değerin kendisini zorunlu kılıyordu*. → F-36 |
| **B1** | ✅ **kapandı** | Eski kit yolu emekliye ayrıldı + ikinci ölü ada (`graphicLibrary`). Motor **52.072 → 46.471 satır**, paket **gz 390 → 335 KB**. → F-37 |
| **C2** | ⛔ **geri çekildi** | Benim ölçüm hatamdı — `textContent` ekran okuyucunun okuduğu şey değil. Kartta kusur yok. |
| **C4** | ✅ **kapandı** | 9 düğmeye ARIA durumu eklendi; statik kapı 5'ini benim gözümden kaçmışken buldu. → F-38 |
| **C5** | ✅ **kapandı** (hafifletilmiş) | Davranış zaten doğruydu; kapıyla sabitlendi. Müşteriye bildirim hâlâ açık. → F-38 |
| **C1** | ✅ **kapandı** | 390'a kadar yatay kaydırma yok, örtüşme yok. Ölçüm iddiayı düzeltti: kırılma 1280'de değil 768'de başlıyormuş. → F-40 |
| **C3** | ✅ **kapandı** | Repertuar takası sohbetten çalışıyor, ve düşen aile pini artık söyleniyor. → F-41 |
| B2 | ⬜ açık | F-37 ile büyük ölçüde karşılandı: motor 52.072 → 46.471 satır, paket gz 390 → 336 KB. |

**Doğrulama (hepsi bu oturumda):** `tsc` 0 · lint 0 hata · **947/947 SPA + 3 todo** · 105/105 sunucu · build OK (gz 392 → **335 KB**) · golden **DNA 0 · hash 0** · `measure-repertoires` 216×2 kirli 0/0 · `sweep-job-families` 324 kirli 0 · uygulamada uçtan uca denendi.

### Emekliliğin açığa çıkardığı bulgu — **kapandı**

Öğrenme katmanının kapı testleri yalnızca **emekli yolda** koşuyordu. Stüdyo yoluna taşıyınca bir gerçek boşluk çıktı, bir de benim yanlış okumam:

| # | Bulgu | Durum |
|---|---|---|
| **Ö-1** | **Geri bildirim kanıtı birikmiyordu.** `observeFeedback` stüdyo günlüğünde kit `avoid-motif` önerisini düşürüp yerine **ekrandaki arketibi adlandıran** öneriler koyuyor, `aggregateObservations` de öneriye göre gruplayınca aynı şikâyetin üç turu üç ayrı tek-örneklik grup oldu. Ölçüldü: line-scene, line-scene, noir-stack → kanıt **2/1**, 3 örneklik marka eşiği erişilemez. Kapı sonsuza kadar gözlemleyip hiç aday üretemiyordu. | ✅ **kapandı** — ekran bağımsız bir yoldaş sinyal (**süs ekseni**) eklendi. Ölçüldü: örnek **3**, tutarlılık **1** → marka adayı → doğrulandı → **aktif**; sonraki tasarım `quiet` süsle geliyor ve gerekçesinde söylüyor. → F-39 |
| ~~**Ö-2**~~ | ~~Sonuç sinyali stüdyoda ölü~~ — **iddia geri çekildi** | **Benim okuma hatam.** `observeOutcome`'un `log.studio ? [] : …` satırını okuyup devamını okumamışım; hemen altında kendi stüdyo bloğu var. Ölçüldü: 5 yıldız → **6 sonuç gözlemi** (`studio-archetype` + `studio-background`, `prefer: true`, support 1). Çalışıyordu. |

Sonuç: **marka bilgisi artık gerçek kullanımdan aktifleşiyor** ve uçtan uca kapıyla tutuluyor — gözlem → desen → aday → doğrulama → aktif → bir sonraki tasarım → geri alma.

---

## 6. Önerilen sıra

Önce müşterinin gördüğü, sonra taşıdığımız yük.

1. **A1 — panel sistemi.** Sekiz referans arketipin her biri kendi arkasını ve yanını çizsin; `as BoxArchetype` kalksın, arketip tanınmazsa tip hatası versin. Kapı: imza taşıma referansta ≥ %75 (studio'nun bugünkü seviyesi), işaret bölünmesi **0**. Etiket arkası da aynı turda.
2. **A3 — uydurma beyan.** Besin değerleri ya brief'ten gelsin ya hiç çizilmesin; "örnek" olduğu panelde okunur biçimde yazılsın.
3. **A2 — hayvan kümesi.** Üç seçenek var, karar senin: **(a)** tamamen kaldır (kolaj üç bitkiye döner, F-32'deki hâli), **(b)** yalnız mühür ölçeğinde (≤ 8 mm) bırak — o boyutta çizim kalitesi görünmez, **(c)** kalite için yeniden yaz. Ölçüm (a) ve (b)'yi destekliyor: bugün hayvan medyan **21 mm** çiziliyor, yani tam görünür boyutta.
4. **C2, C4, C5** — küçük, ucuz, hepsi kapı ile kanıtlanabilir.
5. **B1** — eski kit yolunu emekliye ayır. Motorun %23'ü ve paket boyutu.
6. **C1** — responsive.

**Her adımın sonunda:** `tsc` · `vitest` · `test:server` · `lint` · `build` · `diff-studio-golden` (DNA 0 · hash 0) · ilgili ölçüm betiği. Her yeni kapı mutasyonla kanıtlanır. **Commit yapılmaz.**
