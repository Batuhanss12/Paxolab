import type { ArtworkModel, DielineModel, Palette } from '../../types'
import { findHeroPanel, findLabelBackPanel, findLegalPanel } from '../dieline/panelKind'
import { dielineTechMarkup } from '../dieline/renderDielineSvg'
import { withStudioExportFonts } from '../studio/text'
import { escapeSvg, panelClipDefinition } from './svgGeometry'

export type BoxFace = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'

const FACE_IDS: Record<BoxFace, string[]> = {
  front: ['front', 'label', 'trayFront', 'base-front'],
  back: ['back', 'labelBack', 'warnLabel', 'trayBack', 'base-back'],
  left: ['left', 'side-left', 'trayLeft', 'side-flap-left', 'base-left'],
  right: ['right', 'side-right', 'trayRight', 'side-flap-right', 'base-right'],
  top: ['top', 'lid', 'lid-top', 'top-tuck'],
  bottom: ['bottom', 'trayBottom', 'base', 'base-bottom', 'bottom-tuck', 'bottom-lock', 'auto-bottom-front'],
}

const FACE_ALIASES: Record<BoxFace, string[]> = {
  front: ['front'],
  back: ['back'],
  left: ['left'],
  right: ['right'],
  top: ['top', 'lid'],
  bottom: ['bottom'],
}

export function artworkMarkup(artwork: ArtworkModel): string {
  return artwork.layers.map((layer) => layer.markup).join('')
}

export function clipDefs(dieline: DielineModel): string {
  return dieline.panels.map(panelClipDefinition).join('')
}

export function facePanelId(dieline: DielineModel, artwork: ArtworkModel, face: BoxFace): string | undefined {
  const byId = (ids: string[]) => dieline.panels.find((p) => ids.includes(p.id))?.id
  const byFace = (aliases: string[]) => dieline.panels.find((p) => p.face && aliases.includes(p.face))?.id
  if (face === 'front') {
    if (artwork.frontPanelId && dieline.panels.some((p) => p.id === artwork.frontPanelId)) return artwork.frontPanelId
    return findHeroPanel(dieline.panels)?.id ?? byFace(FACE_ALIASES.front) ?? byId(FACE_IDS.front)
  }
  if (face === 'back') {
    return (
      findLabelBackPanel(dieline.panels)?.id ??
      findLegalPanel(dieline.panels)?.id ??
      byFace(FACE_ALIASES.back) ??
      byId(FACE_IDS.back)
    )
  }
  const hit = byId(FACE_IDS[face]) ?? byFace(FACE_ALIASES[face])
  if (hit) return hit
  if (face === 'left' || face === 'right') {
    const sides = dieline.panels.filter((p) => p.face === 'side' || p.kind === 'polygon-wall' || p.kind === 'side-spine')
    return face === 'left' ? sides[0]?.id : (sides[1]?.id ?? sides[0]?.id)
  }
  return undefined
}

/**
 * The cut line, and nothing else.
 *
 * Not part of the artwork, and never in an exported production file — it exists only so the
 * customer can see where their design ends.
 *
 * There used to be a board here too — a neutral card drawn behind the design so a pale label kept
 * a visible edge on the dark canvas. It cost more than it bought: it read as a layer the customer
 * had not asked for (plainly so on a disc or an oval, where a rectangle sat behind a round label),
 * and its 6 mm on every side shrank the artwork inside its slot. A design tool shows the artboard
 * at its own size. So the board is gone and the extent is marked the way an editor marks it: one
 * hairline on the cut, light enough to read against the studio's dark canvas and faint enough not
 * to be mistaken for part of the design.
 */
const PREVIEW_EDGE = 'rgba(255,255,255,0.28)'

/**
 * Breathing room around the design in a preview, in millimetres.
 *
 * It was 6 — sized for the board that used to be drawn there. With the board gone it is only the
 * room the hairline needs, so the artwork gets the slot: on a 70 × 45 oval the old padding spent
 * 17 % of the width on empty space, which is why the label looked small in a large canvas.
 */
export const PREVIEW_PAD = 1.2

/** The panel's cut line as a path: four corners for a rectangle, the sampled rim for a disc or oval. */
function panelOutline(panel: { x: number; y: number; w: number; h: number; polygon?: { x: number; y: number }[] }): string {
  const n = (value: number) => Math.round(value * 100) / 100
  const pts = panel.polygon
  if (!pts || pts.length < 3) {
    return `M${n(panel.x)} ${n(panel.y)} H${n(panel.x + panel.w)} V${n(panel.y + panel.h)} H${n(panel.x)} Z`
  }
  return `M${pts.map((p) => `${n(p.x)} ${n(p.y)}`).join(' L')} Z`
}

export function renderPanelSvg(
  dieline: DielineModel,
  artwork: ArtworkModel,
  panelId: string,
  palette: Palette,
  opts?: { pad?: number; exportFonts?: boolean },
): string {
  const panel = dieline.panels.find((candidate) => candidate.id === panelId)
  if (!panel) return ''
  const pad = opts?.pad ?? 0
  const raw = artwork.layers.find((candidate) => candidate.panelId === panel.id)?.markup ?? ''
  if (!raw) return ''
  const layer = opts?.exportFonts ? withStudioExportFonts(raw) : raw
  /*
   * The stock and the hairline follow the *cut*, not the bounding box.
   *
   * Both used to be rectangles. On a rectangular label that is the same thing; on a disc or an
   * oval it put a white rectangle and a rectangular outline behind a round label — two shapes the
   * customer never asked for, sitting outside their design. Drawing the panel's own polygon covers
   * every panel with one path: four points for a rectangle, the sampled rim for a curved cut.
   */
  const outline = panelOutline(panel)
  const edge = pad > 0 ? `<path d="${outline}" fill="none" stroke="${PREVIEW_EDGE}" stroke-width="0.25" />` : ''
  /*
   * `preserveAspectRatio="none"` let the box scale x and y independently, so a 60 mm disc shown in
   * a taller slot came out an egg and an oval came out a different oval. A preview that distorts
   * the geometry is not a preview. `meet` keeps the shape and letterboxes instead.
   */
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${panel.x - pad} ${panel.y - pad} ${panel.w + pad * 2} ${panel.h + pad * 2}" preserveAspectRatio="xMidYMid meet">
    <path d="${outline}" fill="${palette.paper}" />
    <defs>${clipDefs(dieline)}</defs>
    ${layer}
    ${edge}
  </svg>`
}

export function renderFrontSvg(dieline: DielineModel, artwork: ArtworkModel, palette: Palette): string {
  const panelId = artwork.frontPanelId || facePanelId(dieline, artwork, 'front')
  if (!panelId) return ''
  return renderPanelSvg(dieline, artwork, panelId, palette, { pad: PREVIEW_PAD, exportFonts: true })
}

export function renderArtNetSvg(dieline: DielineModel, artwork: ArtworkModel): string {
  const pad = 8
  return `<g>
    <defs>${clipDefs(dieline)}</defs>
    <g transform="translate(${pad} ${pad})">${withStudioExportFonts(artworkMarkup(artwork))}</g>
  </g>`
}

/**
 * The design as one vector file.
 *
 * `withCut` appends the knife contour as its own named layer. A label is delivered as this file and
 * nothing else — the owner's point was that a separate dieline set is noise on a label, the design
 * in vector form is the deliverable — but the cut still has to reach the printer, and a die-cut
 * disc or oval is unusable without it. Putting it inside the artwork as `CUT` gives the printer one
 * file with a contour layer, which is what a label press expects anyway.
 */
export function renderArtworkDoc(
  dieline: DielineModel,
  artwork: ArtworkModel,
  title: string,
  opts?: { withCut?: boolean },
): string {
  const pad = 8
  const width = dieline.width + pad * 2
  const height = dieline.height + pad * 2
  const cut = opts?.withCut
    ? `
  <g data-layer="CUT" transform="translate(${pad} ${pad})">${dielineTechMarkup(dieline, 0, 'doc').cut}</g>`
    : ''
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}mm" height="${height}mm">
  <title>${escapeSvg(title)} — Grapxor</title>
  <defs>${clipDefs(dieline)}</defs>
  <g data-layer="ARTWORK" transform="translate(${pad} ${pad})">${withStudioExportFonts(artworkMarkup(artwork))}</g>${cut}
</svg>`
}
