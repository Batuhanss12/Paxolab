# BOX templates inventory

Scope: BOX dieline motor only. Labels excluded (3).

**N = 26**

| templateId | structureId | packFamily | library | default L×W×H | builder |
|---|---|---|---|---|---|
| fm-cos-tuck-perfume | tuck-end-box | native-tuck | core | 70×35×140 | `src/engine/dieline/dielineStructures.ts` |
| fm-cos-tuck-cream | tuck-end-box | native-tuck | core | 80×40×80 | `src/engine/dieline/dielineStructures.ts` |
| fm-cos-tuck-serum | tuck-end-box | native-tuck | core | 45×45×120 | `src/engine/dieline/dielineStructures.ts` |
| fm-food-tuck-oil | tuck-end-box | native-tuck | core | 80×50×180 | `src/engine/dieline/dielineStructures.ts` |
| fm-food-tray-snack | simple-tray | simple-tray | core | 160×100×40 | `src/engine/dieline/dielineStructures.ts` |
| fm-elec-tuck-earbuds | tuck-end-box | native-tuck | core | 90×45×90 | `src/engine/dieline/dielineStructures.ts` |
| fm-elec-tuck-cable | tuck-end-box | native-tuck | core | 120×40×80 | `src/engine/dieline/dielineStructures.ts` |
| fm-box-tuck-universal | tuck-end-box | native-tuck | core | 80×40×120 | `src/engine/dieline/dielineStructures.ts` |
| fm-box-sleeve | sleeve | sleeve | core | 90×30×150 | `src/engine/dieline/forxa/structures/sleeve.ts` |
| fm-box-mailer-ship | mailer-box | mailer | core | 180×120×80 | `src/engine/dieline/forxa/structures/mailerBox.ts` |
| fm-gift-hex-box | polygon-box | polygon | advanced | 60×60×120 | `src/engine/dieline/forxa/structures/polygonBox.ts` |
| fm-gift-tri-box | polygon-box | polygon | advanced | 70×70×140 | `src/engine/dieline/forxa/structures/polygonBox.ts` |
| fm-gift-octagon-d | polygon-box | polygon | advanced | 50×50×100 | `src/engine/dieline/forxa/structures/polygonBox.ts` |
| fm-bev-carrier-6 | product-carrier-tray | carrier-tray | advanced | 180×120×45 | `src/engine/dieline/forxa/structures/productCarrierTray.ts` |
| fm-bev-carrier-2 | product-carrier-tray | carrier-tray | advanced | 160×80×50 | `src/engine/dieline/forxa/structures/productCarrierTray.ts` |
| fm-cos-tuck-euroslot | tuck-end-box | forxa-tuck-aux | advanced | 70×35×140 +x62 | `src/engine/dieline/forxa/structures/tuckEndBox.ts` |
| fm-food-tuck-pour | tuck-end-box | forxa-tuck-aux | advanced | 80×50×160 +x44 | `src/engine/dieline/forxa/structures/tuckEndBox.ts` |
| fm-box-mailer-handle | mailer-box | mailer | advanced | 200×140×90 +x82 | `src/engine/dieline/forxa/structures/mailerBox.ts` |
| fm-box-pillow | pillow-box | pillow | advanced | 140×70×40 | `src/engine/dieline/forxa/structures/pillowBox.ts` |
| fm-box-snap-lock | snap-lock-box | snap-lock | advanced | 100×60×120 | `src/engine/dieline/forxa/structures/snapLockBox.ts` |
| fm-box-rigid-gift | rigid-gift-box | rigid-gift | advanced | 160×120×50 | `src/engine/dieline/forxa/structures/rigidGiftBox.ts` |
| fm-box-reverse-tuck | reverse-tuck-end-box | reverse-tuck | advanced | 70×35×120 | `src/engine/dieline/forxa/structures/reverseTuckEndBox.ts` |
| fm-box-tray-glued | tray-box | glued-tray | advanced | 180×120×40 | `src/engine/dieline/forxa/structures/trayBox.ts` |
| fm-cos-tuck-zipper | tuck-end-box | forxa-tuck-aux | advanced | 80×40×80 +x12 | `src/engine/dieline/forxa/structures/tuckEndBox.ts` |
| fm-box-ecma-a60 | tuck-top-auto-bottom | tuck-top-auto-bottom | advanced | 100×50×150 | `src/engine/dieline/forxa/structures/tuckTopAutoBottom.ts` |
| fm-box-rsc-ship | rsc-carton | rsc | advanced | 200×150×150 | `src/engine/dieline/forxa/structures/rscCarton.ts` |

## Builders

| structureId | route | file | catalog ids |
|---|---|---|---|
| tuck-end-box | native | `src/engine/dieline/dielineStructures.ts (native) · src/engine/dieline/forxa/structures/tuckEndBox.ts (aux/Forxa)` | fm-cos-tuck-perfume, fm-cos-tuck-cream, fm-cos-tuck-serum, fm-food-tuck-oil, fm-elec-tuck-earbuds, fm-elec-tuck-cable, fm-box-tuck-universal |
| simple-tray | native | `src/engine/dieline/dielineStructures.ts` | fm-food-tray-snack |
| sleeve | forxa | `src/engine/dieline/forxa/structures/sleeve.ts` | fm-box-sleeve |
| mailer-box | forxa | `src/engine/dieline/forxa/structures/mailerBox.ts` | fm-box-mailer-ship, fm-box-mailer-handle |
| polygon-box | forxa | `src/engine/dieline/forxa/structures/polygonBox.ts` | fm-gift-hex-box, fm-gift-tri-box, fm-gift-octagon-d |
| product-carrier-tray | forxa | `src/engine/dieline/forxa/structures/productCarrierTray.ts` | fm-bev-carrier-6, fm-bev-carrier-2 |
| pillow-box | forxa | `src/engine/dieline/forxa/structures/pillowBox.ts` | fm-box-pillow |
| snap-lock-box | forxa | `src/engine/dieline/forxa/structures/snapLockBox.ts` | fm-box-snap-lock |
| rigid-gift-box | forxa | `src/engine/dieline/forxa/structures/rigidGiftBox.ts` | fm-box-rigid-gift |
| reverse-tuck-end-box | forxa | `src/engine/dieline/forxa/structures/reverseTuckEndBox.ts` | fm-box-reverse-tuck |
| tray-box | forxa | `src/engine/dieline/forxa/structures/trayBox.ts` | fm-box-tray-glued |
| tuck-top-auto-bottom | forxa | `src/engine/dieline/forxa/structures/tuckTopAutoBottom.ts` | fm-box-ecma-a60 |
| rsc-carton | forxa | `src/engine/dieline/forxa/structures/rscCarton.ts` | fm-box-rsc-ship |
| tuck-end-box | forxa | `src/engine/dieline/forxa/structures/tuckEndBox.ts` | fm-cos-tuck-euroslot, fm-food-tuck-pour, fm-cos-tuck-zipper |

## Excluded (not box)

- fm-cos-label-bottle (wrap-label)
- fm-food-label-jar (flat-label)
- fm-elec-label-device (flat-label)
