# Production dieline / ZIP + template offer audit

**Date:** 2026-09-16  
**Scope:** runtime `src/engine/dieline`, `src/engine/production`, C5 catalog / `TemplatePicker`. No CF2, Artios, kerf, FOGRA, overlay/VL merge.

Prior work that still stands: `outlineUnion` knife rings, named CUT/CREASE/PERF layers, `npm run cert:press`, C5 physics ranking. `docs/PAXOLAB_FULL_AUDIT.md` “cut = bbox” is **stale**.

## Verdict

| Area | Verdict | Note |
|---|---|---|
| Cut marks | PARTIAL | Real outer paths (union or explicit). No kerf. Pillow dims were unmapped. |
| Crease / kırılım | REAL | Separate geometry, validated, SVG + DXF + PDF layers. |
| Score | PARTIAL | No SCORE layer. Comments say “score” for crease. RSC slots are CUT. |
| Dimensions | PARTIAL | Tuck / A60 / RSC honest. Pillow `depth` was default 40 mm. Polygon ignores W. |
| User ZIP | PARTIAL | Knife SVG+DXF real. PDF/manifest lived only in `cert:press`. Combined SVG is a guide, not a die. |
| Bleed on knife | THEATER | 3 mm overlays. CUT stays on trim (correct). Preflight used to imply bleed was locked. |
| Template picker | PARTIAL | Chat top-3 is real. Rail showed all 13 families. Click showed a blank net, no carton identity. |

Overall: review / first-cut prototype for straight tuck and traced A60. Not drop-in for a converter.

## Pipeline

```
brief.dimensionsMm L/W/H
  → buildDieline
       native: tuck-end / simple-tray / flat-label / wrap-label
       Forxa: FORXA_ROUTED or auxDevice
  → DielineModel { cut[][], crease[][], perf?[][] }
  → user ZIP  (knife svg/dxf, structure, artwork, combined, + PDF/shop/OKU after this work)
  → cert:press pack (same + shop brief)
```

## L / W / H map (Paxolab brief)

Paxolab: **L** = front width, **W** = depth (side), **H** = standing height.

| Structure | Engine keys | Front face | Notes |
|---|---|---|---|
| tuck-end-box (native) | L, W, H | L × H | Flaps heuristic G/T/dust from W. |
| reverse-tuck, sleeve, mailer, snap-lock, trays, A60, RSC | length=L, width=W, height=H | L × H | A60/RSC also take solver glue/tuck. |
| pillow-box | length=L, width=H, **depth=W** | L × H | Must not send H into unused `height`. |
| polygon-box | sideLength=L, height=H | n-gon | W unused. |

Bleed 3 mm and safe 3 mm are solver constants. They are **not** offset into CUT.

## Do not do

- Bake bleed into the knife.
- Invent CF2 / ARD / kerf compensation / mountain-valley DXF.
- Export glue as CUT.
- Claim FOGRA / trap / veraPDF.
- Merge Design Brain overlay into the studio painter.
- Change `pickTemplate` (kit goldens).

## Template offer (C5)

- `recommendStructures`: physics 0.55 + aspect 0.30 + product 0.15, cap 3.
- `pickerTemplates` used to sort by sector and **keep** mailer/tray/RSC on a perfume brief.
- `familyRepresentatives` used the first catalog tuck (`fm-cos-tuck-perfume`) even for gıda.
- 3D is CSS faces in `Preview3D`, post-generate only. No glTF.

Intended after this work: sector-matched families in chat + picker; card net + CSS shell on select; human label (`STRUCTURE_LABEL` + title).
