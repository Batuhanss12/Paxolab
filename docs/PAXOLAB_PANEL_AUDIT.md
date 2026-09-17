# PAXOLAB — PANEL & BAĞLANTI AUDIT RAPORU (Admin + Müşteri)

**Tarih:** 2026-09-17
**Kapsam:** Site panelleri (`site/src/components/panel/*`), stüdyo auth/panel bağlantıları (`src/api/*`, `AuthPanel`), API yüzeyi (`server/app.ts`, `orgs.ts`, `billing/*`, `credit/*`), auth akışları (password + Google OAuth + handoff).
**Yöntem:** Kodda olmayan sistem "var" sayılmadı. Her bağlantı iki uçtan da okundu (UI çağrısı ↔ route tanımı). Doğrulama: `npm run test:server` (59/59 PASS), `npm test` (502/504 PASS), `npm run build:site` (**FAIL — tip hatası**).
**Kural:** Kod değişikliği yapılmadı; bu rapor sadece tespit + faz planı içerir.

---

## 1. YÖNETİCİ ÖZETİ

Panel altyapısı (DEV4 commit'i) büyük ölçüde kuruldu: admin panelinin 13 bölümü, müşteri panelinin 7 bölümü, ekip/firma sistemi (davet, koltuk, ortak cüzdan) ve Google OAuth çalışıyor. Server testleri tamamen yeşil.

Ancak iş **üç noktadan yarım**:

1. **Site production build'i kırık** — panel dosyalarında 6 TypeScript hatası var; `npm run build:site` tip kontrolünü geçemiyor.
2. **Ekip davet bağlantısı ölü uç** — kopyalanan davet linki `/hesap?invite=…` adresine gidiyor ama bu bölümde davet işleyen kod yok (davet yalnızca `/hesap/team` altında işleniyor).
3. **Kredi yükleme (top-up) akışının UI girişi yok** — `POST /api/billing/checkout` hiçbir arayüzden çağrılmıyor; müşteri panelinde "Kredi yükle" butonu, stüdyoda paket satın alma ekranı bulunmuyor.

| Alan | /100 | Not |
|---|---:|---|
| Panel API yüzeyi (server) | **80** | Kapsamlı, korumalı, testli; plan/organizasyon endpoint'leri hazır |
| Admin paneli UI | **70** | 13 bölüm bağlı; plan düzenleme + ekip detay UI'ı eksik |
| Müşteri paneli UI | **55** | Okuma ağırlıklı; top-up yok, profil yönetimi yok, davet akışı kırık |
| Bağlantılar (site↔stüdyo↔API) | **60** | Auth/handoff sağlam; proje deep-link, top-up, davet yarım |
| Build/CI sağlığı | **40** | Site build tip hatasında patlıyor; 2 motor testi kırmızı |
| **GENEL PANEL PLATFORMU** | **~60** | İskeet tamam, bağlantı ve tamamlama fazı gerekli |

---

## 2. SİSTEM HARİTASI (paneller + bağlantılar)

```
SITE (Next :3000)                      STÜDYO (Vite :5173)                 API (Hono :8787)
├── Header: Giriş/Kayıt (AuthModal)    ├── AuthPanel                       ├── /api/auth/*  (password + Google)
│   └→ /api/auth/login|register        │   ├→ ?handoff= tüket (base64)     ├── /api/auth/google/* (OAuth)
├── /auth/callback → exchangeHandoff   │   ├→ bakiye: /api/credits/balance ├── /api/auth/handoff (tek kullanımlık)
├── /hesap/[[...section]] (CustomerApp)│   ├→ Panel/Yönetim linkleri → site├── /api/projects (CRUD)
│   ├── özet, projeler, kredi,         │   ├→ #billing → /hesap/credits    ├── /api/credits (balance/reserve/commit/refund)
│   │   abonelik, kullanım,            │   ├→ generate/revise kredi        ├── /api/billing (packs/plans/orders/checkout/
│   │   hesap, ekip                    │   │   reserve→commit/refund       │   subscription/usage/ledger/subscribe/cancel)
├── /admin/[[...section]] (AdminApp)   │   └→ bulut proje senkronu         ├── /api/design/operations (quote/classify/reserve)
│   └→ 13 bölüm → /api/admin/*         ├── /billing/mock-pay (MockPay)     ├── /api/orgs (ekip: üye/davet/koltuk/kullanım)
├── /firma, /en/company → davet        └── MockPayPage (App.tsx)           └── /api/admin/* (25+ route, role=admin)
└── StudioLink (handoff'lu stüdyo linki)
```

Auth depoları: site `grapxor.site.auth.v1`, stüdyo `forma.auth.v1` — geçiş `?handoff=` (site→stüdyo, base64 JSON) ve `/api/auth/handoff` (Google) ile.

---

## 3. ÇALIŞAN BAĞLANTILAR (doğrulanmış)

| # | Bağlantı | Durum | Kanıt |
|---|---|---|---|
| 1 | Site giriş/kayıt → role'e göre `/hesap` veya `/admin` yönlendirmesi | ✅ | `AuthModal.onSubmit` → `customerHref`/`adminHref` |
| 2 | Google OAuth: modal → `/api/auth/google` → callback → `/auth/callback?handoff=` → panel | ✅ | `googleAuthRoutes.ts` (state + handoff TTL, next-url allowlist) |
| 3 | Site→Stüdyo handoff (`?handoff=` base64) | ✅ | `AuthPanel.tryConsumeHandoff` → `forma.auth.v1` |
| 4 | Stüdyo→Site: "Panel"/"Yönetim" linkleri, `#billing`→`/hesap/credits` | ✅ | `AuthPanel` |
| 5 | Müşteri paneli veri yükleri: projects, subscription, credits+bucket, usage, ledger, orders, plans | ✅ | `CustomerApp.boot` ↔ `server/app.ts` route'ları |
| 6 | Abonelik seç/iptal (müşteri paneli + stüdyo `BillingPanel`'siz: panel abonelik butonu) | ✅* | `POST /api/billing/subscribe`, `/cancel` — *ödeme kapısı yok, bkz. P0-5 |
| 7 | Admin: stats, billing/overview, users+arama, kullanıcı detay (bakiye/bucket/rezerv/abonelik/proje/defter/sipariş/işlem), rol değişikliği, kredi adjust, projeler+detay, oturumlar+detay, abonelik+yenile, siparişler, operasyonlar, ekipler, olaylar, iadeler, plan okuma, operasyon maliyeti düzenleme | ✅ | `AdminApp` ↔ `admin.*` route'ları; son-admin + kendi rolünü düşürme koruması server'da |
| 8 | Ekip sistemi: oluştur, davet (koltuk limiti + bekleyen davet sayımı), kabul (e-posta eşleşmesi, süre), çıkar (sahip koruması, admin-admin kuralı), yeniden adlandırma | ✅ API | `orgs.ts` + `orgs.test.ts` (233 satır test) — *link akışı kırık, bkz. P0-2 |
| 9 | Ekip üyelerinin kredisi sahip cüzdanından düşer | ✅ | `reserveCredits` → `resolveBillingUserId`; `/api/credits/balance` org-farkındalı |
| 10 | Stüdyo kredi akışı: reserve → commit/refund + idempotency (`clientRequestId`) | ✅ | `App.runGenerate`, `credits.ts` |
| 11 | Mock ödeme sayfası `/billing/mock-pay?orderId=` | ✅* | `MockPayPage` — *sipariş ancak API ile elle oluşturulursa ulaşılabilir, bkz. P0-3 |
| 12 | Güvenlik tabanı: CORS allowlist, security header, 2 MiB gövde limiti, auth/checkout rate limit, health | ✅ | `security.ts`, `/api/health` |
| 13 | SEO: robots/sitemap panelleri (`/hesap`, `/admin`, `/firma`, auth) dışlıyor | ✅ | `robots.ts` |
| 14 | Server testleri: 7 dosya / 59 test | ✅ | `npm run test:server` |

---

## 4. KRİTİK BULGULAR (P0 — kırık / yarım)

### P0-1 · Site production build kırık (6 tip hatası)
`npm run build:site` → "Failed to type check." Panel dosyalarında:

| Dosya | Hata |
|---|---|
| `site/src/components/console/TeamSection.tsx:76` ve `:96` | `load(session)` — `session: AuthState \| null` tipli değere null guard yok |
| `site/src/components/panel/CustomerApp.tsx:106` | `.catch(() => ({}))` birleşim tipi daraltmıyor: `use.usage` / `use.operations` erişilemiyor |
| `site/src/components/panel/CustomerApp.tsx:107` | Aynı sorun: `led.ledger` / `led.transactions` |

**Etki:** Deploy edilemez. `next dev` çalışır ama tip güvenliği yok.
**Çözüm:** `load` çağrılarında null guard; catch fallback'lerine tipli boş yanıtlar (`{ usage: [] }` vb.).

### P0-2 · Ekip davet akışı ölü uca gidiyor
- `TeamSection` kopyalanan linki üretir: `${origin}/hesap?invite=<token>` (EN: `/en/account?invite=`).
- Ancak `CustomerApp` **yalnızca** `section === "team"` iken `TeamSection`'ı mount ediyor; kök bölümde `?invite=` parametresini **okuyan hiçbir kod yok** (dosyada "invite" geçmiyor).
- Ek kopukluk: davet edilen kişi **girişli değilse** `boot()` ana sayfaya yönlendirir ve token query'de kaybolur. Davet, e-posta eşleşmesi gerektirdiği için (server doğru yapıda) kullanıcının önce o e-postayla giriş yapması gerekir — akış bunu desteklemiyor.
- `/firma` ve `/en/company` redirect'leri aynı kırık hedefe taşır.

**Çözüm (öneri):** `invite` param'ını `CustomerApp` seviyesinde yakala → oturum yoksa `sessionStorage`'a koy + giriş sonrası devam et; oturum varsa kabul et → `/hesap/team`'e yönlendir + sonucu göster.

### P0-3 · Kredi yükleme (top-up) akışının UI girişi yok
- `startCheckout` (`src/api/billing.ts`) **hiçbir yerden çağrılmıyor**.
- Müşteri paneli "Kredi" sekmesi defter + sipariş listesi gösteriyor; **"Kredi yükle" butonu yok**. `GET /api/billing/packs` panelde kullanılmıyor.
- Stüdyoda `BillingPanel` bileşeni ölü (bkz. §6); paket satın alma ekranı yok.
- Sonuç: Phase 8 ödeme akışı (checkout → mock/iyzico → callback → fulfill) yalnızca elle API çağrısıyla gezilebiliyor. Mock ücretle bile ürün kararlarının alınamayacağı bir Voice-of-customer yolu kapalı.

### P0-4 · "Stüdyoda aç" projeyi açmıyor
- Müşteri paneli proje satırındaki link `studioHandoffUrl()` — her zaman stüdyo kökü. Proje ID'si taşınmıyor.
- Stüdyoda `?project=` param okuyan kod yok (`URLSearchParams` yalnızca `billing`, `handoff`, `auth`, `orderId` için kullanılıyor). `loadCloudProjectById` altyapısı hazır ama URL sözleşmesi yok.
- **Çözüm:** `${STUDIO_URL}?handoff=…&project=<id>` → stüdyo açılışında `loadCloudProjectById`.

### P0-5 · Abonelik ödemesiz aktive ediliyor
`POST /api/billing/subscribe` herhangi bir planı anında aktive eder (iyzico yok). Dev/mock için doğru; **canlıya çıkmadan önce ödeme kapısı veya admin onayı şart.** Paket satın alma (mock dahil) en azından sipariş kaydı + `fulfillPaidOrder` üzerinden defterli; abonelikte defter mekanizması yok.

### P0-6 · Admin bakiye görünümü org-farkındalığıyla çelişiyor
- `/api/admin/users` ve `/api/admin/users/:id` → **kişisel** cüzdan (`JOIN wallets`).
- `/api/credits/balance` (müşteri paneli + stüdyo) → **fatura cüzdanı** (`resolveBillingUserId`).
- Ekip üyesi için admin "0 kr", kullanıcı kendi panelinde sahibinin bakiyesini görür. Karışıklık + yanlış support kararı riski.

### P0-7 · SPA production build de HEAD'de kırık (audit sonrası tespit)
`npm run build` (`tsc -b && vite build`) tip kontrolünü geçemiyor — hatalar panel değil, motor/t test dosyalarında ve son motor commit'lerinden beri var (dev akışı `vite dev` tip kontrolü yapmadığı için fark edilmemiş):

| Dosya | Hata sayısı | Nitelik |
|---|---|---|
| `src/components/ComparePreview.tsx` | 3 | `DesignSpec` importı eksik (tip-only) |
| `src/engine/brain/DesignCritic.ts` | 3 | `as const` ternary üzerine uygulanmış (TS1355) |
| `src/engine/studio/directionTalk.ts` | 1 | `pinFamily` = `false \| StudioFamily \| undefined` |
| `src/engine/studio/labelLayouts.ts` | 2 | `markKind` generic'te `string`'e genişliyor |
| `src/engine/assignAwaiting.ts` | 1 | `awaiting === 'colors'` — anahtar union'da yok |
| `src/engine/catalog/structureRecommend.ts` | 1 | `mode === 'label'` — mode daralmış `"box"` |
| `src/appState.test.ts` | 1 | fixture cast'i yetersiz |
| `src/engine/llm/studioChatC8.test.ts` | ~6 | fixture tipleri parametre tipleriyle uyuşmuyor |
| `src/engine/studio/studioHonesty.test.ts` | 2 | `HeroFamily` union'ında olmayan `'marble-frame'/'marble'` — tip ↔ runtime drift |

Not: `studioHonesty` testi **runtime'da geçiyor** (archetype gerçekten `'marble-frame'` dönüyor) → `HeroFamily` tipi runtime değerlerinin gerisinde kalmış; bu tip/davranış uyuşmazlığı motor sözleşme kararıdır (AGENTS.md: motor dokunulmaz). Bu yüzden P0-7 motor sahibinin kararıyla ayrı geçişte çözülmelidir. Panel Faz 0'ı bu hatalardan bağımsızdır; site build (`build:site`) panel düzeltmeleriyle yeşile çekilmiştir.

---

## 5. ÖNEMLİ EKSİKLER (P1)

| # | Eksik | Not |
|---|---|---|
| 1 | Profil düzenleme + şifre değişikliği | Server'da `PATCH /api/auth/me` yok; müşteri paneli "Hesap" sekmesi salt okunur |
| 2 | Admin plan düzenleme UI | `PATCH /api/admin/plans/:id` + `upsertPlan` hazır; site Ayarlar bölümü salt okunur liste |
| 3 | Admin ekip detay sayfası | `GET /api/admin/orgs/:id` (üyeler + özet) hazır; Ekipler listesi detay linki içermiyor |
| 4 | Ekip kullanım görünümü | `GET /api/orgs/:id/usage` hiçbir UI'da kullanılmıyor |
| 5 | Askıda rezervasyon süpürmesi | `reserve` cüzdanı anında düşer; istemci çökerse `pending` rezervasyon kalıcı — server tarafında TTL/sweep yok, admin'de tek tek "İade et" aksiyonu yok |
| 6 | Admin route'larda rate limit yok | auth/checkout sınırlı; admin penceresi açık (tek süreçte riski düşük ama ortam değişkeniyle açılır) |
| 7 | Logs bölümü LLM maliyetini indiriyor, göstermiyor | `AdminApp.Logs` → `/api/admin/llm-costs` fetch ediliyor, render yok |
| 8 | Admin "Krediler" bölümü yalnızca rezerv listesi | Genel defter görünümü yok (kullanıcı detayında var) |
| 9 | Stüdyo `src/api/admin.ts`, `orgs.ts`, `operations.ts` kullanılmıyor | Bağlantı fazında ya silinmeli ya panel işlevleri stüdyoya taşınmalı (bkz. §6) |
| 10 | Misafir `#billing` akışı | `StudioLink href="billing"` → stüdyo `#billing`; giriş yoksa hiçbir şey olmuyor (AuthPanel yönlendirmesi yalnızca oturumlu iken) |
| 11 | Panel testleri | Server tarafı testli; panel bileşen testi (render/akış) yok. `npm test`'teki 2 kırmızı motor testi panel dışı ama `test:all` zincirini koparıyor (`&&` nedeniyle `test:server` atlanıyor — CI'da gizli regresyon riski) |
| 12 | Davet e-postası yok | Davet yalnızca "linki kopyala"; mailer altyapısı hiç yok (biliniyor, faz planında) |

---

## 6. ÖLÜ KOD ENVANTERİ

| Öğe | Durum |
|---|---|
| `src/api/admin.ts` (213 satır) | Stüdyoda **hiç import yok** — site paneli kendi `consoleRequest`'ini kullanıyor |
| `src/api/orgs.ts`, `src/api/operations.ts` | Hiç import yok (Phase 10 quote/classify/reserve istemcisi öksüz) |
| `BillingPanel` bileşeni (`src/components/BillingPanel.tsx`) | Yalnızca `MockPayPage` dışa aktarımı `App.tsx`'te kullanılıyor; panelin kendisi mount edilmiyor (eskiden `#billing` ile açılıyordu, şimdi `#billing` siteye yönlendiriliyor) |
| `server/app.ts:61` — `listBuckets`, `reconcileCheck` importları | Route'larda kullanılmıyor |
| `site/src/lib/consoleApi.ts` — `AdminPlan`, `AdminOperation` tipleri | Dışa aktarılıyor, kullanılmıyor |
| `STUDIO_BILLING_URL` zinciri | `PricingView`/`PricingGrid` → stüdyo `#billing` → (oturumluysa) `/hesap/credits`. Dolaylı ama çalışıyor; sadeleştirilebilir |

---

## 7. GELİŞTİRME FAZLARI

> Sıralama bağımlılığa göre. Her fazın sonunda yeşil doğrulama şartı vardır.

### FAZ 0 — Onarım (yarım kalan bağlantıları kapat) · ~1 gün
1. **P0-1:** 6 tip hatasını düzelt → `npm run build:site` yeşil.
   - `TeamSection`: `if (!session) return` sonrası `load(session)` çağrıları; effect içinde `const auth = loadAuth(); if (auth) void load(auth)`.
   - `CustomerApp`: `.catch(() => ({ usage: [] }))` gibi tipli fallback'ler veya tek tip `Promise.all` sonucu.
2. **P0-2:** Davet akışı: `CustomerApp`'ta `?invite=` yakalayıcı (oturum yoksa `sessionStorage.forma.invite` + girişten sonra kabul; varsa hemen kabul → `/hesap/team` notu). `firma`/`company` redirect'leri aynen çalışır.
3. **P0-4:** Proje deep-link: panel linki `?handoff=…&project=<id>`; stüdyo `App.tsx` açılışında `project` param → `loadCloudProjectById` (sahiplik server'da zaten doğrulanıyor).
4. `test:all`'ı paralel/bağımsız hale getir (`vitest run; vitest run --config …` veya CI'da ayrı adımlar) — 2 motor testi panel işini bloklamasın.
- **Kabul:** `build:site` + `test:server` yeşil; davet linki girişli/girişsiz iki senaryoda kabul Ediyor; panelde "Stüdyoda aç" ilgili projeyi yüklüyor.

### FAZ 1 — Müşteri paneli tamamlama · ~2-3 gün
1. **P0-3:** "Kredi yükle": packs listesi (`GET /api/billing/packs`) + `startCheckout` → mock'ta `/billing/mock-pay?orderId=` (stüdyo) yönlendirme, iyzico'da `paymentPageUrl`; dönüşte (`?billing=success`) boot yenile.
2. **P0-6 görünürlüğü:** Kredi sekmesinde "fatura cüzdanı" etiketi (ekip üyesi ise: "Ekibin plan bakiyesi").
3. Profil: `PATCH /api/auth/me` (name) + `POST /api/auth/password` (mevcut şifre doğrulamalı) endpoint'leri + Hesap sekmesi formları.
4. Ekip kullanımı: `TeamSection`'a `GET /api/orgs/:id/usage` tablosu (üye, işlem, kredi).
5. Ledger/usage satırlarına tarih kolonu + tür filtresi; para/tarih biçimleri `tr-TR`/`en-US` tutarlılığı.
- **Kabul:** Mock ödemeyle uçtan uca kredi satın alma panel içinden tamamlanıyor; profil güncellemesi kalıcı.

### FAZ 2 — Admin paneli tamamlama · ~2-3 gün
1. Plan düzenleme: Ayarlar'da satır içi form → `PATCH /api/admin/plans/:id` (fiyat, kredi, enabled, rollover).
2. Ekip detay: `/admin/teams/:id` sayfası (server endpoint hazır) — üyeler, davetler, sahip planı, koltuk durumu.
3. Kullanıcı listesine fatura cüzdanı kolonu (`resolveBillingUserId` join) veya "kişisel / fatura" çift kolon.
4. Rezervasyon sağlığı: pending > 24 sa otomatik iade (API açılışında sweep) + rezervasyon listesinde "İade et" aksiyonu.
5. Logs'a LLM maliyet tablosu (provider, token, USD); admin route'lara rate limit.
- **Kabul:** Admin plam güncelleyip ekip detayını görebiliyor; askıda rezerv kalmıyor.

### FAZ 3 — Ödeme gerçekleştirme (canlı öncesi) · süre iyzico sürecine bağlı
1. Abonelik ödemesi: `subscribe`'ı sipariş+ödeme kapısına bağla (iyzico plan ödemesi) veya geçiş dönemi için "admin onaylı aktivasyon + referans" akışı.
2. Prod anahtarlar + callback doğrulama; fatura alanları (vergi no, adres).
3. Test kartı senaryoları: başarılı, başarısız, çift callback (idempotent `fulfillPaidOrder` zaten var — testle sabitle).
- **Kabul:** Ödemesiz plan/satın alma yolu kalmamış (mock yalnızca anahtar yokken).

### FAZ 4 — Sertleştirme & temizlik · ~1-2 gün
1. Ölü kod: `src/api/admin|orgs|operations.ts` + `BillingPanel` (MockPayPage'i kendi dosyasına taşı) + kullanılmayan importlar (`listBuckets`, `reconcileCheck`) + `consoleApi` ölü tipleri.
2. Panel bileşen testleri (Vitest + testing-library): CustomerApp boot/agenda, AdminApp rol koruması, invite akışı.
3. Admin işlemlerine audit izi: `credit_events`'e `admin_action` türü (adjust, role, plan değişikliği).
4. `AdminApp.Overview` çift `<ErrorText>` gibi küçük polish'ler.
- **Kabul:** `oxlint` temiz, test kapsamı panelleri de kolluyor.

---

## 8. DOĞRULAMA KOMUTLARI

```bash
npm run test:server          # 59/59 beklenir
npm test                     # 504 test (2 motor metin testi ayrı ele alınmalı)
npm run build:site           # Faz 0 sonrası yeşil olmalı
npm run dev:all              # site :3000 + stüdyo :5173 + API :8787
# Elle akış: kayıt (FORMA_ADMIN_EMAIL ile admin) → panel → stüdyo handoff →
# generate kredi düşümü → /hesap/credits defter kontrolü → /admin/users/{id} detay
```

---

## 9. FAZ 0 UYGULAMA DURUMU (2026-09-17)

**Uygulanan düzeltmeler** (kod değişikliği bu bölümdekilerdir):

| P0 | Durum | Değişen dosyalar |
|---|---|---|
| P0-1 site build | ✅ **Yeşil** — 6 tip hatası giderildi | `TeamSection.tsx` (null guard + kullanılmayan hook'lar), `CustomerApp.tsx` (tipli catch fallback'leri) |
| P0-2 davet akışı | ✅ `CustomerApp` kökünde `?invite=` yakalayıcı: `sessionStorage`'a stash → girişsizse redirect'te korunur → oturum gelince kabul → `/hesap/team` notu. `TeamSection`'daki çift işleyici kaldırıldı (tek kabul yolu) | `CustomerApp.tsx`, `TeamSection.tsx` |
| P0-4 proje deep-link | ✅ Panel linki `?handoff=…&project=<id>`; stüdyo açılışında ilgili bulut projesi yüklenir (en yeni proje hydrate'i onun yerine geçer) | `site/src/lib/auth.ts`, `CustomerApp.tsx`, `src/App.tsx` |
| test:all zinciri | ✅ `concurrently --kill-others-on-fail` ile iki süit bağımsız koşar | `package.json` |
| P0-3, P0-5, P0-6 | ⏳ Faz 1-3'te | — |
| P0-7 SPA build | ⏳ Ayrı tip-hijyen geçişi (motor sözleşme kararları gerekir) | — |

Doğrulama: `npm run build:site` ✓ · `npm run test:server` 59/59 ✓ · `npm test` 502/504 (2 kırık motor metin testi P0-7 listesinden bağımsız, önceden var olan) ✓ · oxlint uyarı dışı ✓

---

## 10. FAZ 1 UYGULAMA DURUMU (2026-09-17)

**P0-3, P0-5 (kısmı) ve P1 maddeleri tamamlandı:**

| Öğe | Durum | Değişen dosyalar |
|---|---|---|
| Kredi yükleme (P0-3) | ✅ Kredi sekmesinde paket listesi (`GET /api/billing/packs`) + satın al: mock modda onay + `mock/complete` ile yerinde tamamlama; iyzico modda `paymentPageUrl`'e yönlendirme (dönüş stüdyo `?billing=success`) | `CustomerApp.tsx` |
| Abonelik ödemesiz aktivasyon (P0-5) | ⏳ Kısmen giderildi — top-up artık UI'dan sipariş+ödeme yolunu kullanıyor; abonelik ödeme kapısı Faz 3 | `CustomerApp.tsx`, `server/app.ts` |
| Fatura cüzdanı etiketi (P0-6 müşteri tarafı) | ✅ `/api/billing/credits` artık `resolveBillingUserId` ile bakiye/bucket/abonelik döndürüyor + `billingUserId`/`isShared` alanları; panelde paylaşım notu gösteriliyor | `server/app.ts`, `CustomerApp.tsx` |
| Profil düzenleme | ✅ `PATCH /api/auth/me` (name, max 80, boş → null temizler) + Hesap sekmesi formu; kayıt localStorage auth'una da yazılır (`saveAuth` → Header tazelenir) | `server/app.ts`, `CustomerApp.tsx` |
| Şifre değiştirme | ✅ `POST /api/auth/password` (mevcut şifre doğrulanır, `validatePassword`, Google-only hesap reddi) + form | `server/app.ts`, `CustomerApp.tsx` |
| Ekip kullanım görünümü | ✅ `/api/orgs/:id/usage` → ekip kartında "Son kullanım" listesi | `TeamSection.tsx` |
| Defter/kullanım tarih kolonları | ✅ ledger + usage satırlarında tarih | `CustomerApp.tsx` |
| Server testleri | ✅ 5 yeni test: profil adı güncelleme/temizleme, 81 karakter reddi, şifre değişimi (eski şifre geçersizleşir), yanlış mevcut şifre + kısa yeni şifre reddi, ortak cüzdan (`resolveBillingUserId` üye→sahip, `isShared` bayrağı) | `server/phase10.test.ts` |

**Test: 64/64 server ✓ · site build ✓.**

**Kalan:** Faz 2 (admin paneli tamamlama: plan düzenleme UI, ekip detay sayfası, admin bakiye org-farkındalığı, askıda rezervasyon süpürmesi, Logs'a LLM maliyeti, admin rate limit) → Faz 3 (abonelik ödeme kapısı, prod iyzico) → Faz 4 (sertleştirme + ölü kod temizliği).
