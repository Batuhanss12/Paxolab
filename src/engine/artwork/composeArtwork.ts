import type { ArtworkModel, DesignBrief, DesignOverrides, DesignSpec, DielineModel, Palette, Panel } from '../../types'
import type { DesignSystem } from '../designSystem/types'
import { resolveDesignSystem } from '../designSystem/resolve'
import { renderMarkStrip } from '../marks/render'
import type { CraftPlan } from './craft'
import { buildCraftPlan } from './craft'
import { languageId } from './languages'
import { monogram } from './copy'
import {
  claimCapsules,
  contourGoldField,
  diagonalFoil,
  geoLattice,
  lBrackets,
  leafStampField,
  ornamentalRail,
} from './motifs'

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function clip(panel: Panel): string {
  return `url(#clip-${panel.id})`
}

function clipDef(panel: Panel): string {
  const pts = (panel.polygon?.length ? panel.polygon : [
    { x: panel.x, y: panel.y },
    { x: panel.x + panel.w, y: panel.y },
    { x: panel.x + panel.w, y: panel.y + panel.h },
    { x: panel.x, y: panel.y + panel.h },
  ])
    .map((p) => `${p.x},${p.y}`)
    .join(' ')
  return `<clipPath id="clip-${panel.id}" clipPathUnits="userSpaceOnUse"><polygon points="${pts}" /></clipPath>`
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

function mm(size: number, min: number): number {
  return Math.max(min, size)
}

function frames(panel: Panel, p: Palette, count: number, rounded: boolean, luxury = false): string {
  if (count <= 0) return ''
  const r = rounded ? 2.2 : 0
  const steps = luxury
    ? [1.15, 2.05, 3.1, 4.25]
    : count === 3
      ? [1.35, 2.45, 3.65]
      : count === 2
        ? [1.7, 3.05]
        : [2.3]
  return steps
    .map((inset, i) => {
      const sw = luxury ? [0.52, 0.28, 0.18, 0.12][i] : i === 0 ? 0.46 : i === 1 ? 0.22 : 0.16
      const op = luxury ? 1 - i * 0.14 : 1 - i * 0.18
      return `<rect x="${panel.x + inset}" y="${panel.y + inset}" width="${panel.w - inset * 2}" height="${panel.h - inset * 2}" rx="${r}" fill="none" stroke="${p.accent}" stroke-opacity="${op}" stroke-width="${sw}" />`
    })
    .join('')
}

function corners(panel: Panel, p: Palette): string {
  const { x, y, w, h } = panel
  const L = 5.4
  const o = 2.05
  const pts: [number, number, number, number, number, number][] = [
    [x + o, y + o + L, x + o, y + o, x + o + L, y + o],
    [x + w - o - L, y + o, x + w - o, y + o, x + w - o, y + o + L],
    [x + o, y + h - o - L, x + o, y + h - o, x + o + L, y + h - o],
    [x + w - o - L, y + h - o, x + w - o, y + h - o, x + w - o, y + h - o - L],
  ]
  return pts
    .map(
      ([x1, y1, x2, y2, x3, y3]) =>
        `<path d="M${x1} ${y1} L${x2} ${y2} L${x3} ${y3}" fill="none" stroke="${p.accent}" stroke-width="0.42" />`,
    )
    .join('')
}

function cornerDiamonds(panel: Panel, p: Palette): string {
  const { x, y, w, h } = panel
  const o = 6.2
  const d = 1.05
  const pts = [
    [x + o, y + o],
    [x + w - o, y + o],
    [x + o, y + h - o],
    [x + w - o, y + h - o],
  ]
  return pts
    .map(
      ([cx, cy]) =>
        `<path d="M${cx} ${cy - d} L${cx + d} ${cy} L${cx} ${cy + d} L${cx - d} ${cy} Z" fill="${p.accent}" fill-opacity="0.9" />`,
    )
    .join('')
}

function sideTicks(panel: Panel, p: Palette): string {
  const { x, y, w, h } = panel
  const midY = y + h / 2
  const midX = x + w / 2
  return `
    <line x1="${x + 1.25}" y1="${midY - 4.4}" x2="${x + 1.25}" y2="${midY + 4.4}" stroke="${p.accent}" stroke-width="0.24" />
    <line x1="${x + w - 1.25}" y1="${midY - 4.4}" x2="${x + w - 1.25}" y2="${midY + 4.4}" stroke="${p.accent}" stroke-width="0.24" />
    <line x1="${midX - 4.4}" y1="${y + 1.25}" x2="${midX + 4.4}" y2="${y + 1.25}" stroke="${p.accent}" stroke-width="0.24" />
    <line x1="${midX - 4.4}" y1="${y + h - 1.25}" x2="${midX + 4.4}" y2="${y + h - 1.25}" stroke="${p.accent}" stroke-width="0.24" />
  `
}

function foilHairline(panel: Panel, p: Palette): string {
  return `
    <rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="1.2" fill="${p.accent}" />
    <rect x="${panel.x}" y="${panel.y + 1.2}" width="${panel.w}" height="0.28" fill="${p.paper}" opacity="0.45" />
  `
}

function perfumeCrest(panel: Panel, p: Palette, dense: boolean): string {
  const cx = panel.x + panel.w / 2
  const cy = panel.y + panel.h * 0.148
  const r = Math.min(panel.w, panel.h) * (dense ? 0.082 : 0.062)
  const ticks = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5]
    .map((deg) => {
      const a = (deg * Math.PI) / 180
      const inner = r + (dense ? 0.55 : 0.85)
      const outer = r + (dense ? 2.35 : 1.55)
      const sw = deg % 45 === 0 ? 0.22 : 0.14
      return `<line x1="${cx + Math.cos(a) * inner}" y1="${cy + Math.sin(a) * inner}" x2="${cx + Math.cos(a) * outer}" y2="${cy + Math.sin(a) * outer}" stroke="${p.accent}" stroke-width="${sw}" />`
    })
    .join('')
  return `
    <circle cx="${cx}" cy="${cy}" r="${r + 2.7}" fill="none" stroke="${p.accent}" stroke-opacity="0.28" stroke-width="0.14" />
    <circle cx="${cx}" cy="${cy}" r="${r + 1.15}" fill="none" stroke="${p.accent}" stroke-opacity="0.55" stroke-width="0.16" />
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.accent}" stroke-width="0.36" />
    <circle cx="${cx}" cy="${cy}" r="${r * 0.48}" fill="none" stroke="${p.accent}" stroke-opacity="0.55" stroke-width="0.15" />
    <path d="M${cx} ${cy - r * 0.28} L${cx + r * 0.22} ${cy} L${cx} ${cy + r * 0.28} L${cx - r * 0.22} ${cy} Z" fill="${p.accent}" fill-opacity="0.85" />
    ${dense ? ticks : ''}
  `
}

function classicCartouche(panel: Panel, p: Palette): string {
  const cx = panel.x + panel.w / 2
  const cy = panel.y + panel.h * 0.16
  const rx = Math.min(8.4, panel.w * 0.18)
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="4.6" fill="none" stroke="${p.accent}" stroke-width="0.32" />
    <ellipse cx="${cx}" cy="${cy}" rx="${rx - 1.15}" ry="3.45" fill="none" stroke="${p.accent}" stroke-opacity="0.55" stroke-width="0.16" />
    <path d="M${cx} ${cy - 1.35} L${cx + 1.05} ${cy} L${cx} ${cy + 1.35} L${cx - 1.05} ${cy} Z" fill="${p.accent}" />
  `
}

function ecoLeaf(panel: Panel, p: Palette): string {
  const cx = panel.x + panel.w / 2
  const cy = panel.y + panel.h * 0.17
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${Math.min(9.2, panel.w * 0.2)}" ry="${Math.min(6.4, panel.h * 0.055)}" fill="none" stroke="${p.accent}" stroke-width="0.32" />
    <path d="M${cx} ${cy - 5.2} C${cx + 3.6} ${cy - 1.4} ${cx + 3.8} ${cy + 3.2} ${cx} ${cy + 5.6} C${cx - 3.8} ${cy + 3.2} ${cx - 3.6} ${cy - 1.4} ${cx} ${cy - 5.2}" fill="none" stroke="${p.accent}" stroke-width="0.3" />
    <line x1="${cx}" y1="${cy - 4.6}" x2="${cx}" y2="${cy + 4.8}" stroke="${p.accent}" stroke-width="0.18" />
  `
}

function playfulBadge(panel: Panel, p: Palette): string {
  const cx = panel.x + panel.w / 2
  const cy = panel.y + panel.h * 0.18
  const r = Math.min(panel.w, panel.h) * 0.09
  return `
    <circle cx="${cx}" cy="${cy}" r="${r + 1.6}" fill="${p.accent}" opacity="0.18" />
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.accent}" stroke-width="0.42" />
  `
}

function creamMotif(panel: Panel, p: Palette): string {
  const cx = panel.x + panel.w / 2
  const cy = panel.y + panel.h * 0.18
  return `<ellipse cx="${cx}" cy="${cy}" rx="${Math.min(7.2, panel.w * 0.16)}" ry="3.4" fill="none" stroke="${p.accent}" stroke-width="0.28" />`
}

function serumMotif(panel: Panel, p: Palette): string {
  const cx = panel.x + panel.w / 2
  const y = panel.y + panel.h * 0.14
  return `<path d="M${cx} ${y} C${cx + 2.4} ${y + 3.2} ${cx + 2.4} ${y + 7} ${cx} ${y + 9.2} C${cx - 2.4} ${y + 7} ${cx - 2.4} ${y + 3.2} ${cx} ${y}" fill="none" stroke="${p.accent}" stroke-width="0.3" />`
}

function foodStamp(panel: Panel, p: Palette): string {
  const cx = panel.x + panel.w / 2
  const cy = panel.y + panel.h * 0.19
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${panel.w * 0.2}" ry="${panel.h * 0.062}" fill="none" stroke="${p.accent}" stroke-width="0.34" />
    <ellipse cx="${cx}" cy="${cy}" rx="${panel.w * 0.155}" ry="${panel.h * 0.045}" fill="none" stroke="${p.accent}" stroke-width="0.18" />
    <path d="M${cx} ${cy - 5} C${cx + 3.4} ${cy - 1.2} ${cx + 3.6} ${cy + 3.4} ${cx} ${cy + 6} C${cx - 3.6} ${cy + 3.4} ${cx - 3.4} ${cy - 1.2} ${cx} ${cy - 5}" fill="none" stroke="${p.accent}" stroke-width="0.28" />
  `
}

function oliveWreath(panel: Panel, p: Palette): string {
  const cx = panel.x + panel.w / 2
  const cy = panel.y + panel.h * 0.165
  const leaves = [200, 220, 240, 260, 280, 300, 320, 340, 20, 40, 60, 80, 100, 120, 140, 160]
    .map((deg) => {
      const a = (deg * Math.PI) / 180
      const r = Math.min(panel.w, panel.h) * 0.085
      const x = cx + Math.cos(a) * r
      const y = cy + Math.sin(a) * r * 0.72
      return `<ellipse cx="${x}" cy="${y}" rx="1.15" ry="0.55" transform="rotate(${deg} ${x} ${y})" fill="none" stroke="${p.accent}" stroke-width="0.22" />`
    })
    .join('')
  return `
    ${leaves}
    <circle cx="${cx}" cy="${cy}" r="1.05" fill="none" stroke="${p.accent}" stroke-width="0.28" />
  `
}

function metalPlaque(panel: Panel, p: Palette): string {
  const { x, y, w, h } = panel
  const px = x + w * 0.14
  const py = y + h * 0.34
  const pw = w * 0.72
  const ph = h * 0.22
  return `
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="none" stroke="${p.accent}" stroke-width="0.28" />
    <line x1="${px + 1.2}" y1="${py + 1.1}" x2="${px + pw - 1.2}" y2="${py + 1.1}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.12" />
    <line x1="${px + 1.2}" y1="${py + ph - 1.1}" x2="${px + pw - 1.2}" y2="${py + ph - 1.1}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.12" />
  `
}

function wrapSeam(panel: Panel, p: Palette): string {
  const { x, y, w } = panel
  return `
    <polygon points="${x + w - 2.4},${y + 3.2} ${x + w - 0.7},${y + 4.6} ${x + w - 2.4},${y + 6}" fill="${p.accent}" />
    <text x="${x + w - 3.4}" y="${y + 10.2}" text-anchor="end" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="1.7" letter-spacing="0.8">SEAM</text>
  `
}

function ecoGrain(panel: Panel, p: Palette): string {
  let lines = ''
  for (let i = 0; i < 9; i++) {
    const yy = panel.y + 3.2 + i * ((panel.h - 6.4) / 9)
    const wobble = (i % 3) * 0.55
    lines += `<line x1="${panel.x + 2.4}" y1="${yy}" x2="${panel.x + panel.w - 2.4}" y2="${yy + 0.9 + wobble * 0.15}" stroke="${p.fg}" stroke-opacity="0.07" stroke-width="0.38" />`
  }
  const seeds = [
    [0.16, 0.22], [0.38, 0.31], [0.62, 0.18], [0.81, 0.36], [0.24, 0.55],
    [0.71, 0.48], [0.48, 0.62], [0.19, 0.78], [0.86, 0.72], [0.55, 0.86],
  ]
  seeds.forEach(([fx, fy]) => {
    lines += `<circle cx="${panel.x + panel.w * fx}" cy="${panel.y + panel.h * fy}" r="0.32" fill="${p.fg}" opacity="0.08" />`
  })
  return lines
}

function techSlab(panel: Panel, p: Palette, dense: boolean): string {
  const { x, y, w, h } = panel
  let grid = `<rect x="${x}" y="${y}" width="2.4" height="${h}" fill="${p.accent}" />`
  if (dense) {
    for (let gx = x + 8; gx < x + w - 3; gx += 6.2) {
      grid += `<line x1="${gx}" y1="${y + 3}" x2="${gx}" y2="${y + h - 3}" stroke="${p.fg}" stroke-opacity="0.07" stroke-width="0.16" />`
    }
  }
  return grid
}

function modernStripe(panel: Panel, p: Palette): string {
  return `
    <rect x="${panel.x}" y="${panel.y}" width="3.05" height="${panel.h}" fill="${p.accent}" />
    <line x1="${panel.x + 3.05}" y1="${panel.y}" x2="${panel.x + panel.w}" y2="${panel.y}" stroke="${p.accent}" stroke-width="0.28" />
  `
}

function goldBar(panel: Panel, p: Palette, volume: string, estimated: boolean): string {
  const bh = 9.15
  const y = panel.y + panel.h - bh
  const label = estimated ? `℮  ${volume.toUpperCase()}` : volume.toUpperCase()
  return `
    <rect x="${panel.x}" y="${y}" width="${panel.w}" height="${bh}" fill="${p.accent}" />
    <rect x="${panel.x + 1.15}" y="${y + 1.05}" width="${panel.w - 2.3}" height="${bh - 2.1}" fill="none" stroke="${p.bg}" stroke-opacity="0.38" stroke-width="0.22" />
    <text x="${panel.x + panel.w / 2}" y="${y + bh * 0.64}" text-anchor="middle" fill="${p.bg}" font-family="Inter, Arial, sans-serif" font-size="3.15" letter-spacing="2.05">${esc(label)}</text>
  `
}

function capsuleVolume(panel: Panel, p: Palette, volume: string): string {
  const bw = Math.min(panel.w * 0.62, 38)
  const bh = 8.4
  const x = panel.x + (panel.w - bw) / 2
  const y = panel.y + panel.h - bh - 4.2
  return `
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${p.accent}" />
    <text x="${x + bw / 2}" y="${y + bh * 0.66}" text-anchor="middle" fill="${p.bg}" font-family="Inter, Arial, sans-serif" font-size="2.85" letter-spacing="1.4">${esc(volume.toUpperCase())}</text>
  `
}

function stampVolume(panel: Panel, p: Palette, volume: string): string {
  const cx = panel.x + panel.w / 2
  const cy = panel.y + panel.h * 0.84
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${Math.min(16, panel.w * 0.28)}" ry="5.1" fill="none" stroke="${p.accent}" stroke-width="0.36" />
    <text x="${cx}" y="${cy + 1.1}" text-anchor="middle" fill="${p.fg}" font-family="Georgia, serif" font-size="2.7" letter-spacing="1.2">${esc(`℮  ${volume.toUpperCase()}`)}</text>
  `
}

function outlineVolume(panel: Panel, p: Palette, volume: string, left: boolean, ax: number): string {
  const bw = Math.min(28, panel.w * 0.42)
  const x = left ? ax : panel.x + panel.w / 2 - bw / 2
  const y = panel.y + panel.h * 0.8
  return `
    <rect x="${x}" y="${y}" width="${bw}" height="6.4" fill="none" stroke="${p.fg}" stroke-width="0.28" />
    <text x="${x + bw / 2}" y="${y + 4.35}" text-anchor="middle" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-size="2.35" letter-spacing="1.5">${esc(volume.toUpperCase())}</text>
  `
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

function legalHead(x: number, y: number, label: string, p: Palette, serif: boolean): string {
  const font = serif ? "Georgia, 'Times New Roman', serif" : 'Inter, Arial, sans-serif'
  return `<text x="${x}" y="${y}" fill="${p.accent}" font-family="${font}" font-size="1.95" letter-spacing="1.2">${esc(label)}</text>`
}

function legalBlock(
  x: number,
  y: number,
  w: number,
  title: string,
  lines: string[],
  p: Palette,
  serif: boolean,
  lineH: number,
): { markup: string; height: number } {
  const pad = 2.15
  const h = pad + 3.2 + lines.length * lineH + pad
  const markup = `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}" opacity="0.42" />
    <rect x="${x}" y="${y}" width="0.58" height="${h}" fill="${p.accent}" />
    ${legalHead(x + 2.4, y + 3.05, title, p, serif)}
    ${lines
      .map(
        (line, i) =>
          `<text x="${x + 2.4}" y="${y + 6.15 + i * lineH}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-size="2.02">${esc(line)}</text>`,
      )
      .join('')}
  `
  return { markup, height: h }
}

function marksBar(x: number, y: number, w: number, p: Palette, plan: CraftPlan): string {
  const ids = plan.grammar === 'label' ? plan.marks.labelStrip : plan.marks.strip
  const gap = Math.min(plan.marks.recipe.placement.gapMm + plan.marks.recipe.placement.minMm, (w - 8) / Math.max(1, ids.length))
  return `
    <rect x="${x}" y="${y}" width="${w}" height="11.4" fill="${p.paper}" opacity="0.35" />
    <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="0.2" />
    ${renderMarkStrip(x + 2.2, y + 1.7, p.muted, ids, plan.marks.recipe, plan.allowPerfumeAssets, gap, plan.marks.recipe.placement.minMm)}
  `
}

function glueOnly(panel: Panel, p: Palette): string {
  const { x, y, w, h } = panel
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}" />
    <text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" fill="${p.muted}" font-size="${Math.min(2.4, h * 0.16)}" font-family="Inter, Arial, sans-serif" letter-spacing="0.9">GLUE</text>`
}

function flapGround(panel: Panel, p: Palette, luxuryTick: boolean): string {
  const { x, y, w, h } = panel
  let mark = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}" />`
  if (luxuryTick && w > 8 && h > 6) {
    mark += `<line x1="${x + 1.2}" y1="${y + 1.2}" x2="${x + 3.4}" y2="${y + 1.2}" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="0.16" />`
  }
  return mark
}

function frontDecor(panel: Panel, system: DesignSystem, p: Palette): string {
  const { style, decor, grammar, sector } = system
  if (grammar === 'label') {
    let out = ''
    if (style === 'luxury') out += frames(panel, p, 1, false, false) + lBrackets(panel, p.accent)
    else if (style === 'playful' || style === 'eco') out += frames(panel, p, 1, true)
    else if (style === 'modern') out += modernStripe(panel, p)
    if (style === 'eco') out += leafStampField(panel, p.accent)
    return out
  }
  let out = ''
  if (style === 'luxury') {
    out += contourGoldField(panel, p.accent, sector === 'perfume' ? 0.2 : 0.12)
    if (sector === 'electronics' || sector === 'food') out += diagonalFoil(panel, p.accent)
    out += foilHairline(panel, p)
    out += frames(panel, p, 3, false, true)
    out += corners(panel, p)
    out += lBrackets(panel, p.accent)
    out += cornerDiamonds(panel, p)
    if (sector === 'perfume') out += sideTicks(panel, p)
  } else {
    out += frames(panel, p, style === 'classic' ? 2 : style === 'playful' || style === 'eco' ? 1 : 0, style === 'playful' || style === 'eco')
    if (style === 'modern') {
      out += modernStripe(panel, p)
      out += geoLattice(panel, p.fg, 0.08)
    }
    if (style === 'classic') out += ornamentalRail(panel, p.accent)
    if (style === 'eco') out += leafStampField(panel, p.accent)
    if (style === 'playful') out += claimCapsules(panel, p)
  }
  if (decor === 'crest') out += perfumeCrest(panel, p, true)
  else if (decor === 'cartouche') out += classicCartouche(panel, p)
  else if (decor === 'leaf') out += ecoLeaf(panel, p)
  else if (decor === 'badge') out += playfulBadge(panel, p)
  else if (decor === 'olive' || decor === 'harvest') out += oliveWreath(panel, p)
  else if (decor === 'drop') out += serumMotif(panel, p)
  else if (decor === 'oval') out += creamMotif(panel, p)
  else if (decor === 'grid' && style === 'luxury') out += metalPlaque(panel, p)
  else if (decor === 'grid') out += techSlab(panel, p, system.density !== 'sparse')
  return out
}

function panelArt(
  panel: Panel,
  brief: DesignBrief,
  copy: DesignSpec['copy'],
  p: Palette,
  overrides: DesignOverrides,
  system: DesignSystem,
  plan: CraftPlan,
  logoHref?: string,
): string {
  const style = system.style
  const font = system.serif ? "Georgia, 'Times New Roman', serif" : 'Inter, Arial, sans-serif'
  const { x, y, w, h } = panel
  const cx = x + w / 2
  const id = panel.id
  const s = overrides.logoScale
  const t = overrides.titleScale
  const mark = monogram(copy.brand)
  const showBarcode = overrides.barcodeVisible && !!copy.barcode
  const cat = system.category
  const perfume = system.sector === 'perfume'
  const min = system.type.minMm

  if (panel.role === 'glue' || id === 'glue' || id === 'overlap') {
    return glueOnly(panel, p)
  }
  if (panel.role === 'tuck' || id.includes('Dust')) {
    return flapGround(panel, p, style === 'luxury' && !system.brandOnTucks)
  }

  const isFront = id === 'front' || id === 'label' || id === 'trayFront'
  const isBack = id === 'back' || id === 'trayBack'
  const isSide = id === 'left' || id === 'right' || id === 'trayLeft' || id === 'trayRight'
  const isTop = id === 'top' || id === 'bottom' || id === 'trayBottom'
  const labelFace = system.grammar === 'label' && isFront

  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />`
  if (style === 'eco') body += ecoGrain(panel, p)

  if (isFront) {
    body += frontDecor(panel, system, p)
    if (labelFace && system.wrapSeam) body += wrapSeam(panel, p)
  } else if (isBack) {
    body += frames(panel, p, style === 'luxury' ? 1 : 0, false)
  } else if (isSide) {
    if (style === 'modern') {
      body += `<rect x="${x}" y="${y}" width="${w}" height="2.2" fill="${p.accent}" />`
      body += geoLattice(panel, p.fg, 0.07)
    }
    if (style === 'luxury') {
      body += contourGoldField(panel, p.accent, 0.14)
      body += `<line x1="${x + 1.3}" y1="${y + 3.5}" x2="${x + 1.3}" y2="${y + h - 3.5}" stroke="${p.accent}" stroke-width="0.18" />`
    }
    if (style === 'eco') body += leafStampField(panel, p.accent)
    if (style === 'classic') body += `<line x1="${x + 1.4}" y1="${y + 4}" x2="${x + w - 1.4}" y2="${y + 4}" stroke="${p.accent}" stroke-width="0.2" />`
  }

  if (isFront) {
    const left = system.align === 'left'
    const ax = left ? x + (labelFace ? 6.4 : 8.2) : cx
    const anchor = left ? 'start' : 'middle'
    const crest = system.decor === 'crest' || system.decor === 'cartouche' || system.decor === 'leaf' || system.decor === 'badge' || system.decor === 'olive'
    const logoY = y + h * (crest ? 0.155 : style === 'minimal' ? 0.36 : labelFace ? 0.22 : 0.2)

    if (logoHref) {
      const ls = 9.2 * s
      body += `<image href="${logoHref}" x="${ax - (left ? 0 : ls / 2)}" y="${logoY - ls / 2}" width="${ls}" height="${ls}" preserveAspectRatio="xMidYMid meet" />`
    } else if (style !== 'minimal') {
      const monoSize = mm((perfume ? 4.6 : 5.5) * s, min)
      body += `<text x="${ax}" y="${logoY + 1.35}" text-anchor="${anchor}" fill="${p.accent}" font-family="${font}" font-size="${monoSize}" letter-spacing="${style === 'modern' ? 0.25 : 1.4}">${esc(mark)}</text>`
    }

    if (style === 'modern' || system.lockup === 'tech-grid' || system.lockup === 'left-index') {
      body += `<text x="${x + w - 5.2}" y="${y + 6.4}" text-anchor="end" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="2.15" letter-spacing="1.8">${system.sector === 'electronics' ? 'SPEC' : '01'}</text>`
    }

    const brandY = y + h * ((style === 'minimal' ? 0.46 : system.lockup === 'metal-plaque' ? 0.48 : 0.4) - system.type.opticalLift)
    const brandSize = mm(Math.min(system.type.displayMm, w * (style === 'minimal' ? 0.1 : 0.128)) * t, min)
    body += `<text x="${ax}" y="${brandY}" text-anchor="${anchor}" fill="${p.fg}" font-family="${font}" font-size="${brandSize}" letter-spacing="${system.type.trackingDisplay}">${esc(copy.brand.toUpperCase())}</text>`

    if (style === 'luxury' && !labelFace) {
      const ruleW = w * 0.18
      body += `<line x1="${cx - ruleW}" y1="${brandY + 3.35}" x2="${cx + ruleW}" y2="${brandY + 3.35}" stroke="${p.accent}" stroke-width="0.36" />`
      body += `<path d="M${cx} ${brandY + 2.55} L${cx + 0.85} ${brandY + 3.35} L${cx} ${brandY + 4.15} L${cx - 0.85} ${brandY + 3.35} Z" fill="${p.accent}" />`
    } else if (style === 'classic') {
      const ruleW = w * 0.16
      body += `<line x1="${(left ? ax : cx) - (left ? 0 : ruleW)}" y1="${brandY + 2.9}" x2="${(left ? ax : cx) + ruleW}" y2="${brandY + 2.9}" stroke="${p.accent}" stroke-width="0.18" />`
      body += `<line x1="${(left ? ax : cx) - (left ? 0 : ruleW)}" y1="${brandY + 3.55}" x2="${(left ? ax : cx) + ruleW}" y2="${brandY + 3.55}" stroke="${p.accent}" stroke-width="0.18" />`
    } else if (style === 'minimal') {
      const ruleW = w * 0.1
      body += `<line x1="${cx - ruleW}" y1="${brandY + 3.4}" x2="${cx + ruleW}" y2="${brandY + 3.4}" stroke="${p.fg}" stroke-width="0.2" />`
    } else if (style === 'eco') {
      body += `<line x1="${cx - w * 0.14}" y1="${brandY + 3.2}" x2="${cx + w * 0.14}" y2="${brandY + 3.2}" stroke="${p.accent}" stroke-width="0.22" />`
    } else if (labelFace && style === 'luxury') {
      const ruleW = w * 0.16
      body += `<line x1="${cx - ruleW}" y1="${brandY + 3.1}" x2="${cx + ruleW}" y2="${brandY + 3.1}" stroke="${p.accent}" stroke-width="0.28" />`
    }

    const prodY = brandY + (style === 'minimal' ? 7.4 : 8.6)
    body += `<text x="${ax}" y="${prodY}" text-anchor="${anchor}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-size="${mm(Math.min(system.type.productMm, w * 0.05) * t, min)}" letter-spacing="${system.type.trackingProduct}" opacity="0.92">${esc(copy.product.toUpperCase())}</text>`
    if (cat && style !== 'minimal') {
      body += `<text x="${ax}" y="${prodY + 4.55}" text-anchor="${anchor}" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-size="${mm(system.type.metaMm, min - 0.4)}" letter-spacing="${system.type.trackingMeta}">${esc(cat)}</text>`
    }
    body += `<text x="${ax}" y="${y + h * (style === 'minimal' ? 0.64 : labelFace ? 0.58 : 0.61)}" text-anchor="${anchor}" fill="${p.muted}" font-family="${system.serif ? 'Georgia, serif' : 'Inter, Arial, sans-serif'}" font-size="${mm(system.type.taglineMm, min)}" font-style="${system.serif ? 'italic' : 'normal'}">${esc(copy.tagline)}</text>`

    if (labelFace && copy.ingredients) {
      const line = wrapLines(copy.ingredients, Math.max(18, Math.floor(w / 2.2)), system.wrapSeam ? 2 : 3)[0]
      if (line) {
        body += `<text x="${ax}" y="${y + h * 0.72}" text-anchor="${anchor}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="${mm(system.type.legalMm, 2.2)}" letter-spacing="${system.type.trackingLegal}">${esc(line)}</text>`
      }
    }
    if (labelFace) {
      const ids = plan.marks.labelStrip
      const gap = Math.min(7.2, (w - 10) / Math.max(1, ids.length))
      body += renderMarkStrip(
        left ? ax : cx - (ids.length * gap) / 2,
        y + h - 8.6,
        p.muted,
        ids,
        plan.marks.recipe,
        plan.allowPerfumeAssets,
        gap,
        Math.min(5.6, plan.marks.recipe.placement.minMm),
      )
    }

    if (system.goldBar && copy.volume && !labelFace) {
      body += goldBar(panel, p, copy.volume, perfume || system.sector === 'cream' || system.sector === 'serum' || system.sector === 'food')
    } else if (style === 'playful' && copy.volume) {
      body += capsuleVolume(panel, p, copy.volume)
    } else if (style === 'eco' && copy.volume) {
      body += stampVolume(panel, p, copy.volume)
    } else if (style === 'modern' && copy.volume) {
      body += outlineVolume(panel, p, copy.volume, left, ax)
    } else if (copy.volume) {
      body += `<text x="${ax}" y="${y + h * (labelFace ? 0.78 : 0.82)}" text-anchor="${anchor}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-size="${mm(system.type.volumeMm, min)}" letter-spacing="${system.type.volumeCase === 'smallcaps' ? 2.05 : 1.6}">${esc((perfume || system.sector === 'food' ? '℮  ' : '') + copy.volume.toUpperCase())}</text>`
    }

    if (showBarcode && style === 'luxury' && !labelFace) {
      body += barcodeMarks(copy.barcode, cx - 11, y + h - 15.6, 22, 3.6, p.bg)
    } else if (showBarcode) {
      body += barcodeMarks(copy.barcode, (left ? ax : cx) - 12, y + h * 0.88, 26, 5.0, p.fg)
    }
  } else if (isBack) {
    const padX = 4.4
    const blockW = w - padX * 2
    let cursor = y + 6.2
    body += `<text x="${cx}" y="${cursor}" text-anchor="middle" fill="${p.accent}" font-family="${font}" font-size="3.05" letter-spacing="1.2">${esc(copy.product.toUpperCase())}</text>`
    cursor += 3.6
    body += `<text x="${cx}" y="${cursor}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="2.0" letter-spacing="1.2">${esc(cat || copy.brand.toUpperCase())}</text>`
    cursor += 3.6

    const first = system.legal[0]
    const second = system.legal[1]
    const inci = wrapLines(copy.ingredients, Math.max(16, Math.floor(w / 2.05)), perfume ? 6 : 5)
    const warns = wrapLines(copy.warnings, Math.max(16, Math.floor(w / 2.05)), 4)

    if (style === 'minimal') {
      body += `<line x1="${x + padX}" y1="${cursor}" x2="${x + w - padX}" y2="${cursor}" stroke="${p.fg}" stroke-width="0.18" />`
      cursor += 4.2
      body += legalHead(x + padX, cursor, first?.title ?? 'SPEC', p, false)
      cursor += 3.2
      inci.forEach((line) => {
        body += `<text x="${x + padX}" y="${cursor}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-size="${mm(system.type.legalMm, 1.9)}">${esc(line)}</text>`
        cursor += 2.9
      })
      cursor += 3.4
      body += legalHead(x + padX, cursor, second?.title ?? 'CAUTION', p, false)
      cursor += 3.1
      warns.forEach((line) => {
        body += `<text x="${x + padX}" y="${cursor}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="${mm(system.type.legalMm, 1.9)}">${esc(line)}</text>`
        cursor += 2.8
      })
    } else {
      const a = legalBlock(x + padX, cursor, blockW, first?.title ?? 'SPEC', inci, p, system.serif, 2.85)
      body += a.markup
      cursor += a.height + 2.2
      const b = legalBlock(x + padX, cursor, blockW, second?.title ?? 'CAUTION', warns, p, system.serif, 2.75)
      body += b.markup
      cursor += b.height + 2.0
    }

    if (copy.volume) {
      body += `<text x="${x + padX}" y="${cursor + 2.4}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-size="2.1" letter-spacing="0.7">${esc(`℮  ${copy.volume}`)}${system.pao ? '  ·  12M' : ''}</text>`
    }

    const markY = y + h - 13.6
    body += marksBar(x + padX, markY, blockW, p, plan)
  } else if (isSide) {
    const spine = (copy.volume || cat || copy.product).toUpperCase()
    body += `<line x1="${cx}" y1="${y + 5.2}" x2="${cx}" y2="${y + 9.4}" stroke="${p.accent}" stroke-width="0.2" />`
    body += `<text transform="translate(${cx + 1.05} ${y + h / 2}) rotate(-90)" text-anchor="middle" fill="${p.fg}" font-family="${font}" font-size="3.15" letter-spacing="1.5">${esc(spine)}</text>`
    if (copy.volume && spine !== copy.volume.toUpperCase()) {
      body += `<text x="${cx}" y="${y + h - 4.6}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="2.05">${esc(copy.volume)}</text>`
    }
  } else if (isTop) {
    if (cat) {
      body += `<text x="${cx}" y="${y + h * 0.42}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-size="2.15" letter-spacing="1.2">${esc(cat)}</text>`
    } else if (copy.volume) {
      body += `<text x="${cx}" y="${y + h * 0.42}" text-anchor="middle" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-size="2.4">${esc(copy.volume)}</text>`
    }
    body += renderMarkStrip(
      x + Math.max(3.2, w / 2 - 14),
      y + h - 9.0,
      p.muted,
      plan.marks.strip.slice(0, 3),
      plan.marks.recipe,
      plan.allowPerfumeAssets,
      7.6,
      6.4,
    )
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
  system = resolveDesignSystem(brief, dieline.structureId),
): ArtworkModel {
  const plan = buildCraftPlan(brief, dieline, copy, system)
  const layers = dieline.panels.map((panel) => ({
    panelId: panel.id,
    markup: panelArt(panel, brief, copy, palette, overrides, system, plan, logoHref),
  }))
  const frontPanelId =
    dieline.panels.find((p) => p.id === 'front' || p.id === 'label' || p.id === 'trayFront')?.id ??
    dieline.panels[0].id
  return {
    layers,
    frontPanelId,
    language: languageId(brief),
    systemKey: system.key,
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

export function renderArtworkDoc(dieline: DielineModel, artwork: ArtworkModel, title: string): string {
  const pad = 8
  const w = dieline.width + pad * 2
  const h = dieline.height + pad * 2
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">
  <title>${esc(title)} — FORMA artwork</title>
  <defs>${clipDefs(dieline)}</defs>
  <g transform="translate(${pad} ${pad})">${artworkMarkup(artwork)}</g>
</svg>`
}
