import type { ArtworkModel, DesignBrief, DesignOverrides, DesignSpec, DielineModel, Palette, Panel, StyleType } from '../../types'
import { iconStrip } from './icons'
import { languageId, styleProfile, type LanguageId } from './languages'
import { categoryLine, monogram } from './copy'

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function clip(panel: Panel): string {
  return `url(#clip-${panel.id})`
}

function clipDef(panel: Panel): string {
  return `<clipPath id="clip-${panel.id}"><rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" /></clipPath>`
}

function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word
    if (next.length > maxChars && cur) {
      lines.push(cur)
      cur = word
      if (lines.length >= maxLines) return lines
    } else {
      cur = next
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur)
  return lines
}

function markKind(lang: LanguageId): 'cosmetics' | 'food' | 'electronics' | 'generic' {
  if (lang === 'electronics-precision') return 'electronics'
  if (lang === 'food-harvest') return 'food'
  return 'cosmetics'
}

function frames(panel: Panel, p: Palette, count: number, rounded: boolean): string {
  if (count <= 0) return ''
  const r = rounded ? 1.6 : 0
  let out = ''
  const steps = count === 3 ? [1.5, 2.7, 3.9] : count === 2 ? [1.8, 3.1] : [2.2]
  steps.forEach((inset, i) => {
    out += `<rect x="${panel.x + inset}" y="${panel.y + inset}" width="${panel.w - inset * 2}" height="${panel.h - inset * 2}" rx="${r}" fill="none" stroke="${p.accent}" stroke-opacity="${0.95 - i * 0.22}" stroke-width="${i === 0 ? 0.42 : 0.22}" />`
  })
  return out
}

function corners(panel: Panel, p: Palette): string {
  const { x, y, w, h } = panel
  const L = 4.2
  const o = 2.4
  const segs: [number, number, number, number, number, number][] = [
    [x + o, y + o + L, x + o, y + o, x + o + L, y + o],
    [x + w - o - L, y + o, x + w - o, y + o, x + w - o, y + o + L],
    [x + o, y + h - o - L, x + o, y + h - o, x + o + L, y + h - o],
    [x + w - o - L, y + h - o, x + w - o, y + h - o, x + w - o, y + h - o - L],
  ]
  return segs
    .map(
      ([x1, y1, x2, y2, x3, y3]) =>
        `<path d="M${x1} ${y1} L${x2} ${y2} L${x3} ${y3}" fill="none" stroke="${p.accent}" stroke-width="0.38" />`,
    )
    .join('')
}

function perfumeOrnament(panel: Panel, p: Palette, dense: boolean): string {
  const { x, y, w, h } = panel
  const cx = x + w / 2
  const r = Math.min(w, h) * (dense ? 0.075 : 0.06)
  const ticks = dense
    ? [0, 45, 90, 135, 180, 225, 270, 315]
        .map((deg) => {
          const a = (deg * Math.PI) / 180
          const x1 = cx + Math.cos(a) * (r + 0.6)
          const y1 = y + h * 0.168 + Math.sin(a) * (r + 0.6)
          const x2 = cx + Math.cos(a) * (r + 1.8)
          const y2 = y + h * 0.168 + Math.sin(a) * (r + 1.8)
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${p.accent}" stroke-width="0.2" />`
        })
        .join('')
    : ''
  return `
    <circle cx="${cx}" cy="${y + h * 0.168}" r="${r}" fill="none" stroke="${p.accent}" stroke-width="0.32" />
    <circle cx="${cx}" cy="${y + h * 0.168}" r="${r * 0.55}" fill="none" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="0.18" />
    ${ticks}
  `
}

function foodOrnament(panel: Panel, p: Palette): string {
  const { x, y, w, h } = panel
  const cx = x + w / 2
  const cy = y + h * 0.2
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${w * 0.16}" ry="${h * 0.055}" fill="none" stroke="${p.accent}" stroke-width="0.32" />
    <path d="M${cx} ${cy - 4.2} C${cx + 3.2} ${cy - 1} ${cx + 3.4} ${cy + 3} ${cx} ${cy + 5.2} C${cx - 3.4} ${cy + 3} ${cx - 3.2} ${cy - 1} ${cx} ${cy - 4.2}" fill="none" stroke="${p.accent}" stroke-width="0.3" />
  `
}

function techOrnament(panel: Panel, p: Palette, amount: number): string {
  const { x, y, w, h } = panel
  let grid = ''
  const step = amount > 0.4 ? 5.2 : 7
  for (let gx = x + 3.5; gx < x + w - 3; gx += step) {
    grid += `<line x1="${gx}" y1="${y + 2.8}" x2="${gx}" y2="${y + h - 2.8}" stroke="${p.fg}" stroke-opacity="0.06" stroke-width="0.16" />`
  }
  return `${grid}<rect x="${x + 3}" y="${y + 3}" width="${Math.min(8, w * 0.18)}" height="1.05" fill="${p.accent}" />`
}

function modernRule(panel: Panel, p: Palette): string {
  const y = panel.y + panel.h * 0.36
  return `<rect x="${panel.x}" y="${y}" width="3.2" height="0.7" fill="${p.accent}" />`
}

function barcodeMarks(value: string, x: number, y: number, w: number, h: number, color: string): string {
  const bars = value.split('').map((ch) => 1 + (Number(ch) || 1) % 3)
  const total = bars.reduce((a, b) => a + b, 0)
  let cursor = x
  return bars
    .map((bw, i) => {
      const width = (bw / total) * w
      const el =
        i % 2 === 0
          ? `<rect x="${cursor}" y="${y}" width="${Math.max(0.35, width * 0.72)}" height="${h}" fill="${color}" />`
          : ''
      cursor += width
      return el
    })
    .join('')
}

function goldBar(panel: Panel, p: Palette, volume: string, playful: boolean): string {
  const bh = playful ? 9.5 : 8.2
  const y = panel.y + panel.h - bh
  return `<rect x="${panel.x}" y="${y}" width="${panel.w}" height="${bh}" fill="${p.accent}" />
    <text x="${panel.x + panel.w / 2}" y="${y + bh * 0.66}" text-anchor="middle" fill="${p.bg}" font-family="Inter, sans-serif" font-size="3.1" letter-spacing="1.5">${esc(volume.toUpperCase())}</text>`
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
  const style = (brief.styleType || 'classic') as StyleType
  const sw = styleProfile(style)
  const font = sw.serif ? "Georgia, 'Instrument Serif', serif" : 'Inter, system-ui, sans-serif'
  const { x, y, w, h } = panel
  const cx = x + w / 2
  const id = panel.id
  const s = overrides.logoScale
  const t = overrides.titleScale
  const mark = monogram(copy.brand)
  const showBarcode = overrides.barcodeVisible && !!copy.barcode
  const cat = categoryLine(brief)

  if (id === 'glue' || id === 'overlap' || id === 'topTuck' || id === 'bottomTuck' || id.includes('Dust')) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}" />
      ${id.includes('glue') || id === 'overlap' ? `<text x="${cx}" y="${y + h / 2}" text-anchor="middle" fill="${p.muted}" font-size="${Math.min(2.8, h * 0.18)}" font-family="Inter, sans-serif" letter-spacing="0.8">GLUE</text>` : ''}`
  }

  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />`
  body += frames(panel, p, sw.frame, style === 'playful')
  if (sw.corners) body += corners(panel, p)

  const isFront = id === 'front' || id === 'label' || id === 'trayFront'
  const isBack = id === 'back' || id === 'trayBack'
  const isSide = id === 'left' || id === 'right' || id === 'trayLeft' || id === 'trayRight'
  const isTop = id === 'top' || id === 'bottom' || id === 'trayBottom'

  if (isFront && sw.ornament > 0) {
    if (lang === 'perfume-luxury') body += perfumeOrnament(panel, p, sw.density === 'dense')
    else if (lang === 'food-harvest') body += foodOrnament(panel, p)
    else if (lang === 'electronics-precision') body += techOrnament(panel, p, sw.ornament)
    else if (style === 'modern') body += modernRule(panel, p)
  }

  if (isFront) {
    const logoY = y + h * (lang === 'perfume-luxury' ? 0.168 : 0.2)
    if (logoHref) {
      const ls = 9.5 * s
      body += `<image href="${logoHref}" x="${cx - ls / 2}" y="${logoY - ls / 2}" width="${ls}" height="${ls}" preserveAspectRatio="xMidYMid meet" />`
    } else if (lang === 'perfume-luxury') {
      body += `<text x="${cx}" y="${logoY + 1.35}" text-anchor="middle" fill="${p.accent}" font-family="${font}" font-size="${5.4 * s}" letter-spacing="1.6">${esc(mark)}</text>`
    } else {
      body += `<text x="${cx}" y="${logoY + 1.6}" text-anchor="middle" fill="${p.accent}" font-family="${font}" font-size="${5.8 * s}" letter-spacing="${style === 'modern' ? 0.4 : 1.1}">${esc(mark)}</text>`
    }

    const brandY = y + h * (style === 'minimal' ? 0.46 : 0.4)
    const brandSize = Math.min(style === 'modern' ? 8.2 : 9.2, w * (style === 'minimal' ? 0.11 : 0.128)) * t
    body += `<text x="${cx}" y="${brandY}" text-anchor="middle" fill="${p.fg}" font-family="${font}" font-size="${brandSize}" letter-spacing="${sw.tracking * 0.16}">${esc(copy.brand.toUpperCase())}</text>`

    if (sw.frame > 0 || lang === 'perfume-luxury') {
      const ruleW = w * (style === 'modern' ? 0.22 : 0.18)
      body += `<line x1="${cx - ruleW}" y1="${brandY + 3.4}" x2="${cx + ruleW}" y2="${brandY + 3.4}" stroke="${p.accent}" stroke-width="${style === 'luxury' ? 0.32 : 0.2}" />`
    }

    body += `<text x="${cx}" y="${brandY + 8.4}" text-anchor="middle" fill="${p.fg}" font-family="Inter, sans-serif" font-size="${Math.min(3.6, w * 0.055) * t}" letter-spacing="${style === 'modern' ? 1.8 : 1.15}" opacity="0.9">${esc(copy.product.toUpperCase())}</text>`
    if (cat) {
      body += `<text x="${cx}" y="${brandY + 13}" text-anchor="middle" fill="${p.accent}" font-family="Inter, sans-serif" font-size="2.5" letter-spacing="1.6">${esc(cat)}</text>`
    }
    body += `<text x="${cx}" y="${y + h * 0.62}" text-anchor="middle" fill="${p.muted}" font-family="${sw.serif ? 'Georgia, serif' : 'Inter, sans-serif'}" font-size="3.3" font-style="${sw.serif ? 'italic' : 'normal'}">${esc(copy.tagline)}</text>`

    if (sw.goldBar && copy.volume) {
      body += goldBar(panel, p, copy.volume, style === 'playful')
    } else if (copy.volume) {
      body += `<text x="${cx}" y="${y + h * 0.8}" text-anchor="middle" fill="${p.fg}" font-family="Inter, sans-serif" font-size="3" letter-spacing="1.6">${esc(copy.volume.toUpperCase())}</text>`
    }

    if (showBarcode && !sw.goldBar) {
      body += barcodeMarks(copy.barcode, cx - 13, y + h * 0.86, 26, 5.4, p.fg)
      body += `<text x="${cx}" y="${y + h * 0.94}" text-anchor="middle" fill="${p.muted}" font-family="ui-monospace, monospace" font-size="2">${esc(copy.barcode)}</text>`
    } else if (showBarcode) {
      body += barcodeMarks(copy.barcode, cx - 12, y + h - 14.5, 24, 4.2, p.bg)
    }
  } else if (isBack) {
    const head = y + 7.2
    body += `<text x="${cx}" y="${head}" text-anchor="middle" fill="${p.accent}" font-family="${font}" font-size="3.6" letter-spacing="1.4">${esc(copy.brand.toUpperCase())}</text>`
    body += `<text x="${cx}" y="${head + 4.4}" text-anchor="middle" fill="${p.muted}" font-family="Inter, sans-serif" font-size="2.1" letter-spacing="1.3">${esc(cat || copy.product.toUpperCase())}</text>`
    body += `<line x1="${x + 5}" y1="${head + 6.4}" x2="${x + w - 5}" y2="${head + 6.4}" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="0.18" />`

    body += `<text x="${x + 5}" y="${head + 10.2}" fill="${p.accent}" font-family="Inter, sans-serif" font-size="2" letter-spacing="1.1">${lang === 'electronics-precision' ? 'SPEC' : lang === 'food-harvest' ? 'CONTENTS' : 'COMPOSITION'}</text>`
    const inci = wrapLines(copy.ingredients, Math.max(18, Math.floor(w / 2.05)), 6)
    inci.forEach((line, i) => {
      body += `<text x="${x + 5}" y="${head + 13.4 + i * 3.05}" fill="${p.fg}" font-family="Inter, sans-serif" font-size="2.15">${esc(line)}</text>`
    })

    const warnY = head + 13.4 + inci.length * 3.05 + 4
    body += `<text x="${x + 5}" y="${warnY}" fill="${p.accent}" font-family="Inter, sans-serif" font-size="2" letter-spacing="1.1">CAUTION</text>`
    const warns = wrapLines(copy.warnings, Math.max(18, Math.floor(w / 2.05)), 4)
    warns.forEach((line, i) => {
      body += `<text x="${x + 5}" y="${warnY + 3.2 + i * 2.9}" fill="${p.muted}" font-family="Inter, sans-serif" font-size="2.05">${esc(line)}</text>`
    })

    const markY = y + h - 11
    body += iconStrip(x + 4.5, markY, p.muted, markKind(lang), Math.min(8.6, (w - 10) / 4))
  } else if (isSide) {
    body += `<line x1="${cx}" y1="${y + 5}" x2="${cx}" y2="${y + 12}" stroke="${p.accent}" stroke-width="0.28" />`
    body += `<text transform="translate(${cx + 1.15} ${y + h / 2}) rotate(-90)" text-anchor="middle" fill="${p.fg}" font-family="${font}" font-size="4.1" letter-spacing="1.7">${esc(copy.brand.toUpperCase())}</text>`
    if (copy.volume) {
      body += `<text x="${cx}" y="${y + h - 5.5}" text-anchor="middle" fill="${p.muted}" font-family="Inter, sans-serif" font-size="2.4">${esc(copy.volume)}</text>`
    }
  } else if (isTop) {
    body += `<text x="${cx}" y="${y + h * 0.42}" text-anchor="middle" fill="${p.fg}" font-family="${font}" font-size="3.6" letter-spacing="1.3">${esc(copy.brand.toUpperCase())}</text>`
    body += iconStrip(x + Math.max(3.5, w / 2 - 17), y + h - 9.5, p.muted, markKind(lang), 8.2)
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
