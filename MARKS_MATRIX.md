# FORMA marks matrix

Source: `src/engine/marks/MarkMatrix.ts`. Sample / informative only — not a certification.

## Perfume icons (PARFUM İCON → repo)

Copied to `src/engine/marks/assets/perfume/`:

| File | Source | Role | Color |
| --- | --- | --- | --- |
| `ic1-flammable.svg` | İC1 | Flammable | Red diamond, gold flame |
| `ic2-keepaway.svg` | İC2 | Keep-out-of-reach | Gold (never muted-black) |
| `ic3-pao.svg` | İC3 | PAO default **36M** (brief override overlays) | Gold |
| `ic4-leaflet-pap.svg` | İC4 | Leaflet + PAP 21 | Gold |

Old stroke-only cosmetics synth (PAO / leaflet / flammable / keep-away / ℮ / Green Dot) is retired. Do not fall back to those on perfume.

## Where icons live

- **Box back** — perfume: IC1–IC4 only. Food / electronics keep sector regulatory marks (glass-fork, WEEE, recycle).
- **Main label face** — no warning icons (the product design stays clean).
- **Back label (`labelBack`)** — kullanım + UYARI + perfume icons (if perfume) + barcode. Front stays design-only.

## Matrix

| Sector × surface | Icons | Text |
| --- | --- | --- |
| perfume / box | IC1–IC4 | harici, alev, göz, çocuk |
| perfume / label face | none | — (back carries warnings) |
| perfume / label back | IC1–IC4 | kullanım + UYARI |
| cream \| serum / box | none (text) | bakım uyarıları |
| food / box | recycle, glass-fork (regulatory) | saklama / alerjen |
| electronics / box | WEEE, recycle | WEEE / nem |
| any / label face | none | extra sticker only |

Barcode: asked in chat; if skipped, a **200… sample EAN-13** is drawn and labeled örnek — not a GS1 GTIN.

PAO: `12 ay` / `PAO 6` / `36M` in the brief. Sector default is 36M (perfume) or 12M (cream/serum). Strip is optically spaced and skipped on tiny faces (< 36 mm).
