import type { ArtworkModel, DesignBrief, DesignOverrides, DesignSpec, DielineModel, Palette, Panel } from '../../types'
import { iconStrip } from './icons'
import { languageId, styleWeight, type LanguageId } from './languages'
import { monogram } from './copy'

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function clip(panel: Panel): string {
  return `url(#clip-${panel.id})`
}

function clipDef(panel: Panel): string {
  return `<clipPath id="clip-${panel.id}"><rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" /></clipPath>`
}

function frame(panel: Panel, p: Palette, inset: number, extra: number): string {
  if (extra <= 0) return ''
  const x = panel.x + inset
  const y = panel.y + inset
  const w = panel.w - inset * 2
  const h = panel.h - inset * 2
  const inner = extra > 1
    ? `<rect x="${x + 1.4}" y="${y + 1.4}" width="${w - 2.8}" height="${h - 2.8}" fill="none" stroke="${p.accent}" stroke-opacity="0.35" stroke-width="0.25" />`
    : ''
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${p.accent}" stroke-opacity="0.7" stroke-width="0.35" />${inner}`
}

function ornaments(panel: Panel, p: Palette, lang: LanguageId, amount: number): string {
  if (amount <= 0) return ''
  const { x, y, w, h } = panel
  if (lang === 'perfume-luxury') {
    const cx = x + w / 2
    return `
      <line x1="${cx - w * 0.16}" y1="${y + h * 0.38}" x2="${cx + w * 0.16}" y2="${y + h * 0.38}" stroke="${p.accent}" stroke-width="0.22" />
      <circle cx="${cx}" cy="${y + h * 0.18}" r="${Math.min(w, h) * 0.07 * amount}" fill="none" stroke="${p.accent}" stroke-width="0.28" />
    `
  }
  if (lang === 'food-harvest') {
    return `
      <circle cx="${x + w / 2}" cy="${y + h * 0.22}" r="${Math.min(w, h) * 0.1}" fill="none" stroke="${p.accent}" stroke-width="0.3" />
      <path d="M ${x + w / 2} ${y + h * 0.16} c 4 3 6 8 0 12 c -6 -4 -4 -9 0 -12" fill="none" stroke="${p.accent}" stroke-width="0.28" />
    `
  }
  if (lang === 'electronics-precision') {
    const step = 6
    let grid = ''
    for (let gx = x + 4; gx < x + w - 4; gx += step) {
      grid += `<line x1="${gx}" y1="${y + 3}" x2="${gx}" y2="${y + h - 3}" stroke="${p.fg}" stroke-opacity="${0.04 + amount * 0.04}" stroke-width="0.15" />`
    }
    return `${grid}<rect x="${x + 3}" y="${y + 3}" width="6" height="1.1" fill="${p.accent}" />`
  }
  return `<line x1="${x + w * 0.3}" y1="${y + h * 0.42}" x2="${x + w * 0.7}" y2="${y + h * 0.42}" stroke="${p.accent}" stroke-width="0.2" />`
}

function barcodeMarks(value: string, x: number, y: number, w: number, h: number, color: string): string {
  const bars = value.split('').map((ch) => 1 + (Number(ch) || 1) % 3)
  const total = bars.reduce((a, b) => a + b, 0)
  let cursor = x
  return bars
    .map((bw, i) => {
      const width = (bw / total) * w
      const el = i % 2 === 0
        ? `<rect x="${cursor}" y="${y}" width="${Math.max(0.4, width * 0.7)}" height="${h}" fill="${color}" />`
        : ''
      cursor += width
      return el
    })
    .join('')
}

function panelArt(
  panel: Panel,
  brief: DesignBrief,
  copy: DesignSpec['copy'],
  p: Palette,
  overrides: DesignOverrides,
  logoHref?: string,
): string {
  const lang = languageId(brief)
  const style = brief.styleType || 'classic'
  const sw = styleWeight(style)
  const font = sw.serif ? "Georgia, 'Instrument Serif', serif" : "Inter, system-ui, sans-serif"
  const { x, y, w, h } = panel
  const cx = x + w / 2
  const id = panel.id
  const s = overrides.logoScale
  const t = overrides.titleScale
  const mark = monogram(copy.brand)
  const showBarcode = overrides.barcodeVisible && !!copy.barcode

  if (id === 'glue' || id === 'overlap' || id === 'topTuck' || id === 'bottomTuck' || id.includes('Dust')) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}" />
      ${id.includes('glue') || id === 'overlap' ? `<text x="${cx}" y="${y + h / 2}" text-anchor="middle" fill="${p.muted}" font-size="${Math.min(3.2, h * 0.2)}" font-family="Inter, sans-serif">GLUE</text>` : ''}`
  }

  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />`
  body += frame(panel, p, 1.8, sw.frame)
  body += ornaments(panel, p, lang, sw.ornament)

  const isFront = id === 'front' || id === 'label' || id === 'trayFront'
  const isBack = id === 'back' || id === 'trayBack'
  const isSide = id === 'left' || id === 'right' || id === 'trayLeft' || id === 'trayRight'
  const isTop = id === 'top' || id === 'bottom' || id === 'trayBottom'

  if (isFront) {
    const logoY = y + h * 0.2
    if (logoHref) {
      const ls = 10 * s
      body += `<image href="${logoHref}" x="${cx - ls / 2}" y="${logoY - ls / 2}" width="${ls}" height="${ls}" preserveAspectRatio="xMidYMid meet" />`
    } else {
      body += `<text x="${cx}" y="${logoY + 1.6}" text-anchor="middle" fill="${p.accent}" font-family="${font}" font-size="${6.2 * s}" letter-spacing="1.2">${esc(mark)}</text>`
    }
    body += `<text x="${cx}" y="${y + h * 0.42}" text-anchor="middle" fill="${p.fg}" font-family="${font}" font-size="${Math.min(9.5, w * 0.13) * t}" letter-spacing="${sw.tracking * 0.18}">${esc(copy.brand.toUpperCase())}</text>`
    body += `<text x="${cx}" y="${y + h * 0.52}" text-anchor="middle" fill="${p.fg}" font-family="Inter, sans-serif" font-size="${Math.min(4.4, w * 0.06) * t}" letter-spacing="1.1" opacity="0.86">${esc(copy.product.toUpperCase())}</text>`
    body += `<text x="${cx}" y="${y + h * 0.62}" text-anchor="middle" fill="${p.muted}" font-family="Georgia, serif" font-size="3.6" font-style="italic">${esc(copy.tagline)}</text>`
    if (copy.volume) {
      body += `<text x="${cx}" y="${y + h * 0.78}" text-anchor="middle" fill="${p.fg}" font-family="Inter, sans-serif" font-size="3.3" letter-spacing="1.4">${esc(copy.volume.toUpperCase())}</text>`
    }
    if (showBarcode) {
      body += barcodeMarks(copy.barcode, cx - 14, y + h * 0.84, 28, 6, p.fg)
      body += `<text x="${cx}" y="${y + h * 0.93}" text-anchor="middle" fill="${p.muted}" font-family="ui-monospace, monospace" font-size="2.2">${esc(copy.barcode)}</text>`
    }
  } else if (isBack) {
    body += `<text x="${cx}" y="${y + 10}" text-anchor="middle" fill="${p.accent}" font-family="${font}" font-size="4.2">${esc(copy.brand.toUpperCase())}</text>`
    body += `<foreignObject x="${x + 4}" y="${y + 14}" width="${w - 8}" height="${h * 0.45}"><div xmlns="http://www.w3.org/1999/xhtml" style="color:${p.muted};font:2.8px Inter,sans-serif;line-height:1.35">${esc(copy.ingredients)}</div></foreignObject>`
    body += `<foreignObject x="${x + 4}" y="${y + h * 0.62}" width="${w - 8}" height="${h * 0.22}"><div xmlns="http://www.w3.org/1999/xhtml" style="color:${p.muted};font:2.4px Inter,sans-serif;line-height:1.3">${esc(copy.warnings)}</div></foreignObject>`
    body += iconStrip(x + 6, y + h - 12, p.muted)
  } else if (isSide) {
    body += `<text transform="translate(${cx + 1.2} ${y + h / 2}) rotate(-90)" text-anchor="middle" fill="${p.fg}" font-family="${font}" font-size="4.4" letter-spacing="1.6">${esc(copy.brand.toUpperCase())}</text>`
    if (copy.volume) {
      body += `<text x="${cx}" y="${y + h - 6}" text-anchor="middle" fill="${p.muted}" font-family="Inter, sans-serif" font-size="2.6">${esc(copy.volume)}</text>`
    }
  } else if (isTop) {
    body += `<text x="${cx}" y="${y + h / 2}" text-anchor="middle" fill="${p.fg}" font-family="${font}" font-size="4">${esc(copy.brand.toUpperCase())}</text>`
    body += iconStrip(x + Math.max(4, w / 2 - 20), y + h - 10, p.muted, 8)
  }

  return `<g clip-path="${clip(panel)}">${body}</g>`
}

export function composeArtwork(
  brief: DesignBrief,
  dieline: DielineModel,
  copy: DesignSpec['copy'],
  palette: Palette,
  overrides: DesignOverrides,
  logoHref?: string,
): ArtworkModel {
  const layers = dieline.panels.map((panel) => ({
    panelId: panel.id,
    markup: panelArt(panel, brief, copy, palette, overrides, logoHref),
  }))
  const frontPanelId =
    dieline.panels.find((p) => p.id === 'front' || p.id === 'label' || p.id === 'trayFront')?.id ??
    dieline.panels[0].id
  return {
    layers,
    frontPanelId,
    language: languageId(brief),
  }
}

export function artworkMarkup(artwork: ArtworkModel): string {
  return artwork.layers.map((l) => l.markup).join('')
}

export function clipDefs(dieline: DielineModel): string {
  return dieline.panels.map(clipDef).join('')
}

export function renderFrontSvg(
  dieline: DielineModel,
  artwork: ArtworkModel,
  palette: Palette,
): string {
  const panel = dieline.panels.find((p) => p.id === artwork.frontPanelId)
  if (!panel) return ''
  const pad = 6
  const layer = artwork.layers.find((l) => l.panelId === panel.id)?.markup ?? ''
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
