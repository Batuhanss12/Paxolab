import type { ArtworkModel, DielineModel, Palette } from '../../types'
import { findHeroPanel, findLabelBackPanel, findLegalPanel } from '../dieline/panelKind'
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
    return findLegalPanel(dieline.panels)?.id ?? findLabelBackPanel(dieline.panels)?.id ?? byFace(FACE_ALIASES.back) ?? byId(FACE_IDS.back)
  }
  const hit = byId(FACE_IDS[face]) ?? byFace(FACE_ALIASES[face])
  if (hit) return hit
  if (face === 'left' || face === 'right') {
    const sides = dieline.panels.filter((p) => p.face === 'side' || p.kind === 'polygon-wall' || p.kind === 'side-spine')
    return face === 'left' ? sides[0]?.id : (sides[1]?.id ?? sides[0]?.id)
  }
  return undefined
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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${panel.x - pad} ${panel.y - pad} ${panel.w + pad * 2} ${panel.h + pad * 2}" preserveAspectRatio="none">
    <rect x="${panel.x - pad}" y="${panel.y - pad}" width="${panel.w + pad * 2}" height="${panel.h + pad * 2}" fill="${palette.paper}" />
    <defs>${clipDefs(dieline)}</defs>
    ${layer}
  </svg>`
}

export function renderFrontSvg(dieline: DielineModel, artwork: ArtworkModel, palette: Palette): string {
  const panelId = artwork.frontPanelId || facePanelId(dieline, artwork, 'front')
  if (!panelId) return ''
  return renderPanelSvg(dieline, artwork, panelId, palette, { pad: 6, exportFonts: true })
}

export function renderArtNetSvg(dieline: DielineModel, artwork: ArtworkModel): string {
  const pad = 8
  return `<g>
    <defs>${clipDefs(dieline)}</defs>
    <g transform="translate(${pad} ${pad})">${withStudioExportFonts(artworkMarkup(artwork))}</g>
  </g>`
}

export function renderArtworkDoc(dieline: DielineModel, artwork: ArtworkModel, title: string): string {
  const pad = 8
  const width = dieline.width + pad * 2
  const height = dieline.height + pad * 2
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}mm" height="${height}mm">
  <title>${escapeSvg(title)} — Grapxor artwork</title>
  <defs>${clipDefs(dieline)}</defs>
  <g transform="translate(${pad} ${pad})">${withStudioExportFonts(artworkMarkup(artwork))}</g>
</svg>`
}
