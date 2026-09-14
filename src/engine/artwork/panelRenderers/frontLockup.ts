/**
 * Front lockup rendering — brand, product, category, tagline, volume, badges.
 * Extracted from frontPanel.ts to isolate lockup typography from decor assembly.
 */
import type { DesignBrief, DesignOverrides, DesignSpec, Palette, Panel } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'
import { faceUpper, resolveCopyLocale } from '../../copyLocale'
import { layoutFrontLockup, volumeMarkup } from '../../designSystem/typeSystem'
import { volumeDisplay, volumeUsesEstimated } from '../../designSystem/volumeFormat'
import { fontStack } from '../languages'
import { frontSpecLine } from '../copy'
import { escapeSvg as esc, minMm as mm } from '../svgGeometry'
import { lockupRule } from './shared'
import { capsuleVolume, goldBar, outlineVolume, stampVolume } from './volume'
import { foodClaimStrip, foodClaimStripY, ingredientBadges } from './foodElements'
import { placeFrontExtras } from './frontExtras'
import { foodBoxTheatre } from '../foodLandscape'
import { foodFamilyFromBlob } from '../foodFamily'
import { hairBilingualLine, hairStepLabel, isHairRetail } from '../hairRetail'

type FrontLayout = NonNullable<ReturnType<typeof layoutFrontLockup>>

export function renderFrontLockup(
  panel: Panel,
  brief: DesignBrief,
  copy: DesignSpec['copy'],
  p: Palette,
  overrides: DesignOverrides,
  system: DesignSystem,
  layout: FrontLayout,
  logoHref?: string,
): string {
  const style = system.style
  const { y, h } = panel
  const s = overrides.logoScale
  const cat = system.category
  const min = system.type.minMm
  const labelFace = system.grammar === 'label'

  let body = ''
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

  const locale = resolveCopyLocale(brief)
  const brandLines = layout.brandLines.length ? layout.brandLines : [copy.brand.toUpperCase()]
  const brandYs = layout.brandYs.length ? layout.brandYs : [layout.brandY]
  const hair = isHairRetail(brief) && system.wrapSeam
  const titleCard =
    style === 'eco' || (style === 'playful' && (system.sector === 'food' || hair))
  if (titleCard) {
    const top = Math.min(...brandYs) - layout.brandSize * 0.92
    const bot = layout.taglineY + layout.taglineSize * 0.55 + 2.8
    const plateH = Math.max(16, bot - top)
    const plateW = Math.min(panel.w - 8, Math.max(36, layout.rect.w * 0.94))
    const px = left ? Math.max(panel.x + 3.2, ax - 3.6) : ax - plateW / 2
    const cardFill = style === 'eco' ? '#f4efe4' : p.paper
    body += `<rect data-art="title-card" x="${px}" y="${top}" width="${plateW}" height="${plateH}" rx="3" fill="${cardFill}" fill-opacity="0.92" />`
  }
  if (hair) {
    const pill = hairStepLabel(locale)
    const pw = Math.min(panel.w * 0.42, 28)
    const ph = 3.6
    const px = left ? ax : ax - pw / 2
    const py = Math.max(panel.y + 2.2, (brandYs[0] ?? layout.brandY) - layout.brandSize - 5.4)
    body += `<g data-art="step-pill"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="1.4" fill="${p.accent}" fill-opacity="0.14" stroke="${p.accent}" stroke-width="0.2" /><text x="${px + pw / 2}" y="${py + 2.45}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="1.45" letter-spacing="0.35">${esc(pill)}</text></g>`
  }
  brandLines.forEach((line, i) => {
    body += `<text x="${ax}" y="${brandYs[i] ?? layout.brandY}" text-anchor="${anchor}" fill="${p.fg}" font-family="${layout.brandFont}" font-weight="${layout.brandWeight}" font-size="${layout.brandSize}" letter-spacing="${layout.brandTracking}">${esc(line)}</text>`
  })
  body += lockupRule(layout, panel, p)
  if (copy.product.trim()) {
    const productPaint = hair ? hairBilingualLine(copy.product, locale).display : faceUpper(copy.product, locale)
    body += `<text x="${ax}" y="${layout.productY}" text-anchor="${anchor}" fill="${p.fg}" font-family="${layout.productFont}" font-weight="${layout.productWeight}" font-size="${layout.productSize}" letter-spacing="${layout.productTracking}">${esc(productPaint)}</text>`
    if (hair) {
      body += `<text x="${ax}" y="${layout.categoryY}" text-anchor="${anchor}" fill="${p.muted}" font-family="${layout.metaFont}" font-weight="400" font-size="${Math.max(1.55, layout.categorySize * 0.92)}" letter-spacing="0.2">${esc(hairBilingualLine(copy.product, locale).sub)}</text>`
    }
  }
  // P2-C: re-enable category on minimal as quiet meta (not display).
  if (!hair && cat && (style !== 'minimal' || system.sector === 'serum' || system.sector === 'cream' || system.sector === 'cleaning')) {
    body += `<text x="${ax}" y="${layout.categoryY}" text-anchor="${anchor}" fill="${p.accent}" font-family="${layout.metaFont}" font-weight="${layout.metaWeight}" font-size="${layout.categorySize}" letter-spacing="${layout.categoryTracking}">${esc(cat)}</text>`
  }
  body += `<text x="${ax}" y="${layout.taglineY}" text-anchor="${anchor}" fill="${p.muted}" font-family="${system.serif ? 'Georgia, serif' : layout.metaFont}" font-weight="${system.style === 'minimal' ? 300 : 400}" font-size="${layout.taglineSize}" font-style="${system.serif ? 'italic' : 'normal'}">${esc(copy.tagline)}</text>`

  if (system.sector === 'food') {
    const netY = layout.taglineY + (labelFace ? 3.4 : 4.2)
    body += `<text x="${ax}" y="${netY}" text-anchor="${anchor}" fill="${p.accent}" font-family="${layout.metaFont}" font-weight="${layout.metaWeight}" font-size="${mm(system.type.metaMm, min)}" letter-spacing="1.1">${locale === 'en' ? 'NET WT' : 'NET'}</text>`
    if (copy.volume) {
      // P1-D: food NET uses body only (no second ℮ — footer/goldBar carries ℮ if estimated)
      const volBody = volumeDisplay(copy.volume, false)
      body += `<text x="${ax}" y="${netY + (labelFace ? 2.6 : 3.0)}" text-anchor="${anchor}" fill="${p.fg}" font-family="${layout.metaFont}" font-weight="${layout.metaWeight}" font-size="${mm(system.type.metaMm + (labelFace ? 0.2 : 0.5), min)}" letter-spacing="0.8">${esc(volBody.toUpperCase())}</text>`
    }
    const claimY = foodClaimStripY(panel, system, layout, labelFace, !!copy.volume)
    if (claimY != null) {
      body += foodClaimStrip(panel, p, claimY, ax, anchor, system.type.minMm, locale, {
        family: foodFamilyFromBlob(`${brief.subProduct} ${brief.productName} ${copy.product}`),
        theatre: foodBoxTheatre(system, panel, labelFace),
        rich: true,
      })
    }
  }
  if (!labelFace && system.sector === 'electronics') {
    const spec = frontSpecLine(copy.ingredients)
    if (spec) {
      body += `<text x="${ax}" y="${y + h * 0.7}" text-anchor="${anchor}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${mm(system.type.legalMm, 2.0)}" letter-spacing="0.35">${esc(spec)}</text>`
    }
  }

  const extras = placeFrontExtras(panel, system, layout, brief.ingredientClaims ?? '', labelFace)

  if (system.goldBar && copy.volume && !labelFace) {
    body += goldBar(panel, p, copy.volume, volumeUsesEstimated(copy.volume), system)
  } else if (!labelFace && style === 'playful' && copy.volume) {
    body += capsuleVolume(panel, p, copy.volume, system)
  } else if (!labelFace && style === 'eco' && copy.volume) {
    body += stampVolume(panel, p, copy.volume, system)
  } else if (!labelFace && style === 'modern' && copy.volume) {
    body += outlineVolume(panel, p, copy.volume, left, ax, system)
  } else if (copy.volume) {
    body += volumeMarkup(
      ax,
      extras.volumeY,
      copy.volume,
      system.type,
      p.fg,
      anchor,
      fontStack('sans'),
      volumeUsesEstimated(copy.volume),
    )
  }

  if (extras.showBadges && brief.ingredientClaims?.trim()) {
    body += ingredientBadges(brief.ingredientClaims, ax, extras.badgeY, anchor, p, system.type.minMm, panel, style)
  }

  return body
}
