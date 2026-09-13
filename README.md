# FORMA — AI Tasarım Atölyesi

Tek sayfalık tasarım motoru. AI konuşur ve brief çıkarır; **nihai baskı yüzeyi FORMA’nın belirleyici vektör motorudur** (dieline + artwork). Görsel üretim modeli kullanılmaz.

Akış: **Konuş → Şablon / dieline → Artwork → İterasyon → Üretim kapısı.**

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcı: [http://localhost:5173](http://localhost:5173)

```bash
npm run build
npm run preview
```

## Mimari

```
src/engine/
  EnginePort.ts          FormaLocalEngine (varsayılan) | FormaMockEngine (VITE_ENGINE=mock)
  conversation.ts        sohbet + eksik alan
  extract.ts             sezgisel brief (NLU opsiyonel)
  nlu.ts                 VITE_FORMA_LLM_* ile yalnızca JSON brief
  dieline/               tuck-end-box, simple-tray, flat-label, wrap-label
  catalog/               formaTemplateCatalog.json (id: fm-…)
  artwork/               panele bağlı vektör, sektör dilleri, stil
  iterate/               sohbet niyeti → graph
  production/            dürüst preflight + SVG / yazdır-PDF
```

AI yalnızca: konuşma, brief çıkarımı, iterasyon niyeti.  
Kesim ve grafik: `buildDieline` + `composeArtwork`.

### DesignBrief v2

`brandName`, `productName`, `sector`, `subProduct`, `packagingMode` (box|label), `templateId`, `dimensionsMm`, `styleType`, `colors`, `volume`, `barcode` (yalnızca kullanıcı; uydurulmaz), `logo`, `references`, `copyOverrides`.

### Motor portu

`getEngine()` → `FormaLocalEngine`. Harici paketleme API’si yoktur. `VITE_ENGINE=mock` yalnızca yerel sahneleme içindir.

## Yapılar

| structureId     | Not |
|-----------------|-----|
| tuck-end-box    | Ön/arka = L×H, yan = W×H, kapak = L×W, tutarlılık kontrolü |
| simple-tray     | Taban + 4 duvar |
| flat-label      | Tek panel |
| wrap-label      | Yüz + glue overlap |

Katalog: kozmetik tuck-end (parfüm / krem / serum), gıda (kutu, tepsi, etiket), elektronik (kutu + etiket). `soon` kartlar seçilemez.

## Platform (Phase 6–10)

Yerel API temeli: Auth + SQLite proje senkronu + **kredi cüzdanı** (Phase 7) + **iyzico sandbox / mock top-up** (Phase 8) + **kullanıcı / admin panelleri** (Phase 9) + **launch hardening** (Phase 10).

```bash
# API (port 8787)
npm run server

# SPA (port 5173, /api → 8787 proxy)
npm run dev

# İkisi birlikte
npm run dev:all
```

- Misafir: yalnızca `localStorage` (`forma.project.v1`) — **ücretsiz / sınırsız yerel**, kredi ölçümü yok.
- Giriş sonrası: sunucuda proje varsa en yenisi oturuma yüklenir; yoksa yerel oturum buluta yazılır.
- Kredi: kayıtta **50** başlangıç kredisi; `generate` = 3, `revise` = 2. Üretim öncesi `reserve` → başarıda `commit` / hatada `refund`.
- Top-up (Phase 8): paketler `pack_50` / `pack_150` / `pack_400` (TRY). Anahtar yoksa **mock**; sandbox için `IYZI_*` + `FORMA_*_URL` (`.env.example`). Gerçek ücret yok.
- Dashboard (Phase 9): giriş sonrası **Hesabım** (profil, kredi, projeler, siparişler); `role=admin` ise **Admin**. İlk admin: `FORMA_ADMIN_EMAIL` ile kayıt.
- Token: `localStorage` anahtarı `forma.auth.v1` (Bearer).
- DB: `server/data/forma.sqlite` via Node built-in `node:sqlite` (Node ≥ 22.5; no native build tools)
- Phase 10: güvenlik başlıkları, gövde limiti (2 MiB), `GET /api/health` (`ok`, `service`, `db`, `time`). Auth 20/dk ve checkout 30/dk **bellek içi / tek süreç** (çoklu instance prod için değil). Testlerde `FORMA_RATE_LIMIT_DISABLED=1`.
- Launch: `LAUNCH_CHECKLIST.md`

```bash
npm test           # motor / SPA testleri
npm run test:server
npm run test:all   # ikisi sırayla
npm run smoke:api  # çalışan API'ye GET /api/health (auth yok)
```

## Ortam

`.env.example` — yalnızca FORMA anahtarları. Harici monorepo adresi konmaz.

## Yığın

Vite · React 19 · TypeScript. Ek UI kütüphanesi yok.

## TR SEO sitesi (Phase 11)

Pazarlama sitesi ayrı Next uygulaması: `site/`

```bash
cd site
npm install
npm run dev
```

- Site: http://localhost:3000
- Stüdyo: http://localhost:5173 (`npm run dev:all` kökte)
- Harita: Desktop `PAXOLAB_SEO_TR.md`
