# FORXA — BOX DIELINE MOTOR CERTIFICATION

Scope: **BOX dieline motor only**. N = 26 catalog box templates × 3 L/W/H sets = 78 samples.

Generated: 2026-09-14T00:57:27.625Z

## VERDICT: PASS

- P0: 0
- P1: 0
- P2: 0
- pass / fail / fixed / deferred: 24 / 0 / 2 / 0

PASS iff zero open P0 and `forma-box-cert` exits 0.

## Templates

| templateId | structureId | status | P0 | P1 | P2 |
|---|---|---|---|---|---|
| fm-cos-tuck-perfume | tuck-end-box | pass | 0 | 0 | 0 |
| fm-cos-tuck-cream | tuck-end-box | pass | 0 | 0 | 0 |
| fm-cos-tuck-serum | tuck-end-box | pass | 0 | 0 | 0 |
| fm-food-tuck-oil | tuck-end-box | pass | 0 | 0 | 0 |
| fm-food-tray-snack | simple-tray | pass | 0 | 0 | 0 |
| fm-elec-tuck-earbuds | tuck-end-box | pass | 0 | 0 | 0 |
| fm-elec-tuck-cable | tuck-end-box | pass | 0 | 0 | 0 |
| fm-box-tuck-universal | tuck-end-box | pass | 0 | 0 | 0 |
| fm-box-sleeve | sleeve | pass | 0 | 0 | 0 |
| fm-box-mailer-ship | mailer-box | pass | 0 | 0 | 0 |
| fm-gift-hex-box | polygon-box | fixed | 0 | 0 | 0 |
| fm-gift-tri-box | polygon-box | fixed | 0 | 0 | 0 |
| fm-gift-octagon-d | polygon-box | pass | 0 | 0 | 0 |
| fm-bev-carrier-6 | product-carrier-tray | pass | 0 | 0 | 0 |
| fm-bev-carrier-2 | product-carrier-tray | pass | 0 | 0 | 0 |
| fm-cos-tuck-euroslot | tuck-end-box | pass | 0 | 0 | 0 |
| fm-food-tuck-pour | tuck-end-box | pass | 0 | 0 | 0 |
| fm-box-mailer-handle | mailer-box | pass | 0 | 0 | 0 |
| fm-box-pillow | pillow-box | pass | 0 | 0 | 0 |
| fm-box-snap-lock | snap-lock-box | pass | 0 | 0 | 0 |
| fm-box-rigid-gift | rigid-gift-box | pass | 0 | 0 | 0 |
| fm-box-reverse-tuck | reverse-tuck-end-box | pass | 0 | 0 | 0 |
| fm-box-tray-glued | tray-box | pass | 0 | 0 | 0 |
| fm-cos-tuck-zipper | tuck-end-box | pass | 0 | 0 | 0 |
| fm-box-ecma-a60 | tuck-top-auto-bottom | pass | 0 | 0 | 0 |
| fm-box-rsc-ship | rsc-carton | pass | 0 | 0 | 0 |

## Open P0

None.

## Progress note

- Forxa aux tuck is now a 13-panel net: L×W lids + dust + tucks (tuckEndBox.ts). Native perfume tuck unchanged.
- Fold graph: crease hits polygon edges (star nets); rigid base/lid allowed as two components.
- PERF is a separate DielineModel layer — SVG data-type=perf, DXF PERF, PDF magenta dash. Not merged into CUT.

## Re-run

- `npx --yes vite-node scripts/forma-box-cert.ts`
- `npx vitest run src/engine/dieline/formaBoxCert.test.ts`
- `npx vitest run`
