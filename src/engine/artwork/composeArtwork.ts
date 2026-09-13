import type { ArtworkModel, DesignBrief, DesignOverrides, DesignSpec, DielineModel, Palette, Panel } from '../../types'
import { barcodeSvg } from '../barcode'
import type { DesignPlan } from '../brain/DesignPlan'
import type { DesignSystem } from '../designSystem/types'
import { paintBackgroundTreatment, paintSectorBackground, paintStyleBackground } from './backgroundTreatments'
import {
  heroPaintScale,
  heroYFrac,
  kitHeroFamily,
  paintBadgeMark,
  paintCrestMark,
  paintDropMark,
  paintHeroGraphic,
  paintOvalMark,
  paintSealMark,
  wrapHero,
} from './heroGraphics'
import { layoutFrontLockup, volumeMarkup } from '../designSystem/typeSystem'
import { resolveDesignSystem } from '../designSystem/resolve'
import { perfumeAssetsAllowed, resolveStickerMarks } from '../marks/MarkMatrix'
import { renderMarkStrip } from '../marks/render'
import type { CraftPlan } from './craft'
import { buildCraftPlan } from './craft'
import { fontStack, languageId } from './languages'
import { backFill, frontSpecLine, monogram } from './copy'
import { paintPrimitives } from './illustrationPrimitives'
import { diamondAt, lBrackets, legalColumnChrome, lockupWindow, spineLuxuryField, wrapContinuity, type SafeRect } from './motifs'
import { paintPatternFamily, wrapPattern, wrapSidePattern } from './patternFamilies'
import { escapeSvg as esc, minMm as mm, panelClip as clip, wrapSvgLines as wrapLines } from './svgGeometry'

export { artworkMarkup, clipDefs, renderArtNetSvg, renderArtworkDoc, renderFrontSvg } from './renderArtwork'

function lockupRule(layout: ReturnType<typeof layoutFrontLockup>, panel: Panel, p: Palette): string {
  if (!layout.hasRule || layout.ruleY == null) return ''
  const { ax, ruleY, ruleKind } = layout
  const cx = panel.x + panel.w / 2
  const left = layout.anchor === 'start'
  const origin = left ? ax : cx
  if (ruleKind === 'foil') {
    const ruleW = panel.w * (layout.taglineSize < 3 ? 0.16 : 0.17)
    return `<line x1="${origin - (left ? 0 : ruleW)}" y1="${ruleY}" x2="${origin + ruleW}" y2="${ruleY}" stroke="${p.accent}" stroke-width="0.34" />
      <path d="M${origin} ${ruleY - 0.72} L${origin + 0.78} ${ruleY} L${origin} ${ruleY + 0.72} L${origin - 0.78} ${ruleY} Z" fill="${p.accent}" />`
  }
  if (ruleKind === 'double') {
    const ruleW = panel.w * 0.15
    return `<line x1="${origin - (left ? 0 : ruleW)}" y1="${ruleY - 0.32}" x2="${origin + ruleW}" y2="${ruleY - 0.32}" stroke="${p.accent}" stroke-width="0.16" />
      <line x1="${origin - (left ? 0 : ruleW)}" y1="${ruleY + 0.32}" x2="${origin + ruleW}" y2="${ruleY + 0.32}" stroke="${p.accent}" stroke-width="0.16" />`
  }
  if (ruleKind === 'hair') {
    const ruleW = panel.w * 0.09
    return `<line x1="${cx - ruleW}" y1="${ruleY}" x2="${cx + ruleW}" y2="${ruleY}" stroke="${p.fg}" stroke-width="0.18" />`
  }
  if (ruleKind === 'eco') {
    return `<line x1="${cx - panel.w * 0.13}" y1="${ruleY}" x2="${cx + panel.w * 0.13}" y2="${ruleY}" stroke="${p.accent}" stroke-width="0.2" />`
  }
  return ''
}

function lockoutClip(id: string, panel: Panel, hole: SafeRect): string {
  const { x, y, w, h } = panel
  return `<defs><clipPath id="lockout-${id}" clipPathUnits="userSpaceOnUse"><path fill-rule="evenodd" d="M${x} ${y}h${w}v${h}h${-w}z M${hole.x} ${hole.y}h${hole.w}v${hole.h}h${-hole.w}z" /></clipPath></defs>`
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

/** Sector-specific frame: electronics uses corner brackets, food uses decorative corners. */
function sectorFrame(panel: Panel, p: Palette, sector: string, style: string): string {
  if (sector === 'electronics' && (style === 'modern' || style === 'minimal')) {
    // L-brackets at corners — technical, precise.
    return lBrackets(panel, p.accent)
  }
  if ((sector === 'food' || sector === 'beverage') && (style === 'luxury' || style === 'classic')) {
    // Double-line with small decorative diamonds at corners.
    const inset = 2.3
    const d = diamondAt(panel.x + inset, panel.y + inset, p.accent, 0.6)
    const d2 = diamondAt(panel.x + panel.w - inset, panel.y + inset, p.accent, 0.6)
    const d3 = diamondAt(panel.x + inset, panel.y + panel.h - inset, p.accent, 0.6)
    const d4 = diamondAt(panel.x + panel.w - inset, panel.y + panel.h - inset, p.accent, 0.6)
    return `${frames(panel, p, 1, false, false)}${d}${d2}${d3}${d4}`
  }
  return frames(panel, p, 1, style === 'eco' || style === 'playful', style === 'luxury')
}

function perfumeCrest(panel: Panel, p: Palette, dense: boolean, yFrac = 0.148, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(panel.w, panel.h) * (dense ? 0.082 : 0.062) * scale
  return paintCrestMark(cx, cy, r, p.accent, dense)
}

function classicCartouche(panel: Panel, p: Palette, yFrac = 0.16, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(8.4, panel.w * 0.16) * scale
  return paintSealMark(cx, cy, r, p.accent)
}

function ecoLeaf(panel: Panel, p: Palette, yFrac = 0.17, scale = 1, xFrac = 0.5): string {
  return paintHeroGraphic('botanical', panel, p, scale, yFrac, xFrac)
}

function playfulBadge(panel: Panel, p: Palette, yFrac = 0.18, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(panel.w, panel.h) * 0.09 * scale
  return paintBadgeMark(cx, cy, r, p.accent)
}

function creamMotif(panel: Panel, p: Palette, yFrac = 0.18, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(7.2, panel.w * 0.14) * scale
  return paintOvalMark(cx, cy, r, p.accent)
}

function serumMotif(panel: Panel, p: Palette, yFrac = 0.14, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(panel.w, panel.h) * 0.07 * scale
  return paintDropMark(cx, cy, r, p.accent)
}

function ingredientBadges(raw: string, ax: number, y: number, anchor: 'middle' | 'start', p: Palette, minMm: number): string {
  const claims = raw.split(/[+,;·]/).map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 4)
  if (!claims.length) return ''
  const badgeW = Math.max(14, Math.min(22, 60 / claims.length))
  const badgeH = 4.8
  const gap = 2.2
  const totalW = claims.length * badgeW + (claims.length - 1) * gap
  const startX = anchor === 'middle' ? ax - totalW / 2 : ax
  const sz = Math.max(minMm, 1.6)
  let out = ''
  claims.forEach((label, i) => {
    const bx = startX + i * (badgeW + gap)
    out += `<rect x="${bx}" y="${y}" width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}" fill="none" stroke="${p.accent}" stroke-width="0.24" />`
    out += `<text x="${bx + badgeW / 2}" y="${y + badgeH * 0.62}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="${sz}" letter-spacing="0.25">${label}</text>`
  })
  if (claims.length > 1) {
    for (let i = 0; i < claims.length - 1; i++) {
      const px = startX + (i + 1) * badgeW + i * gap + gap / 2
      out += `<text x="${px}" y="${y + badgeH * 0.65}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="${Math.max(minMm, 1.4)}">+</text>`
    }
  }
  return `<g data-art="ingredient-badges">${out}</g>`
}

function foodNutritionTable(x: number, y: number, w: number, p: Palette, system: DesignSystem, compact = false): string {
  const rows = compact
    ? [
        ['Enerji', '1360 kJ / 320 kcal'],
        ['Yağ', '0 g'],
        ['Karbonhidrat', '80 g'],
        ['Protein', '0,3 g'],
      ]
    : [
        ['Enerji', '1360 kJ / 320 kcal'],
        ['Yağ', '0 g'],
        ['Karbonhidrat', '80 g'],
        ['  - Şeker', '80 g'],
        ['Protein', '0,3 g'],
        ['Tuz', '0 g'],
      ]
  const colW = Math.min(w * (compact ? 0.62 : 0.48), compact ? 42 : 36)
  const sz = Math.max(system.type.legalMm, compact ? 1.55 : 1.7)
  const lineH = sz + (compact ? 0.7 : 0.95)
  let out = ''
  let cy = y
  out += `<text x="${x}" y="${cy}" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="2.0" letter-spacing="1.1">BESİN DEĞERLERİ (100 g)</text>`
  cy += 3.2
  out += `<line x1="${x}" y1="${cy}" x2="${x + colW}" y2="${cy}" stroke="${p.accent}" stroke-width="0.2" />`
  cy += 1.2
  rows.forEach(([label, value], i) => {
    out += `<text x="${x}" y="${cy + i * lineH}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${sz}">${label}</text>`
    out += `<text x="${x + colW}" y="${cy + i * lineH}" text-anchor="end" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="500" font-feature-settings="'tnum'" font-size="${sz}">${value}</text>`
  })
  cy += rows.length * lineH + 1.2
  out += `<line x1="${x}" y1="${cy}" x2="${x + colW}" y2="${cy}" stroke="${p.accent}" stroke-width="0.14" />`
  return `<g data-art="nutrition-table">${out}</g>`
}

function foodClaimStrip(panel: Panel, p: Palette, y: number, ax: number, anchor: 'middle' | 'start', minMm: number): string {
  const claims: [string, string][] = [
    ['%100', 'DOĞAL'],
    ['✓', 'KATKISIZ'],
    ['❋', 'DOĞAL ÜRÜN'],
  ]
  const gap = Math.min(18, panel.w * 0.22)
  const r = Math.min(4.2, panel.w * 0.054)
  const sz = Math.max(minMm, 1.55)
  const iconSz = Math.max(minMm + 0.5, 2.2)
  let out = ''
  claims.forEach(([icon, label], i) => {
    const cx = anchor === 'middle' ? ax + (i - 1) * gap : ax + i * gap + 4
    out += `<rect x="${cx - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" fill="${p.accent}" fill-opacity="0.08" stroke="${p.accent}" stroke-width="0.24" />`
    out += `<line x1="${cx - r + 0.7}" y1="${y - r + 0.55}" x2="${cx + r - 0.7}" y2="${y - r + 0.55}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.12" />`
    out += `<text x="${cx}" y="${y + 0.65}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="${iconSz}" letter-spacing="0.1">${icon}</text>`
    out += `<text x="${cx}" y="${y + r + 2.4}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="${sz}" letter-spacing="0.4">${label}</text>`
  })
  return `<g data-art="claim-strip">${out}</g>`
}

function oliveWreath(panel: Panel, p: Palette, yFrac = 0.165, scale = 1, xFrac = 0.5): string {
  return paintHeroGraphic('harvest', panel, p, scale, yFrac, xFrac)
}

function metalPlaque(panel: Panel, p: Palette, xFrac = 0.5): string {
  const { x, y, w, h } = panel
  const cx = x + w * xFrac
  const pw = w * 0.72
  const px = cx - pw / 2
  const py = y + h * 0.34
  const ph = h * 0.22
  return `
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="none" stroke="${p.accent}" stroke-width="0.28" />
    <line x1="${px + 1.2}" y1="${py + 1.1}" x2="${px + pw - 1.2}" y2="${py + 1.1}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.12" />
    <line x1="${px + 1.2}" y1="${py + ph - 1.1}" x2="${px + pw - 1.2}" y2="${py + ph - 1.1}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.12" />
  `
}

function techSlab(panel: Panel, p: Palette, _dense: boolean): string {
  const { x, y, h } = panel
  return `<rect x="${x}" y="${y}" width="2.4" height="${h}" fill="${p.accent}" />`
}

/** Professional seam indicator: dashed registration line with tick marks. */
function wrapSeam(panel: Panel, p: Palette): string {
  const { x, y, w, h } = panel
  const sx = x + w - 1.6
  const top = y + 2.5
  const bot = y + h - 2.5
  const ticks = 5
  let tickMarks = ''
  for (let i = 0; i <= ticks; i++) {
    const ty = top + ((bot - top) / ticks) * i
    tickMarks += `<line x1="${sx - 0.8}" y1="${ty}" x2="${sx + 0.4}" y2="${ty}" stroke="${p.accent}" stroke-opacity="0.35" stroke-width="0.1" />`
  }
  return `
    <line x1="${sx}" y1="${top}" x2="${sx}" y2="${bot}" stroke="${p.accent}" stroke-opacity="0.3" stroke-width="0.12" stroke-dasharray="0.8 0.6" />
    ${tickMarks}
    <text x="${sx - 1.2}" y="${y + h * 0.5}" text-anchor="end" transform="rotate(-90 ${sx - 1.2} ${y + h * 0.5})" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="1.4" letter-spacing="0.6">SEAM</text>
  `
}

function modernStripe(panel: Panel, p: Palette): string {
  return `
    <rect x="${panel.x}" y="${panel.y}" width="3.05" height="${panel.h}" fill="${p.accent}" />
    <line x1="${panel.x + 3.05}" y1="${panel.y}" x2="${panel.x + panel.w}" y2="${panel.y}" stroke="${p.accent}" stroke-width="0.28" />
  `
}

function goldBar(panel: Panel, p: Palette, volume: string, estimated: boolean, system: DesignSystem): string {
  const bh = 9.15
  const y = panel.y + panel.h - bh
  const type = { ...system.type, volumeMm: Math.max(system.type.volumeMm, 2.95) }
  return `
    <rect x="${panel.x}" y="${y}" width="${panel.w}" height="${bh}" fill="${p.accent}" />
    <rect x="${panel.x + 1.15}" y="${y + 1.05}" width="${panel.w - 2.3}" height="${bh - 2.1}" fill="none" stroke="${p.bg}" stroke-opacity="0.38" stroke-width="0.22" />
    ${volumeMarkup(panel.x + panel.w / 2, y + bh * 0.64, volume, type, p.bg, 'middle', fontStack('sans'), estimated)}
  `
}

function capsuleVolume(panel: Panel, p: Palette, volume: string, system: DesignSystem): string {
  const bw = Math.min(panel.w * 0.62, 38)
  const bh = 8.4
  const x = panel.x + (panel.w - bw) / 2
  const y = panel.y + panel.h - bh - 4.2
  return `
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${p.accent}" />
    ${volumeMarkup(x + bw / 2, y + bh * 0.66, volume, system.type, p.bg, 'middle', fontStack('sans'), false)}
  `
}

function stampVolume(panel: Panel, p: Palette, volume: string, system: DesignSystem): string {
  const cx = panel.x + panel.w / 2
  const cy = panel.y + panel.h * 0.84
  const sw = Math.min(18, panel.w * 0.32)
  const sh = 5.6
  const inset = 0.6
  return `
    <rect x="${cx - sw / 2}" y="${cy - sh / 2}" width="${sw}" height="${sh}" rx="${sh * 0.12}" fill="none" stroke="${p.accent}" stroke-width="0.34" />
    <rect x="${cx - sw / 2 + inset}" y="${cy - sh / 2 + inset}" width="${sw - inset * 2}" height="${sh - inset * 2}" rx="${sh * 0.08}" fill="none" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.14" />
    ${volumeMarkup(cx, cy + 1.1, volume, system.type, p.fg, 'middle', fontStack('serif'), true)}
  `
}

function outlineVolume(panel: Panel, p: Palette, volume: string, left: boolean, ax: number, system: DesignSystem): string {
  const bw = Math.min(28, panel.w * 0.42)
  const x = left ? ax : panel.x + panel.w / 2 - bw / 2
  const y = panel.y + panel.h * 0.8
  return `
    <rect x="${x}" y="${y}" width="${bw}" height="6.4" fill="none" stroke="${p.fg}" stroke-width="0.28" />
    ${volumeMarkup(x + bw / 2, y + 4.35, volume, system.type, p.fg, 'middle', fontStack('sans'), false)}
  `
}

function labelBackArt(
  panel: Panel,
  copy: DesignSpec['copy'],
  p: Palette,
  system: DesignSystem,
  brief: DesignBrief,
): string {
  const { x, y, w, h } = panel
  const sticker = resolveStickerMarks(system.sector, w, h, brief)
  const header = 11.2
  const footer = Math.min(22, Math.max(14, h * 0.22))
  const lineH = Math.max(2.65, h < 50 ? 2.35 : 2.65)
  const bodySpace = h - header - footer - 8
  const maxLines = Math.max(3, Math.floor(bodySpace / lineH))
  const usage = wrapLines(copy.warnings || sticker.warnings, Math.max(16, Math.floor((w - 8) / 1.9)), Math.ceil(maxLines * 0.55))
  const how = wrapLines(copy.ingredients, Math.max(16, Math.floor((w - 8) / 1.9)), Math.max(2, maxLines - usage.length - 2))
  const ids = sticker.strip
  const footY = y + h - footer
  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />`
  body += `<text x="${x + 4}" y="${y + 5.4}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="1.7" letter-spacing="1.2">ARKA YÜZ</text>`
  body += `<text x="${x + w - 4}" y="${y + 5.4}" text-anchor="end" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="1.7" letter-spacing="0.8">${esc(copy.brand.toUpperCase())}</text>`
  body += `<text x="${x + 4}" y="${y + 9.6}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="2.2" letter-spacing="1.05">KULLANIM</text>`
  let cursor = y + header + 1.2
  how.forEach((line) => {
    body += `<text x="${x + 4}" y="${cursor}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="1.95">${esc(line)}</text>`
    cursor += lineH
  })
  cursor += 2.4
  body += `<text x="${x + 4}" y="${cursor}" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="2.05" letter-spacing="1.05">UYARI</text>`
  cursor += 3.1
  usage.forEach((line) => {
    body += `<text x="${x + 4}" y="${cursor}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="1.95">${esc(line)}</text>`
    cursor += lineH
  })
  if (system.sector === 'food' && cursor + 14 < footY - 6) {
    body += foodNutritionTable(x + 4, cursor + 2.2, w - 8, p, system, true)
  }
  if (copy.manufacturer) {
    body += `<text x="${x + 4}" y="${footY - 3.8}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="1.7">${esc(copy.manufacturer)}</text>`
  }
  if (copy.address) {
    body += `<text x="${x + 4}" y="${footY - 1.6}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="1.55">${esc(copy.address)}</text>`
  }
  body += `<line x1="${x + 4}" y1="${footY}" x2="${x + w - 4}" y2="${footY}" stroke="${p.muted}" stroke-opacity="0.5" stroke-width="0.16" />`
  if (ids.length) {
    const reserve = copy.barcode ? 28 : 6
    const span = Math.max(18, w - reserve - 6)
    body += renderMarkStrip(x + 4, footY + 2.2, span, p.accent, ids, sticker.recipe, perfumeAssetsAllowed(system.sector), 7.2)
  }
  if (copy.barcode) {
    body += barcodeSvg(copy.barcode, x + w - 28, footY + 2.4, 24, 7.2, p.fg)
  }
  return `<g clip-path="${clip(panel)}">${body}</g>`
}

function legalHead(x: number, y: number, label: string, p: Palette, serif: boolean, tracking: number): string {
  const font = serif ? "Georgia, 'Times New Roman', serif" : 'Inter, Arial, sans-serif'
  return `<text x="${x}" y="${y}" fill="${p.accent}" font-family="${font}" font-weight="600" font-size="1.95" letter-spacing="${tracking}">${esc(label)}</text>`
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
  legalMm: number,
  trackingLegal: number,
  index = '01',
): { markup: string; height: number } {
  const pad = 2.15
  const h = pad + 3.2 + lines.length * lineH + pad
  const lineYs = lines.map((_, i) => y + 6.15 + i * lineH)
  const markup = `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}" opacity="0.42" />
    <rect x="${x}" y="${y}" width="0.58" height="${h}" fill="${p.accent}" />
    ${legalColumnChrome(x, y, w, h, index, p.accent, lineYs)}
    ${legalHead(x + 8.0, y + 3.05, title, p, serif, Math.max(0.7, trackingLegal + 0.9))}
    ${lines
      .map(
        (line, i) =>
          `<text x="${x + 8.0}" y="${y + 6.15 + i * lineH}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${legalMm}" letter-spacing="${trackingLegal}">${esc(line)}</text>`,
      )
      .join('')}
  `
  return { markup, height: h }
}

function marksBar(x: number, y: number, w: number, p: Palette, plan: CraftPlan): string {
  const ids = plan.grammar === 'label' ? plan.marks.labelStrip : plan.marks.strip
  return `
    <rect x="${x}" y="${y}" width="${w}" height="11.4" fill="${p.paper}" opacity="0.35" />
    <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="0.2" />
    ${renderMarkStrip(x + 2.2, y + 1.7, Math.max(8, w - 4.4), p.accent, ids, plan.marks.recipe, plan.allowPerfumeAssets)}
  `
}

function glueOnly(panel: Panel, p: Palette): string {
  const { x, y, w, h } = panel
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}" />
    <text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" fill="${p.muted}" font-size="${Math.min(2.4, h * 0.16)}" font-family="Inter, Arial, sans-serif" letter-spacing="0.9">GLUE</text>`
}

function flapGround(panel: Panel, p: Palette, luxuryTick: boolean, mark = ''): string {
  const { x, y, w, h } = panel
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}" />`
  if (luxuryTick && w > 8 && h > 6) {
    out += `<line x1="${x + 1.2}" y1="${y + 1.2}" x2="${x + 3.4}" y2="${y + 1.2}" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="0.16" />`
  }
  if (mark && w > 10 && h > 8) {
    out += `<text x="${x + w / 2}" y="${y + h / 2 + 0.7}" text-anchor="middle" fill="${p.muted}" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.min(2.6, h * 0.28)}" letter-spacing="0.8">${esc(mark)}</text>`
  }
  return out
}

function labelDecor(panel: Panel, system: DesignSystem, p: Palette): string {
  const { style } = system
  if (system.wrapSeam) return ''
  if (style === 'luxury' || style === 'classic') return frames(panel, p, 1, false, false)
  if (style === 'playful' || style === 'eco') return frames(panel, p, 1, true)
  if (style === 'modern') return modernStripe(panel, p)
  return ''
}

function kitHeroMarkup(panel: Panel, system: DesignSystem, p: Palette, plan?: DesignPlan): string {
  const { decor, style } = system
  const scale = heroPaintScale(plan)
  const xFrac = plan?.composition.heroZone.x ?? 0.5
  if (decor === 'crest') return perfumeCrest(panel, p, true, heroYFrac(plan, 0.148), scale, xFrac)
  if (decor === 'cartouche') return classicCartouche(panel, p, heroYFrac(plan, 0.16), scale, xFrac)
  if (decor === 'leaf') return ecoLeaf(panel, p, heroYFrac(plan, 0.17), scale, xFrac)
  if (decor === 'badge') return playfulBadge(panel, p, heroYFrac(plan, 0.18), scale, xFrac)
  if (decor === 'olive' || decor === 'harvest') return oliveWreath(panel, p, heroYFrac(plan, 0.165), scale, xFrac)
  if (decor === 'drop') return serumMotif(panel, p, heroYFrac(plan, 0.14), scale, xFrac)
  if (decor === 'oval') return creamMotif(panel, p, heroYFrac(plan, 0.18), scale, xFrac)
  if (decor === 'grid' && style === 'luxury') return metalPlaque(panel, p, xFrac)
  if (decor === 'grid') return techSlab(panel, p, system.density !== 'sparse')
  return ''
}

function paintPlanHero(panel: Panel, system: DesignSystem, p: Palette, plan?: DesignPlan): string {
  const kitFamily = kitHeroFamily(system.decor)
  const family = plan?.heroGraphic.family ?? kitFamily
  const label = system.grammar === 'label'
  const libY = label ? Math.min(0.12, plan?.composition.heroZone.y ?? 0.11) : (plan?.composition.heroZone.y ?? 0.148)
  const libScale = ((plan?.heroGraphic.scale ?? 1) * (plan?.crop.heroCrop ?? 1)) * (label ? 0.82 : 1)
  const libX = plan?.composition.heroZone.x ?? 0.5
  if (family !== 'none' && family !== kitFamily) {
    return wrapHero(family, paintHeroGraphic(family, panel, p, libScale, libY, libX))
  }
  const kit = kitHeroMarkup(panel, system, p, plan)
  if (kit) return wrapHero(kitFamily === 'none' ? family : kitFamily, kit)
  if (family !== 'none') return wrapHero(family, paintHeroGraphic(family, panel, p, libScale, libY, libX))
  return ''
}

function frontDecor(panel: Panel, system: DesignSystem, p: Palette, safe?: SafeRect, plan?: DesignPlan): string {
  const { style, grammar } = system
  let out = ''
  if (grammar === 'label') {
    out += labelDecor(panel, system, p)
    out += paintPlanHero(panel, system, p, plan)
  } else {
    const sector = system.sector
    if (style === 'luxury' || style === 'classic') {
      out += sectorFrame(panel, p, sector, style)
    } else if (style === 'modern') {
      // Electronics gets corner brackets; others get modern stripe.
      if (sector === 'electronics') out += sectorFrame(panel, p, sector, style)
      else out += modernStripe(panel, p)
    } else if (style === 'eco' || style === 'playful') {
      out += sectorFrame(panel, p, sector, style)
    }
    // Grid intent: subtle column guides for modern/tech compositions.
    if (plan?.composition.intent === 'grid' && style === 'modern') {
      const { x, y, w, h } = panel
      const cols = 3
      for (let i = 1; i < cols; i++) {
        const gx = x + (w / cols) * i
        out += `<line x1="${gx}" y1="${y + 2}" x2="${gx}" y2="${y + h - 2}" stroke="${p.accent}" stroke-opacity="0.06" stroke-width="0.1" />`
      }
    }
    out += paintPlanHero(panel, system, p, plan)
  }

  const pattern = plan?.patternSystem
  if (pattern && pattern.family !== 'none') {
    const patternSafe = pattern.avoidLockup ? safe : undefined
    const markup = paintPatternFamily(pattern.family, panel, p.accent, pattern.opacity, patternSafe)
    out += wrapPattern(pattern.family, markup)
  }

  if (plan?.artDirection.chrome === 'full' && safe && grammar !== 'label') {
    out += lockupWindow(safe, p.accent)
  }

  const prims = plan?.illustrationSystem.primitives ?? []
  if (prims.length) {
    const filtered =
      system.decor === 'leaf' || system.decor === 'olive' ? prims.filter((id) => id !== 'leaf') : prims
    if (filtered.length) out += paintPrimitives(panel, p, filtered, 0.22, safe)
  }

  return out
}

function paintSidePattern(panel: Panel, system: DesignSystem, p: Palette, plan?: DesignPlan): string {
  const style = system.style
  const want = !!plan?.patternSystem.sideIntentional || style === 'luxury' || style === 'modern'
  if (!want) return ''
  if (panel.w < 8 || panel.h < 18) return ''

  const planned = plan?.patternSystem.family
  const family =
    planned && planned !== 'none'
      ? planned
      : style === 'luxury'
        ? 'contour'
        : style === 'modern'
          ? 'lattice'
          : style === 'eco'
            ? 'grain'
            : 'stripe'

  if (style === 'luxury') {
    return wrapSidePattern(family, spineLuxuryField(panel, p.accent))
  }

  const dens = plan?.density.side ?? 'sparse'
  const base = plan?.patternSystem.opacity ?? 0.1
  const op = dens === 'sparse' ? Math.min(0.07, base * 0.45) : dens === 'dense' ? base : base * 0.72
  return wrapSidePattern(family, paintPatternFamily(family, panel, p.accent, op))
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
  designPlan?: DesignPlan,
): string {
  const style = system.style
  const font = system.serif ? "Georgia, 'Times New Roman', serif" : 'Inter, Arial, sans-serif'
  const { x, y, w, h } = panel
  const cx = x + w / 2
  const id = panel.id
  const s = overrides.logoScale
  const cat = system.category
  const perfume = system.sector === 'perfume'
  const min = system.type.minMm

  if (id === 'labelBack' || id === 'warnLabel') {
    return labelBackArt(panel, copy, p, system, brief)
  }
  if (panel.role === 'glue' || id === 'glue' || id === 'overlap') {
    return glueOnly(panel, p)
  }
  if (panel.role === 'tuck' || id.includes('Dust')) {
    return flapGround(panel, p, false, '')
  }

  const isFront = id === 'front' || id === 'label' || id === 'trayFront'
  const isBack = id === 'back' || id === 'trayBack'
  const isSide = id === 'left' || id === 'right' || id === 'trayLeft' || id === 'trayRight'
  const isTop = id === 'top' || id === 'bottom' || id === 'trayBottom'
  const labelFace = system.grammar === 'label' && isFront

  const layout = isFront ? layoutFrontLockup(panel, system, copy, overrides, labelFace) : undefined
  const lockup = layout?.rect

  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />`
  if (lockup) body += lockoutClip(id, panel, lockup)
  if (isFront) {
    body += paintBackgroundTreatment(panel, designPlan?.backgroundTreatment ?? 'quiet-paper', p)
    body += paintStyleBackground(panel, style, p)
    if (designPlan) body += paintSectorBackground(panel, system.sector, style, p)
  }

  if (isFront) {
    body += frontDecor(panel, system, p, lockup, designPlan)
    if (labelFace && system.wrapSeam) {
      body += wrapSeam(panel, p)
      body += wrapContinuity(panel, p.accent)
    }
  } else if (isBack) {
    body += frames(panel, p, style === 'luxury' ? 1 : 0, false)
  } else if (isSide) {
    if (style === 'modern') {
      body += `<rect x="${x}" y="${y}" width="${w}" height="2.2" fill="${p.accent}" />`
    }
    body += paintSidePattern(panel, system, p, designPlan)
  }

  if (isFront && layout) {
    const left = system.align === 'left'
    const ax = layout.ax
    const anchor = layout.anchor
    const crest = system.decor === 'crest' || system.decor === 'cartouche' || system.decor === 'leaf' || system.decor === 'badge' || system.decor === 'olive' || system.decor === 'harvest'
    let logoY = y + h * (crest ? 0.155 : style === 'minimal' ? 0.36 : labelFace ? 0.22 : 0.2)
    if (logoY + 4.2 > layout.rect.y) logoY = layout.rect.y - 5.4

    if (logoHref) {
      const ls = 9.2 * s
      body += `<image href="${logoHref}" x="${ax - (left ? 0 : ls / 2)}" y="${logoY - ls / 2}" width="${ls}" height="${ls}" preserveAspectRatio="xMidYMid meet" />`
    }

    const brandLines = layout.brandLines.length ? layout.brandLines : [copy.brand.toUpperCase()]
    const brandYs = layout.brandYs.length ? layout.brandYs : [layout.brandY]
    brandLines.forEach((line, i) => {
      body += `<text x="${ax}" y="${brandYs[i] ?? layout.brandY}" text-anchor="${anchor}" fill="${p.fg}" font-family="${layout.brandFont}" font-weight="${layout.brandWeight}" font-size="${layout.brandSize}" letter-spacing="${layout.brandTracking}">${esc(line)}</text>`
    })
    body += lockupRule(layout, panel, p)
    if (copy.product.trim()) {
      body += `<text x="${ax}" y="${layout.productY}" text-anchor="${anchor}" fill="${p.fg}" font-family="${layout.productFont}" font-weight="${layout.productWeight}" font-size="${layout.productSize}" letter-spacing="${layout.productTracking}">${esc(copy.product.toUpperCase())}</text>`
    }
    if (cat && style !== 'minimal') {
      body += `<text x="${ax}" y="${layout.categoryY}" text-anchor="${anchor}" fill="${p.accent}" font-family="${layout.metaFont}" font-weight="${layout.metaWeight}" font-size="${layout.categorySize}" letter-spacing="${layout.categoryTracking}">${esc(cat)}</text>`
    }
    body += `<text x="${ax}" y="${layout.taglineY}" text-anchor="${anchor}" fill="${p.muted}" font-family="${system.serif ? 'Georgia, serif' : layout.metaFont}" font-weight="${system.style === 'minimal' ? 300 : 400}" font-size="${layout.taglineSize}" font-style="${system.serif ? 'italic' : 'normal'}">${esc(copy.tagline)}</text>`
    if (system.sector === 'food') {
      const netY = layout.taglineY + (labelFace ? 3.4 : 4.2)
      body += `<text x="${ax}" y="${netY}" text-anchor="${anchor}" fill="${p.accent}" font-family="${layout.metaFont}" font-weight="${layout.metaWeight}" font-size="${mm(system.type.metaMm, min)}" letter-spacing="1.1">NET</text>`
      if (copy.volume) {
        body += `<text x="${ax}" y="${netY + (labelFace ? 2.6 : 3.0)}" text-anchor="${anchor}" fill="${p.fg}" font-family="${layout.metaFont}" font-weight="${layout.metaWeight}" font-size="${mm(system.type.metaMm + (labelFace ? 0.2 : 0.5), min)}" letter-spacing="0.8">${esc(copy.volume.toUpperCase())}</text>`
      }
      const claimY = netY + (copy.volume ? (labelFace ? 7.2 : 11.4) : (labelFace ? 5.4 : 8.6))
      if (claimY + (labelFace ? 6 : 8) < y + h - (labelFace ? 8 : 14)) {
        body += foodClaimStrip(panel, p, claimY, ax, anchor, system.type.minMm)
      }
    }
    if (!labelFace && system.sector === 'electronics') {
      const spec = frontSpecLine(copy.ingredients)
      if (spec) {
        body += `<text x="${ax}" y="${y + h * 0.7}" text-anchor="${anchor}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${mm(system.type.legalMm, 2.0)}" letter-spacing="0.35">${esc(spec)}</text>`
      }
    }

    if (system.goldBar && copy.volume && !labelFace) {
      body += goldBar(panel, p, copy.volume, perfume || system.sector === 'cream' || system.sector === 'serum' || system.sector === 'food', system)
    } else if (!labelFace && style === 'playful' && copy.volume) {
      body += capsuleVolume(panel, p, copy.volume, system)
    } else if (!labelFace && style === 'eco' && copy.volume) {
      body += stampVolume(panel, p, copy.volume, system)
    } else if (!labelFace && style === 'modern' && copy.volume) {
      body += outlineVolume(panel, p, copy.volume, left, ax, system)
    } else if (copy.volume) {
      body += volumeMarkup(
        ax,
        y + h * (labelFace ? 0.78 : 0.82),
        copy.volume,
        system.type,
        p.fg,
        anchor,
        fontStack('sans'),
        perfume || system.sector === 'food',
      )
    }

    if (brief.ingredientClaims?.trim()) {
      const badgeY = layout.taglineY + (labelFace ? 5.8 : 7.4)
      if (badgeY + 5.5 < y + h - (system.goldBar ? 14 : 10)) {
        body += ingredientBadges(brief.ingredientClaims, ax, badgeY, anchor, p, system.type.minMm)
      }
    }

  } else if (isBack) {
    const padX = 4.4
    const blockW = w - padX * 2
    let cursor = y + 6.2
    body += `<text x="${cx}" y="${cursor}" text-anchor="middle" fill="${p.accent}" font-family="${font}" font-size="3.05" letter-spacing="1.2">${esc((copy.product || cat || copy.brand).toUpperCase())}</text>`
    cursor += 3.6
    body += `<text x="${cx}" y="${cursor}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="2.0" letter-spacing="1.2">${esc(cat || copy.brand.toUpperCase())}</text>`
    cursor += 3.6

    const first = system.legal[0]
    const second = system.legal[1]
    const shortBack = h < 70
    const inci = wrapLines(copy.ingredients, Math.max(16, Math.floor(w / 2.05)), shortBack && system.sector === 'food' ? 2 : perfume ? 6 : 5)
    const warns = wrapLines(copy.warnings, Math.max(16, Math.floor(w / 2.05)), shortBack ? 2 : 4)

    if (system.sector === 'food' && shortBack) {
      body += foodNutritionTable(x + padX, cursor, blockW, p, system, true)
      cursor += 14
    }

    const backFloor = y + h - (shortBack ? 14 : 32)
    if (style === 'minimal') {
      body += `<line x1="${x + padX}" y1="${cursor}" x2="${x + w - padX}" y2="${cursor}" stroke="${p.fg}" stroke-width="0.18" />`
      cursor += 4.2
      body += legalHead(x + padX, cursor, first?.title ?? 'SPEC', p, false, system.type.trackingMeta)
      cursor += 3.2
      inci.forEach((line) => {
        if (cursor > backFloor) return
        body += `<text x="${x + padX}" y="${cursor}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${mm(system.type.legalMm, 1.9)}" letter-spacing="${system.type.trackingLegal}">${esc(line)}</text>`
        cursor += 2.9
      })
      cursor += 3.4
      if (cursor < backFloor) {
        body += legalHead(x + padX, cursor, second?.title ?? 'CAUTION', p, false, system.type.trackingMeta)
        cursor += 3.1
      }
      warns.forEach((line) => {
        if (cursor > backFloor) return
        body += `<text x="${x + padX}" y="${cursor}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${mm(system.type.legalMm, 1.9)}" letter-spacing="${system.type.trackingLegal}">${esc(line)}</text>`
        cursor += 2.8
      })
    } else {
      const a = legalBlock(x + padX, cursor, blockW, first?.title ?? 'SPEC', inci, p, system.serif, shortBack ? 2.35 : 2.85, system.type.legalMm, system.type.trackingLegal, '01')
      body += a.markup
      cursor += a.height + 2.2
      if (!shortBack || cursor + 12 < y + h - 16) {
        const b = legalBlock(x + padX, cursor, blockW, second?.title ?? 'CAUTION', warns, p, system.serif, shortBack ? 2.35 : 2.75, system.type.legalMm, system.type.trackingLegal, '02')
        body += b.markup
        cursor += b.height + 2.0
      }
    }

    if (system.sector === 'food' && !shortBack) {
      const compact = h < 90
      const need = compact ? 16 : 28
      const floor = compact ? 18 : 32
      if (cursor + need < y + h - floor) {
        body += foodNutritionTable(x + padX, cursor, blockW, p, system, compact)
        cursor += need
      }
    }

    const extras = backFill(brief, copy.volume)
    const markY = y + h - 13.6
    const identH = 16.4
    const identY = markY - identH - 1.8
    let extraIdx = 0
    while (extraIdx < extras.blocks.length) {
      const block = extras.blocks[extraIdx]
      const nextH = 2.15 + 3.2 + block.lines.length * 2.75 + 2.15
      if (cursor + nextH + 2.0 > identY) break
      const idx = String(extraIdx + 3).padStart(2, '0')
      const extra = legalBlock(
        x + padX,
        cursor,
        blockW,
        block.title,
        block.lines,
        p,
        system.serif,
        2.75,
        system.type.legalMm,
        system.type.trackingLegal,
        idx,
      )
      body += extra.markup
      cursor += extra.height + 2.0
      extraIdx += 1
    }

    const quietH = identY - cursor - 1.2
    if (quietH > 11) {
      const qx = x + padX
      const qy = cursor + 0.4
      body += `<line x1="${qx}" y1="${qy}" x2="${qx + blockW}" y2="${qy}" stroke="${p.accent}" stroke-opacity="0.28" stroke-width="0.16" />`
    }

    const leftX = x + padX
    const leftW = blockW * 0.5
    const rightX = x + padX + blockW * 0.54
    const rightW = blockW * 0.46
    if (copy.volume) {
      const backVol = `${copy.volume}${system.pao ? `  ·  ${plan.marks.recipe.paoMonths}` : ''}`
      body += volumeMarkup(leftX, identY + 3.2, backVol, { ...system.type, volumeMm: 2.05 }, p.fg, 'start', fontStack('sans'), true)
    }
    if (copy.manufacturer) {
      body += `<text x="${leftX}" y="${identY + 6.6}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-size="1.85" letter-spacing="0.2">${esc(copy.manufacturer)}</text>`
    }
    if (copy.address) {
      wrapLines(copy.address, Math.max(14, Math.floor(leftW / 1.7)), 2).forEach((line, i) => {
        body += `<text x="${leftX}" y="${identY + 9.3 + i * 2.35}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="1.7">${esc(line)}</text>`
      })
    }
    if (copy.barcode) {
      body += barcodeSvg(copy.barcode, rightX, identY + 1.2, rightW, 8.4, p.fg)
    } else {
      body += `<text x="${rightX + rightW / 2}" y="${identY + 8}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="1.7">${esc(extras.seal)}</text>`
    }

    body += marksBar(x + padX, markY, blockW, p, plan)
  } else if (isSide) {
    const primary = (copy.brand.trim() || copy.product).toUpperCase()
    const maxChars = Math.max(6, Math.floor((h - 18) / 3.4))
    const spine = primary.length > maxChars ? monogram(copy.brand || copy.product) : primary
    const spineSize = Math.min(3.15, (h - 20) / Math.max(1, spine.length) * 0.32, w * 0.28)
    const spineTracking = Math.min(1.5, spineSize * 0.48)
    body += `<line x1="${cx}" y1="${y + 5.2}" x2="${cx}" y2="${y + Math.min(9.4, h * 0.07)}" stroke="${p.accent}" stroke-width="0.2" />`
    body += `<text transform="translate(${cx + 1.05} ${y + h / 2}) rotate(-90)" text-anchor="middle" fill="${p.fg}" font-family="${font}" font-weight="600" font-size="${spineSize}" letter-spacing="${spineTracking}">${esc(spine)}</text>`
    if (copy.volume && h > 40) {
      body += `<text x="${cx}" y="${y + h - 4.6}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${Math.min(2.05, w * 0.18)}">${esc(copy.volume)}</text>`
    }
  } else if (isTop) {
    const topBrand = copy.brand.trim()
    const topSize = Math.min(2.55, h * 0.2, w * 0.065)
    const catSize = Math.min(1.85, h * 0.15, w * 0.05)
    if (topBrand) {
      const topLabel = topBrand.length > Math.floor(w / 4.5) ? monogram(topBrand) : topBrand.toUpperCase()
      body += `<text x="${cx}" y="${y + h * 0.38}" text-anchor="middle" fill="${p.fg}" font-family="${font}" font-weight="600" font-size="${topSize}" letter-spacing="1.1">${esc(topLabel)}</text>`
      if (cat && h > 12) {
        body += `<text x="${cx}" y="${y + h * 0.6}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="${catSize}" letter-spacing="0.9">${esc(cat)}</text>`
      }
    } else if (cat) {
      body += `<text x="${cx}" y="${y + h * 0.42}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="${Math.min(2.15, topSize)}" letter-spacing="1.2">${esc(cat)}</text>`
    } else if (copy.volume) {
      body += `<text x="${cx}" y="${y + h * 0.42}" text-anchor="middle" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-size="${Math.min(2.4, topSize)}">${esc(copy.volume)}</text>`
    }
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
  designPlan?: DesignPlan,
): ArtworkModel {
  const plan = buildCraftPlan(brief, dieline, copy, system)
  const layers = dieline.panels.map((panel) => ({
    panelId: panel.id,
    markup: panelArt(panel, brief, copy, palette, overrides, system, plan, logoHref, designPlan),
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
