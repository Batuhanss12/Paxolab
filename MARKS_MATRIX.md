# FORMA marks matrix

Source: `src/engine/marks/MarkMatrix.ts`. Sample / informative only — not a certification.

## Perfume icons (PARFUM İCON → repo)

Copied to `src/engine/marks/assets/perfume/`:

| File | Source | Role |
| --- | --- | --- |
| `ic1-flammable.svg` | İC1 | Flammable — red diamond + flame |
| `ic2-keepaway.svg` | İC2 | Keep-out-of-reach figure |
| `ic3-pao.svg` | İC3 | PAO **36M** + Möbius recycle |
| `ic4-leaflet-pap.svg` | İC4 | Leaflet / booklet + PAP 21 |

Perfume **box** strip prefers these assets for matching roles, then synthesizes ℮-mark / Green Dot / recycle if still needed.

Perfume **label** uses ℮ + flammable (IC1); PAO (IC3) only if the face is large enough.

## Matrix (required / optional / TR text)

| Sector × surface | Required | Optional | Text (TR, sample) |
| --- | --- | --- | --- |
| perfume / box | PAO, leaflet, flammable, keep-away, recycle, ℮ | PAP21, Green Dot | harici kullanım, alevden uzak, göz, çocuk |
| perfume / label | ℮, flammable | PAO | kısa harici / alev / göz |
| cream \| serum / box | PAO 12M, leaflet, recycle, ℮ | PAP, Green Dot, keep-away | bakım uyarıları — **no** flammable default |
| cream \| serum / label | ℮, PAO | recycle | göz / çocuk |
| food / box | ℮, recycle, glass-fork | PAP21, keep-dry | saklama / alerjen — **no** PAO / flammable |
| food / label | ℮, recycle | glass-fork | saklama |
| electronics / box | WEEE, recycle | this-way-up, keep-dry | WEEE / pil / nem — **no** perfume set |
| electronics / label | WEEE, recycle | keep-dry | kısa WEEE |
| cleaning / box | keep-away, recycle | ℮, leaflet | çocuk / göz — GHS **not** invented |

Placement: back strip on boxes (min ~7 mm, optical gap). Labels: fewer icons, smaller min. Never invent a barcode.
