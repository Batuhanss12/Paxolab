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

## Ortam

`.env.example` — yalnızca FORMA anahtarları. Harici monorepo adresi konmaz.

## Yığın

Vite · React 19 · TypeScript. Ek UI kütüphanesi yok.
