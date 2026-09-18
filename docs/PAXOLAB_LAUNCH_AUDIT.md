# Lansman audit — 2026-09-18

Ölçülerek hazırlandı. "Doğrulandı" yazan her satırın arkasında bu oturumda çalıştırılmış bir ölçüm
var; doğrulayamadıklarım ayrı başlıkta ve neden doğrulayamadığım yazıyor.

---

## 1. Doğrulanan durum

| Kontrol | Sonuç |
|---|---|
| `tsc -b` | 0 hata |
| `oxlint` | 0 hata (yalnız uyarı) |
| SPA testleri | **939/939** |
| Sunucu testleri | **95/95** |
| Üretim derlemesi | temiz (`dist`, 1.25 MB / 353 KB gzip — ihracatçı sunucuya taşındı, 805 KB tarayıcıdan çıktı) |
| Studio golden (18 donmuş yüz) | **DNA 0 · hash 0** (F-13'te 5 satır bilerek oynatıldı, tablo güncellendi) |
| `/api/health` | `{ ok: true, db: "ok" }` |
| Katalog × sektör (katalogun önerdiği 41 kombinasyon) | **41/41 export ediyor** (oturum başında 33/41) |
| Etiket formatları (yuvarlak / oval / askı / kart / düz, 4 brief × 3 ölçü) | kesim taşması 0, çarpışma 0, punto tabanı altı 0 |
| Stil · mizaç · varyasyon · yön | dördü de çalışıyor (aşağıda) |
| Misafir akışı, tarayıcıda uçtan uca | brief → sorular → format → üretim → doğru tasarım |

**Aşamalar, ölçülen davranış:**

- **Ruh hali:** 6 mod, her iki yüzeyde 6 farklı yön üretiyor; hiçbiri çarpışmıyor, hepsi export ediyor.
- **Mizaç:** 6 tonun altısı da isteneni çiziyor, en az 4 farklı zemin.
- **Varyasyon:** 6 varyasyon → **6 farklı yüz, 1 zemin rengi.** Kural korunuyor: varyasyon resmi
  değiştirir, modun rengini değiştirmez (bir kredi = aynı kararın altı okunuşu).
- **Yön:** **8** farklı aday (dört ayrı görsel aile), **dördü de boyanmış** geliyor — seçili olan
  dâhil — ve üretim biter bitmez tam boy bir seçim ekranı olarak sunuluyor. Birini seçmek gerçekten
  onu çiziyor. Sistemde peyzaj yönü yok.
- **Karton bütünlüğü:** on ailenin hepsinde ön, arka, yan, kapak ve kapak dili aynı zemini taşıyor;
  panel farkı anatomide, görsel sistemde değil.

---

## 2. Lansman öncesi zorunlu — doğrulayamadıklarım

Bunları gerçek hesap/anahtar olmadan çalıştıramam. `LAUNCH_CHECKLIST.md`'de zaten duruyorlar;
**ödeyen müşteri açmadan önce elle tıklanmaları gerekiyor.**

| # | İş | Neden ben yapamadım |
|---|---|---|
| 1 | Kayıt / giriş / oturum yenilemeden sonra kalıcı mı | Gerçek kullanıcı kaydı gerekiyor |
| 2 | Kredi sayacı: 50 başlangıç, üretim 3, revizyon 2, yetersizde 402 | Hesap gerekiyor |
| 3 | iyzico sandbox: checkout → callback → **tek sefer** kredi | Sandbox anahtarı yok |
| 4 | Admin paneli + `FORMA_ADMIN_EMAIL`, admin olmayana 403 | Hesap gerekiyor |
| 5 | **SQLite yedek + geri yükleme provası** | Canlı veriyle yapılmalı |
| 6 | `npm run smoke:api` çalışan sunucuya karşı | Sunucu sizin elinizde |

> 5. maddeyi atlamayın. Veritabanı tek dosya (`server/data/forma.sqlite` + WAL); yedeği siz almazsanız
> kimse almıyor. Gecelik `VACUUM INTO` + kutu dışına kopya, ve **bir kez** geri yükleme denemesi.

---

## 3. Bilinen sınırlar (kararı sizin)

| # | Konu | Durum |
|---|---|---|
| A | **Yatay ölçekleme yok.** SQLite tek dosya; API tek makinede çalışmalı. | Mimari tercih. Yük artarsa Postgres'e geçiş gerekir. |
| B | **Örnek legal metin.** Her üretimde `ds-sample-legal` uyarısı: içindekiler/uyarı metinleri örnek, besin değerleri `— g`. | Kasıtlı dürüstlük. Müşteri kendi metnini girmeli; arayüzde bunun daha görünür olması iyi olur. |
| C | **Barkod örnek.** GS1 değil, sohbet bunu açıkça söylüyor. | Kasıtlı. |
| D | **Görme kanalı canlı sağlayıcıyla denenmedi.** Yalnız sahte sağlayıcı testleri var; maliyet ve gecikme bilinmiyor. | `VITE_FORMA_LLM_URL` boşken sessizce devre dışı — açmadan önce bir brief üzerinde ölçün. |
| E | **Golden 13/34 şablonu kapsıyor.** Yeni formatlar (yuvarlak, oval, askı, kart) donmuş tabloda yok; onları `catalogExports.test.ts` ve `labelBackShapes.test.ts` koruyor (davranış, birebir piksel değil). | Kabul edilebilir; isterseniz golden genişletilir. |
| F | **Paket 1.26 MB** (357 KB gzip), kod bölme yok. | İlk yükleme yavaş olabilir; `dist/assets/fontOutlines` 800 KB'ı tek başına. |
| G | **Önizleme kenar çizgisi koyu tuval varsayıyor.** Açık temalı bir yere gömülürse ince çizgi kaybolur. | Bugün yalnız stüdyoda kullanılıyor. |
| H | **Ç-1 / Ç-2 (çizici).** Yumuşak kenar kapanamıyor: blur RIP'te rasterleşir, gömülü raster brief'in renklerini giyemez. | Sahip onaylı erteleme. |

---

## 4. Bu oturumda kapatılan kusurlar

Hepsi ölçülerek bulundu, düzeltildi, testi yazıldı; ikisi mutasyonla kanıtlandı.

**Müşteriye ulaşan hatalar**
1. İlk mesajdaki brief yutuluyordu — 4 sıradan ilk mesajın 3'ünde marka/sektör/ölçü atılıyordu.
2. Çok kelimeli **ürün adı** kırpılıyordu: "Fleur de Nuit" → "DE".
3. Çok kelimeli **marka adı** kırpılıyordu: "Elite Brew" → "Elite" — sayfanın en büyük puntosunda.

**Baskıyı bozan hatalar**
4. Yuvarlak/oval etiketin **arka yüzü** kesim çizgisini aşıyordu (barkod %117–121 yarıçap).
5. Askı etiketinin arkasında üretici satırı 1.7 mm taşıyordu.
6. Nota piramidi sütun başlıkları dar kartonda üst üste biniyordu.
7. `legalColumn` `maxBottom` sözünü tutmuyordu (dar bantta çarpışma).

**Export'u blokleyenler (8/41 → 0/41)**
8. Kısa kutu arkasında hikâye metni zorunlu regülasyon bloğunun yerini yiyordu.
9. Sektör blokları (nota/besin tablosu) aynı ters önceliğe sahipti.
10. Arka başlığı yalnız genişliğe göre ölçekleniyordu (40 mm arkanın 18 mm'si başlık).
11. Kapı `İÇERİK` arıyordu, boyacı `İÇİNDEKİLER` yazıyordu.

**Görsel/arayüz**
12. Yuvarlak etiketin arkasında beyaz dikdörtgen kart + dikdörtgen kontur.
13. `preserveAspectRatio="none"` daireyi eziyordu.
14. Etiket önizlemesi sabit 420 px tavanıyla tuvalin %45'ini kaplıyordu → %99.
15. Hiyerarşi ters dönüyordu (marka 2.4 mm ≤ ürün 2.6 mm) — sahibin "gevşemesin" dediği kural.

---

## 5. Önerilen sıra

1. **Bölüm 2'deki altı maddeyi elle geçin** (yarım gün). Özellikle yedek provası.
2. **Kapalı grupla açın** — 5–10 kişi. Bu oturumun dersi net: 803 test yeşilken tıklamayla üç hata
   çıktı; kalan risk kod kalitesi değil, **denenmemiş yollar**.
3. Render'a deploy edin (kalıcı disk + `FORMA_DB_PATH`). Mimari taşınabilir; yük artarsa Hetzner.
4. İlk geri bildirimlerden sonra B (legal metin görünürlüğü) ve F (kod bölme) maddelerine bakın.

---

## 6. Ne commit edilmedi

Çalışma ağacında ~100 değişmiş dosya var; **hiçbiri commit edilmedi** (duran talimat). Deploy öncesi
commit gerekiyor. CI zaten her push'ta build + lint + iki test paketini çalıştırıyor.
