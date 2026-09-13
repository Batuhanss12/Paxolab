/**
 * Front lockup rendering — brand, product, category, tagline, volume, badges.
 * Extracted from frontPanel.ts to isolate lockup typography from decor assembly.
 */
import type { DesignBrief, DesignOverrides, DesignSpec, Palette, Panel } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'
import { layoutFrontLockup, volumeMarkup } from '../../designSystem/typeSystem'
import { volumeDisplay } from '../../designSystem/volumeFormat'
import { fontStack } from '../languages'
import { frontSpecLine } from '../copy'
import { escapeSvg as esc, minMm as mm } from '../svgGeometry'
import { lockupRule } from './shared'
import { capsuleVolume, goldBar, outlineVolume, stampVolume } from './volume'
import { foodClaimStrip, ingredientBadges } from './foodElements'

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
  const perfume = system.sector === 'perfume'
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

  const brandLines = layout.brandLines.length ? layout.brandLines : [copy.brand.toUpperCase()]
  const brandYs = layout.brandYs.length ? layout.brandYs : [layout.brandY]
  brandLines.forEach((line, i) => {
    body += `<text x="${ax}" y="${brandYs[i] ?? layout.brandY}" text-anchor="${anchor}" fill="${p.fg}" font-family="${layout.brandFont}" font-weight="${layout.brandWeight}" font-size="${layout.brandSize}" letter-spacing="${layout.brandTracking}">${esc(line)}</text>`
  })
  body += lockupRule(layout, panel, p)
  if (copy.product.trim()) {
    body += `<text x="${ax}" y="${layout.productY}" text-anchor="${anchor}" fill="${p.fg}" font-family="${layout.productFont}" font-weight="${layout.productWeight}" font-size="${layout.productSize}" letter-spacing="${layout.productTracking}">${esc(copy.product.toUpperCase())}</text>`
  }
  // P2-C: re-enable category on minimal as quiet meta (not display).
  if (cat && (style !== 'minimal' || system.sector === 'serum' || system.sector === 'cream')) {
    body += `<text x="${ax}" y="${layout.categoryY}" text-anchor="${anchor}" fill="${p.accent}" font-family="${layout.metaFont}" font-weight="${layout.metaWeight}" font-size="${layout.categorySize}" letter-spacing="${layout.categoryTracking}">${esc(cat)}</text>`
  }
  body += `<text x="${ax}" y="${layout.taglineY}" text-anchor="${anchor}" fill="${p.muted}" font-family="${system.serif ? 'Georgia, serif' : layout.metaFont}" font-weight="${system.style === 'minimal' ? 300 : 400}" font-size="${layout.taglineSize}" font-style="${system.serif ? 'italic' : 'normal'}">${esc(copy.tagline)}</text>`

  if (system.sector === 'food') {
    const netY = layout.taglineY + (labelFace ? 3.4 : 4.2)
    body += `<text x="${ax}" y="${netY}" text-anchor="${anchor}" fill="${p.accent}" font-family="${layout.metaFont}" font-weight="${layout.metaWeight}" font-size="${mm(system.type.metaMm, min)}" letter-spacing="1.1">NET</text>`
    if (copy.volume) {
      // P1-D: food NET uses body only (no second ℮ — footer/goldBar carries ℮ if estimated)
      const volBody = volumeDisplay(copy.volume, false)
      body += `<text x="${ax}" y="${netY + (labelFace ? 2.6 : 3.0)}" text-anchor="${anchor}" fill="${p.fg}" font-family="${layout.metaFont}" font-weight="${layout.metaWeight}" font-size="${mm(system.type.metaMm + (labelFace ? 0.2 : 0.5), min)}" letter-spacing="0.8">${esc(volBody.toUpperCase())}</text>`
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
    // P1-C: compute volumeBandTop — badges only paint if badgeY + badgeH + 1.6 <= volumeBandTop
    const volumeBandTop = system.goldBar
      ? y + h - 13.2
      : style === 'playful'
        ? y + h - 12.6
        : style === 'eco'
          ? y + h - 10.2
          : style === 'modern'
            ? y + h - 7.6
            : y + h - 10.4
    const badgeY = layout.taglineY + (labelFace ? 5.8 : 7.4)
    const badgeH = 4.8
    if (badgeY + badgeH + 1.6 <= volumeBandTop) {
      body += ingredientBadges(brief.ingredientClaims, ax, badgeY, anchor, p, system.type.minMm, panel.w)
    }
  }

  return body
}
