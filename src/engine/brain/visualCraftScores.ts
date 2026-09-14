/**
 * Visual craft score components — individual dimension scores extracted from scoreVisualCraft.
 * Each function computes one dimension (hero, composition, hierarchy, etc.) from face/back markup + plan.
 */
import type { DesignSpec } from '../../types'
import { faceHasProduct } from '../copyLocale'
import type { DesignPlan } from './DesignPlan'
import {
  compositionBonus,
  computeGeometryMetrics,
  densityPenalty,
  hierarchyBonus,
  type GeometryMetrics,
} from './geometryMetrics'

export const LIBRARY = /data-hero="(monstera|palm|organic-wave|zebra|botanical|emblem)"/
export const KIT_HERO = /data-hero="(crest|seal|oval|harvest|tech)"/

export function faceOf(spec: Pick<DesignSpec, 'artwork'>): string {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

export function backOf(spec: Pick<DesignSpec, 'artwork'>): string {
  return spec.artwork.layers.find((l) => l.panelId === 'back' || l.panelId === 'labelBack' || l.panelId === 'trayBack')?.markup ?? ''
}

export function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

export type ScoreCtx = {
  face: string
  back: string
  plan: DesignPlan
  copy: DesignSpec['copy']
  required: boolean
  hasHero: boolean
  leak: boolean
  geo: GeometryMetrics
  geoComposition: number
  geoHierarchy: number
  geoDensity: number
}

export function makeScoreCtx(spec: Pick<DesignSpec, 'artwork' | 'copy'>, plan: DesignPlan): ScoreCtx {
  const face = faceOf(spec)
  const back = backOf(spec)
  const required = plan.style !== 'minimal' && plan.sector !== 'cleaning' && plan.sector !== 'generic'
  const hasHero = /data-art="hero"/.test(face)
  const leak = plan.sector === 'serum' && /data-pattern="contour"|data-pattern="ornament"/.test(face)
  const panelBounds = { x: 0, y: 0, w: 70, h: 90 }
  const geo = computeGeometryMetrics(face, panelBounds)
  return {
    face,
    back,
    plan,
    copy: spec.copy,
    required,
    hasHero,
    leak,
    geo,
    geoComposition: compositionBonus(geo),
    geoHierarchy: hierarchyBonus(geo),
    geoDensity: densityPenalty(geo),
  }
}

export function scoreHero(ctx: ScoreCtx, notes: string[]): number {
  const { plan, required, hasHero, leak } = ctx
  const face = ctx.face
  let hero = 48
  if (plan.style === 'minimal') {
    const sectorAccent = /data-bg="(tech-grid|warm-horizon|fresh-accent)"/.test(face)
    const classMeta = /SERUM|YÜZ KREMİ|YÜZEY BAKIMI|FACE CREAM|SURFACE CARE|CONCENTRATE/.test(face)
    hero = 82
    if (hasHero || sectorAccent || classMeta) hero += 10
  }
  else if (required && hasHero) {
    hero = 78
    if (LIBRARY.test(face)) hero += 10
    else if (KIT_HERO.test(face)) hero += 6
  } else if (required) {
    hero = 28
    notes.push('Hero gerekli ama ön yüzde yok')
  }
  if (plan.surface === 'label' && required && hasHero) hero += 4
  void leak
  return hero
}

export function scoreComposition(ctx: ScoreCtx): number {
  const { face, plan, hasHero, geoComposition } = ctx
  let composition = 52
  if (/lockout-/.test(face)) composition += 10
  if (hasHero && /data-lockup|font-size/.test(face)) composition += 8
  if (plan.composition.negativeSpace === 'high' && plan.style === 'luxury') composition += 6
  if (plan.composition.negativeSpace === 'low' && plan.sector === 'food') composition += 4
  if (plan.sector === 'food' && /NET|claim-strip/.test(face) && /BESİN DEĞERLERİ/.test(ctx.back)) composition += 6
  if ((face.match(/data-art="hero"/g) || []).length > 1) composition -= 18
  if (plan.composition.intent === 'asymmetric') composition += 6
  else if (plan.composition.intent === 'grid' && plan.style === 'modern') composition += 4
  else if (plan.composition.intent === 'offset' && (plan.style === 'eco' || plan.style === 'playful')) composition += 4
  if (plan.composition.heroZone.x != null && Math.abs(plan.composition.heroZone.x - 0.5) > 0.08) composition += 3
  if (/stroke-opacity="0\.0[4-8]".*stroke-width="0\.1"/.test(face)) composition += 3
  if (plan.style === 'minimal' && (/data-bg="(tech-grid|warm-horizon|fresh-accent)"/.test(face) || plan.composition.negativeSpace === 'high')) {
    composition += 8
  }
  composition += geoComposition
  return composition
}

export function scoreHierarchy(ctx: ScoreCtx, notes: string[]): number {
  const { face, plan, copy } = ctx
  const { geoHierarchy } = ctx
  let hierarchy = 55
  if (face.includes(copy.brand.toUpperCase())) hierarchy += 12
  if (copy.product && faceHasProduct(face, copy.product)) hierarchy += 10
  if (plan.sector === 'food' && /data-art="claim-strip"|NET/.test(face)) hierarchy += 8
  else if (plan.sector === 'food') notes.push('Gıda claim/NET zayıf')
  hierarchy += geoHierarchy
  return hierarchy
}

export function scoreTypography(ctx: ScoreCtx): number {
  const { face, back, plan } = ctx
  let typography = 54
  const displayFonts = /Palatino|Segoe UI|Trebuchet|Cambria|Garamond|Constantia|Corbel/.test(face)
  if (displayFonts) typography += 12
  else if (/Georgia/.test(face) && /Inter/.test(face)) typography += 6
  const weightMatch = face.match(/font-weight="(\d+)"/g) || []
  if (weightMatch.length >= 2) {
    typography += 6
    const weights = weightMatch.map((m) => Number(m.match(/\d+/)?.[0] ?? 0))
    const contrast = Math.max(...weights) - Math.min(...weights)
    if (contrast >= 200) typography += 4
    else if (contrast >= 100) typography += 2
  }
  if (/serif/.test(face) && /sans-serif/.test(face)) typography += 4
  const backWeights = (back.match(/font-weight="(\d+)"/g) || []).length
  if (backWeights >= 4) typography += 4
  if (/font-feature-settings="'tnum'"/.test(back)) typography += 3
  if (plan.typography.trackingIntent === 'wide' && plan.style === 'luxury') typography += 6
  else if (plan.typography.trackingIntent === 'tight' && plan.style === 'modern') typography += 3
  return typography
}

export function scoreDecoration(ctx: ScoreCtx, notes: string[]): number {
  const { face, plan, hasHero, leak, geoDensity } = ctx
  let decoration = 50
  if (/data-pattern=/.test(face) && plan.style !== 'minimal') decoration += 10
  const richPattern = /data-pattern="(weave|dotgrid|wave|hexagon)"/.test(face)
  const surfaceLayers = (face.match(/(?:fill|stroke)-opacity="0\.(0[4-9]|1[0-2])"/g) || []).length
  const sectorFrame = /data-art="l-bracket"/.test(face) || (face.match(/<polygon[^>]*points="[^"]*" fill="[^"]*"[^>]*\/>/g) || []).length >= 4
  const sectorBg = /data-bg="(tech-grid|warm-horizon|fresh-accent)"/.test(face)
  if (LIBRARY.test(face)) decoration += 10
  else if (surfaceLayers >= 3) decoration += 10
  else if (surfaceLayers >= 1) decoration += 6
  if (richPattern) decoration += 4
  if (sectorFrame) decoration += 3
  if (sectorBg) decoration += 3
  if (hasHero && plan.style !== 'minimal') decoration += 4
  if (leak) {
    decoration -= 22
    notes.push('Serum contour sızıntısı')
  }
  if (plan.style === 'minimal' && !/data-pattern=/.test(face)) decoration += 12
  if (plan.style === 'minimal' && /data-bg="(tech-grid|warm-horizon|fresh-accent)"/.test(face)) decoration += 6
  decoration += geoDensity
  return decoration
}

export function scoreSectorFit(ctx: ScoreCtx): number {
  const { face, back, plan, leak } = ctx
  let sectorFit = 62
  if (plan.sector === 'perfume' && /2004\.78|EAU DE|data-hero="crest"|data-hero="seal"/.test(face)) sectorFit += 16
  if (plan.sector === 'food' && /harvest|NET|BESİN|DOĞAL/.test(`${face}\n${back}`)) sectorFit += 14
  if (plan.sector === 'electronics' && /WIRELESS|PRECISION|KABLOSUZ|HASSAS|data-hero="tech"|WEEE/.test(`${face}\n${back}`)) sectorFit += 14
  if (plan.sector === 'serum' && !leak) sectorFit += 10
  if (plan.sector === 'cleaning' && /YÜZEY|SURFACE|fresh-accent/.test(face)) sectorFit += 12
  if (plan.sector === 'electronics' && /data-pattern="(hexagon|dotgrid|lattice)"/.test(face)) sectorFit += 6
  if ((plan.sector === 'food' || plan.sector === 'beverage') && /data-pattern="(weave|grain|ornament)"/.test(face)) sectorFit += 6
  if (plan.sector === 'cleaning' && /data-pattern="(wave|stripe)"/.test(face)) sectorFit += 6
  if (plan.sector !== 'perfume' && /2004\.78/.test(face)) sectorFit -= 30
  return sectorFit
}

export function scoreProductFit(ctx: ScoreCtx): number {
  const { face, plan } = ctx
  let productFit = 64
  if (plan.sector === 'cream' && /CERAMIDE|SHEA|CENTELLA|badge|FACE CREAM|YÜZ KREMİ/.test(face)) productFit += 12
  if (plan.sector === 'serum' && /NIACINAMIDE|CONCENTRATE|SERUM/.test(face)) productFit += 12
  if (plan.sector === 'cleaning' && /YÜZEY BAKIMI|SURFACE CARE/.test(face)) productFit += 12
  if (plan.sector === 'food' && /VIRGIN|ARTISAN|SIZMA|GURME|ÇİKOLATA|REÇEL|NET/.test(face)) productFit += 10
  return productFit
}

export function scoreInformationDesign(ctx: ScoreCtx, notes: string[]): number {
  const { face, back, plan } = ctx
  let informationDesign = 50
  if (plan.sector === 'food') {
    if (/BESİN DEĞERLERİ|NUTRITION FACTS/.test(back)) informationDesign += 22
    else notes.push('Gıda nutrition yok')
    if (/data-art="claim-strip"|NET/.test(face)) informationDesign += 14
    if (/DOĞAL|NATURAL/.test(face)) informationDesign += 6
  } else if (plan.sector === 'perfume') {
    informationDesign += /INCI|COMPOSITION|12\s*M|2004/.test(back) ? 22 : 8
  } else {
    informationDesign += /KULLANIM|INCI|SPEC|UYARI/.test(back) ? 20 : 10
  }
  if (plan.style === 'minimal' && /SERUM|YÜZ KREMİ|YÜZEY BAKIMI|FACE CREAM|SURFACE CARE|CONCENTRATE/.test(face)) {
    informationDesign += 8
  }
  return informationDesign
}

export function scoreOriginality(ctx: ScoreCtx): number {
  const { face, plan } = ctx
  let originality = 48
  if (LIBRARY.test(face)) originality += 18
  if (/Palatino|Segoe UI|Trebuchet|Cambria|Garamond|Constantia|Corbel/.test(face)) originality += 8
  if (plan.variationIndex > 0) originality += 6
  if (plan.heroGraphic.family === 'harvest' && plan.sector !== 'food') originality -= 12
  if ((face.match(/font-weight="(\d+)"/g) || []).length >= 2) originality += 4
  return originality
}
