import type { ArtworkModel, DielineModel, Palette } from '../../types'
import { escapeSvg, panelClipDefinition } from './svgGeometry'

export function artworkMarkup(artwork: ArtworkModel): string {
  return artwork.layers.map((layer) => layer.markup).join('')
}

export function clipDefs(dieline: DielineModel): string {
  return dieline.panels.map(panelClipDefinition).join('')
}

export function renderFrontSvg(dieline: DielineModel, artwork: ArtworkModel, palette: Palette): string {
  const panel = dieline.panels.find((candidate) => candidate.id === artwork.frontPanelId)
  if (!panel) return ''
  const pad = 6
  const layer = artwork.layers.find((candidate) => candidate.panelId === panel.id)?.markup ?? ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${panel.x - pad} ${panel.y - pad} ${panel.w + pad * 2} ${panel.h + pad * 2}">
    <rect x="${panel.x - pad}" y="${panel.y - pad}" width="${panel.w + pad * 2}" height="${panel.h + pad * 2}" fill="${palette.paper}" />
    <defs>${clipDefs(dieline)}</defs>
    ${layer}
  </svg>`
}

export function renderArtNetSvg(dieline: DielineModel, artwork: ArtworkModel): string {
  const pad = 8
  return `<g>
    <defs>${clipDefs(dieline)}</defs>
    <g transform="translate(${pad} ${pad})">${artworkMarkup(artwork)}</g>
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
  <g transform="translate(${pad} ${pad})">${artworkMarkup(artwork)}</g>
</svg>`
}
