/**
 * Back panel renderer — legal blocks, nutrition, marks, barcode.
 * Extracted from composeArtwork.ts.
 */
import type { DesignBrief, DesignSpec, Palette, Panel } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'
import { barcodeSvg } from '../../barcode'
import { resolveCopyLocale } from '../../copyLocale'
import { backFill } from '../copy'
import { fontStack } from '../languages'
import { volumeMarkup } from '../../designSystem/typeSystem'
import { escapeSvg as esc, minMm as mm, panelClip as clip, wrapSvgLines as wrapLines } from '../svgGeometry'
import { foodFamilyFromBlob } from '../foodFamily'
import { foodNutritionBlockHeight, foodNutritionTable } from './foodElements'
import { frames } from './shared'
import { legalHead, legalBlock, marksBar } from './legalBlocks'
import type { CraftPlan } from '../craft'

export function renderBackPanel(
  panel: Panel,
  brief: DesignBrief,
  copy: DesignSpec['copy'],
  p: Palette,
  system: DesignSystem,
  plan: CraftPlan,
): string {
  const { x, y, w, h } = panel
  const cx = x + w / 2
  const font = system.serif ? "Georgia, 'Times New Roman', serif" : 'Inter, Arial, sans-serif'
  const style = system.style
  const perfume = system.sector === 'perfume'

  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />`
  body += frames(panel, p, style === 'luxury' ? 1 : 0, false)

  const padX = 4.4
  const blockW = w - padX * 2
  let cursor = y + 6.2
  body += `<text x="${cx}" y="${cursor}" text-anchor="middle" fill="${p.accent}" font-family="${font}" font-size="3.05" letter-spacing="1.2">${esc((copy.product || system.category || copy.brand).toUpperCase())}</text>`
  cursor += 3.6
  body += `<text x="${cx}" y="${cursor}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="2.0" letter-spacing="1.2">${esc(system.category || copy.brand.toUpperCase())}</text>`
  cursor += 3.6

  const first = system.legal[0]
  const second = system.legal[1]
  const shortBack = h < 70
  const inci = wrapLines(copy.ingredients, Math.max(16, Math.floor(w / 2.05)), shortBack && system.sector === 'food' ? 2 : perfume ? 6 : 5)
  const warns = wrapLines(copy.warnings, Math.max(16, Math.floor(w / 2.05)), shortBack ? 2 : 4)

  const locale = resolveCopyLocale(brief)
  const family = foodFamilyFromBlob(`${brief.subProduct} ${brief.productName} ${copy.product}`)
  const sugarSalt = h >= 60
  if (system.sector === 'food' || system.sector === 'beverage') {
    const compact = shortBack || h < 90
    const nutH = foodNutritionBlockHeight({ compact, sugarSalt, family })
    body += foodNutritionTable(x + padX, cursor, blockW, p, system, compact, locale, {
      family,
      volume: copy.volume,
      sugarSalt,
      blob: `${brief.subProduct} ${brief.productName}`,
    })
    cursor += nutH + 1.4
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

  return `<g clip-path="${clip(panel)}">${body}</g>`
}
