/**
 * Front panel renderer — background, decor, hero, lockup, volume, badges.
 * The most complex panel renderer. Contains hero kit dispatch + front decor.
 * Extracted from composeArtwork.ts.
 */
import type { DesignBrief, DesignOverrides, DesignSpec, Palette, Panel } from '../../../types'
import type { DesignPlan } from '../../brain/DesignPlan'
import type { DesignSystem } from '../../designSystem/types'
import { layoutFrontLockup, volumeMarkup } from '../../designSystem/typeSystem'
import { paintBackgroundTreatment, paintSectorBackground, paintStyleBackground } from '../backgroundTreatments'
import { heroPaintScale, heroYFrac, kitHeroFamily, paintBadge, paintCrest, paintDrop, paintHeroGraphic, paintOval, paintSeal, wrapHero } from '../heroGraphics'
import { paintPrimitives } from '../illustrationPrimitives'
import { lockupWindow, wrapContinuity, type SafeRect } from '../motifs'
import { paintPatternFamily, wrapPattern } from '../patternFamilies'
import { fontStack } from '../languages'
import { frontSpecLine } from '../copy'
import { escapeSvg as esc, minMm as mm, panelClip as clip } from '../svgGeometry'
import { labelDecor, lockoutClip, lockupRule, modernStripe, sectorFrame } from './shared'
import { capsuleVolume, goldBar, outlineVolume, stampVolume } from './volume'
import { foodClaimStrip, ingredientBadges } from './foodElements'

// --- Hero kit dispatch ---

function perfumeCrest(panel: Panel, p: Palette, dense: boolean, yFrac = 0.148, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(panel.w, panel.h) * (dense ? 0.082 : 0.062) * scale
  return paintCrest(cx, cy, r, p.accent, dense)
}

function classicCartouche(panel: Panel, p: Palette, yFrac = 0.16, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(8.4, panel.w * 0.16) * scale
  return paintSeal(cx, cy, r, p.accent)
}

function ecoLeaf(panel: Panel, p: Palette, yFrac = 0.17, scale = 1, xFrac = 0.5): string {
  return paintHeroGraphic('botanical', panel, p, scale, yFrac, xFrac)
}

function playfulBadge(panel: Panel, p: Palette, yFrac = 0.18, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(panel.w, panel.h) * 0.09 * scale
  return paintBadge(cx, cy, r, p.accent)
}

function creamMotif(panel: Panel, p: Palette, yFrac = 0.18, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(7.2, panel.w * 0.14) * scale
  return paintOval(cx, cy, r, p.accent)
}

function serumMotif(panel: Panel, p: Palette, yFrac = 0.14, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(panel.w, panel.h) * 0.07 * scale
  return paintDrop(cx, cy, r, p.accent)
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
      if (sector === 'electronics') out += sectorFrame(panel, p, sector, style)
      else out += modernStripe(panel, p)
    } else if (style === 'eco' || style === 'playful') {
      out += sectorFrame(panel, p, sector, style)
    }
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

// --- Main front panel renderer ---

export function renderFrontPanel(
  panel: Panel,
  brief: DesignBrief,
  copy: DesignSpec['copy'],
  p: Palette,
  overrides: DesignOverrides,
  system: DesignSystem,
  designPlan?: DesignPlan,
  logoHref?: string,
): string {
  const style = system.style
  const { x, y, w, h } = panel
  const id = panel.id
  const s = overrides.logoScale
  const cat = system.category
  const perfume = system.sector === 'perfume'
  const min = system.type.minMm
  const labelFace = system.grammar === 'label'

  const layout = layoutFrontLockup(panel, system, copy, overrides, labelFace)
  const lockup = layout?.rect

  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />`
  if (lockup) body += lockoutClip(id, panel, lockup)

  body += paintBackgroundTreatment(panel, designPlan?.backgroundTreatment ?? 'quiet-paper', p)
  body += paintStyleBackground(panel, style, p)
  if (designPlan) body += paintSectorBackground(panel, system.sector, style, p)

  body += frontDecor(panel, system, p, lockup, designPlan)
  if (labelFace && system.wrapSeam) {
    body += wrapSeam(panel, p)
    body += wrapContinuity(panel, p.accent)
  }

  if (layout) {
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
  }

  return `<g clip-path="${clip(panel)}">${body}</g>`
}
