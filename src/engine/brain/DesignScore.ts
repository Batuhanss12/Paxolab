import type { DesignSpec } from '../../types'
import { densityCap } from './CompositionGrammar'
import type { DesignPlan } from './DesignPlan'
import { DESIGN_SCORE_BASE, weightedCraftScore } from './scoreConfig'

export type DesignScorecard = {
  hierarchy: number
  density: number
  honesty: number
  notes: string[]
  lockupClearance: number
  densityFront: number
  hierarchyStrength: number
  sectorBlind: number
  repetitionPenalty: number
  sideIntentionality: number
}

function faceOf(spec: Pick<DesignSpec, 'artwork'>): string {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

function countAttr(markup: string, attr: string): number {
  return (markup.match(new RegExp(attr, 'g')) || []).length
}

/** Light post-render scores. Does not rewrite SVG. */
export function scoreDesign(spec: Pick<DesignSpec, 'artwork' | 'preflight' | 'copy' | 'kind'>, plan: DesignPlan): DesignScorecard {
  const face = faceOf(spec)
  const sides = spec.artwork.layers.filter((l) => /left|right/i.test(l.panelId)).map((l) => l.markup).join('\n')
  const notes: string[] = []
  let hierarchy = DESIGN_SCORE_BASE.hierarchy
  let density = DESIGN_SCORE_BASE.density
  let honesty = DESIGN_SCORE_BASE.honesty

  if (face.includes(spec.copy.brand.toUpperCase())) hierarchy += 10
  else notes.push('Ön yüzde marka zayıf')
  if (spec.copy.product && face.includes(spec.copy.product.toUpperCase())) hierarchy += 8
  if (plan.decor.lockupClearance && /lockout-/.test(face)) hierarchy += 6

  const extraTicks = (face.match(/sideTicks|cornerDiamonds|claimCapsules/g) || []).length
  if (plan.decor.density === 'sparse' && extraTicks === 0) density += 12
  if (plan.decor.restrainExtras && !face.includes('corner')) density += 8

  if (!/data-mark="barcode"/.test(face)) honesty += 10
  else {
    honesty -= 20
    notes.push('Barkod ön yüzde')
  }
  if (spec.preflight.items.find((i) => i.id === 'ds-sample-legal')?.status === 'warn') honesty += 4
  if (spec.kind === 'label' && /ARKA YÜZ/.test(spec.artwork.layers.find((l) => l.panelId === 'labelBack')?.markup ?? '')) {
    honesty += 6
  }

  const heroes = countAttr(face, 'data-art="hero"')
  const prims = countAttr(face, 'data-art="primitive"')
  const cap = densityCap(plan.style, plan.illustrationSystem?.density ?? plan.decor.density)
  let densityFront: number = DESIGN_SCORE_BASE.densityFront
  if (heroes > 1) densityFront -= 40
  if (heroes > 2) densityFront -= 20
  if (prims > cap) densityFront -= 30
  if (plan.illustrationSystem?.primitives.length > cap) densityFront -= 15
  if (plan.cue === 'force-overload') densityFront = Math.min(densityFront, 28)

  let lockupClearance: number = DESIGN_SCORE_BASE.lockupClearance
  if (plan.decor.lockupClearance && /lockout-/.test(face)) lockupClearance = 92
  else if (plan.style === 'minimal' || plan.surface === 'label') lockupClearance = 80
  else if (plan.style === 'luxury' && !/lockout-/.test(face)) lockupClearance = 28

  const hierarchyStrength = hierarchy

  let sectorBlind = DESIGN_SCORE_BASE.sectorBlind
  const perfumeAsset = /2004\.78|986\.01/.test(face)
  if (plan.sector !== 'perfume' && perfumeAsset) {
    sectorBlind -= 50
    notes.push('Parfüm asset sızıntısı')
  }
  if (plan.sector === 'food' && /EAU DE PARFUM/.test(face) && !/NET|VIRGIN|HARVEST/.test(face)) {
    sectorBlind -= 30
  }
  if (plan.sector === 'electronics' && /EAU DE PARFUM|12\s*M|PAO/.test(face)) {
    sectorBlind -= 30
  }
  if (plan.sector === 'perfume' && /WIRELESS AUDIO|PRECISION SERIES/.test(face)) {
    sectorBlind -= 25
  }
  if (plan.sector === 'food' && /data-hero="harvest"|olive|NET/.test(face)) sectorBlind += 8
  if (plan.sector === 'electronics' && /data-hero="tech"|SPEC/.test(face)) sectorBlind += 8
  if (plan.sector === 'perfume' && /data-hero="crest"|data-hero="seal"/.test(face)) sectorBlind += 8

  const sameHeroHits = (plan.artDirection?.antiRepetition.forbidLastFamilies ?? []).filter((id) => id === plan.heroGraphic.family).length
  const repetitionPenalty = sameHeroHits >= 2 ? 70 : sameHeroHits === 1 ? 28 : 0

  let sideIntentionality: number = DESIGN_SCORE_BASE.sideIntentionality
  if (plan.surface === 'label') sideIntentionality = 86
  else if (/data-art="side-pattern"/.test(sides)) sideIntentionality = 88
  else if (plan.style === 'luxury' || plan.style === 'modern') sideIntentionality = 42

  return {
    hierarchy: Math.max(0, Math.min(100, hierarchy)),
    density: Math.max(0, Math.min(100, density)),
    honesty: Math.max(0, Math.min(100, honesty)),
    notes,
    lockupClearance: Math.max(0, Math.min(100, lockupClearance)),
    densityFront: Math.max(0, Math.min(100, densityFront)),
    hierarchyStrength: Math.max(0, Math.min(100, hierarchyStrength)),
    sectorBlind: Math.max(0, Math.min(100, sectorBlind)),
    repetitionPenalty: Math.max(0, Math.min(100, repetitionPenalty)),
    sideIntentionality: Math.max(0, Math.min(100, sideIntentionality)),
  }
}

export type VisualCraftScorecard = {
  visualCraft: number
  composition: number
  hierarchy: number
  typography: number
  hero: number
  decoration: number
  sectorFit: number
  productFit: number
  informationDesign: number
  originality: number
  production: number
  notes: string[]
}

const LIBRARY = /data-hero="(monstera|palm|organic-wave|zebra|botanical|emblem)"/
const KIT_HERO = /data-hero="(crest|seal|oval|harvest|tech)"/

/** Design-quality score. Separate from "code ran". Evidence is face / back markup + preflight. */
export function scoreVisualCraft(
  spec: Pick<DesignSpec, 'artwork' | 'preflight' | 'copy' | 'kind'>,
  plan: DesignPlan,
): VisualCraftScorecard {
  const face = faceOf(spec)
  const back =
    spec.artwork.layers.find((l) => l.panelId === 'back' || l.panelId === 'labelBack' || l.panelId === 'trayBack')
      ?.markup ?? ''
  const notes: string[] = []
  const required = plan.style !== 'minimal' && plan.sector !== 'cleaning' && plan.sector !== 'generic'
  const hasHero = /data-art="hero"/.test(face)
  const leak = plan.sector === 'serum' && /data-pattern="contour"|data-pattern="ornament"/.test(face)

  let hero = 48
  if (plan.style === 'minimal') hero = hasHero ? 40 : 86
  else if (required && hasHero) {
    hero = 78
    if (LIBRARY.test(face)) hero += 10
    else if (KIT_HERO.test(face)) hero += 6
  } else if (required) {
    hero = 28
    notes.push('Hero gerekli ama ön yüzde yok')
  }
  if (plan.surface === 'label' && required && hasHero) hero += 4

  let composition = 52
  if (/lockout-/.test(face)) composition += 10
  if (hasHero && /data-lockup|font-size/.test(face)) composition += 8
  if (plan.composition.negativeSpace === 'high' && plan.style === 'luxury') composition += 6
  if (plan.composition.negativeSpace === 'low' && plan.sector === 'food') composition += 4
  if (plan.sector === 'food' && /NET|claim-strip/.test(face) && /BESİN DEĞERLERİ/.test(back)) composition += 6
  if ((face.match(/data-art="hero"/g) || []).length > 1) composition -= 18
  // Composition intent: asymmetric/grid/offset show deliberate layout craft.
  if (plan.composition.intent === 'asymmetric') composition += 6
  else if (plan.composition.intent === 'grid' && plan.style === 'modern') composition += 4
  else if (plan.composition.intent === 'offset' && (plan.style === 'eco' || plan.style === 'playful')) composition += 4
  // Hero off-center is a deliberate composition move when intent calls for it.
  if (plan.composition.heroZone.x != null && Math.abs(plan.composition.heroZone.x - 0.5) > 0.08) composition += 3
  // Grid guides show deliberate structural composition.
  if (/stroke-opacity="0\.0[4-8]".*stroke-width="0\.1"/.test(face)) composition += 3

  let hierarchy = 55
  if (face.includes(spec.copy.brand.toUpperCase())) hierarchy += 12
  if (spec.copy.product && face.includes(spec.copy.product.toUpperCase())) hierarchy += 10
  if (plan.sector === 'food' && /data-art="claim-strip"|NET/.test(face)) hierarchy += 8
  else if (plan.sector === 'food') notes.push('Gıda claim/NET zayıf')

  let typography = 54
  const displayFonts = /Palatino|Segoe UI|Trebuchet|Cambria|Garamond|Constantia|Corbel/.test(face)
  if (displayFonts) typography += 12
  else if (/Georgia/.test(face) && /Inter/.test(face)) typography += 6
  // Font-weight hierarchy: brand carries authority, product supports.
  const weightMatch = face.match(/font-weight="(\d+)"/g) || []
  if (weightMatch.length >= 2) {
    typography += 6
    const weights = weightMatch.map((m) => Number(m.match(/\d+/)?.[0] ?? 0))
    const contrast = Math.max(...weights) - Math.min(...weights)
    if (contrast >= 200) typography += 4
    else if (contrast >= 100) typography += 2
  }
  // Serif + sans pairing shows typographic intent.
  if (/serif/.test(face) && /sans-serif/.test(face)) typography += 4
  // Back panel typography: legal headers and nutrition now carry weight hierarchy.
  const backWeights = (back.match(/font-weight="(\d+)"/g) || []).length
  if (backWeights >= 4) typography += 4
  // Tabular figures in nutrition table show information-design craft.
  if (/font-feature-settings="'tnum'"/.test(back)) typography += 3
  if (plan.typography.trackingIntent === 'wide' && plan.style === 'luxury') typography += 6
  else if (plan.typography.trackingIntent === 'tight' && plan.style === 'modern') typography += 3

  let decoration = 50
  if (/data-pattern=/.test(face) && plan.style !== 'minimal') decoration += 10
  const richPattern = /data-pattern="(weave|dotgrid|wave|hexagon)"/.test(face)
  // Surface layering: any subtle fill-opacity or stroke-opacity shows depth craft.
  const surfaceLayers = (face.match(/(?:fill|stroke)-opacity="0\.(0[4-9]|1[0-2])"/g) || []).length
  // Sector-specific frames: L-brackets (electronics) and decorative diamonds (food) show craft.
  const sectorFrame = /data-art="l-bracket"/.test(face) || (face.match(/<polygon[^>]*points="[^"]*" fill="[^"]*"[^>]*\/>/g) || []).length >= 4
  // Sector-specific background textures reinforce sector identity.
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

  let sectorFit = 62
  if (plan.sector === 'perfume' && /2004\.78|EAU DE|data-hero="crest"|data-hero="seal"/.test(face)) sectorFit += 16
  if (plan.sector === 'food' && /harvest|NET|BESİN|DOĞAL/.test(`${face}\n${back}`)) sectorFit += 14
  if (plan.sector === 'electronics' && /WIRELESS|PRECISION|data-hero="tech"|WEEE/.test(`${face}\n${back}`)) sectorFit += 14
  if (plan.sector === 'serum' && !leak) sectorFit += 10
  // Sector-appropriate surface patterns reinforce sector identity.
  if (plan.sector === 'electronics' && /data-pattern="(hexagon|dotgrid|lattice)"/.test(face)) sectorFit += 6
  if ((plan.sector === 'food' || plan.sector === 'beverage') && /data-pattern="(weave|grain|ornament)"/.test(face)) sectorFit += 6
  if (plan.sector === 'cleaning' && /data-pattern="(wave|stripe)"/.test(face)) sectorFit += 6
  if (plan.sector !== 'perfume' && /2004\.78/.test(face)) sectorFit -= 30

  let productFit = 64
  if (plan.sector === 'cream' && /CERAMIDE|badge|FACE CREAM/.test(face)) productFit += 12
  if (plan.sector === 'serum' && /NIACINAMIDE|CONCENTRATE/.test(face)) productFit += 12
  if (plan.sector === 'food' && /VIRGIN|ARTISAN|NET/.test(face)) productFit += 10

  let informationDesign = 50
  if (plan.sector === 'food') {
    if (/BESİN DEĞERLERİ/.test(back)) informationDesign += 22
    else notes.push('Gıda nutrition yok')
    if (/data-art="claim-strip"|NET/.test(face)) informationDesign += 14
    if (/DOĞAL/.test(face)) informationDesign += 6
  } else if (plan.sector === 'perfume') {
    informationDesign += /INCI|COMPOSITION|12\s*M|2004/.test(back) ? 22 : 8
  } else {
    informationDesign += /KULLANIM|INCI|SPEC|UYARI/.test(back) ? 20 : 10
  }

  let originality = 48
  if (LIBRARY.test(face)) originality += 18
  if (/Palatino|Segoe UI|Trebuchet|Cambria|Garamond|Constantia|Corbel/.test(face)) originality += 8
  if (plan.variationIndex > 0) originality += 6
  if (plan.heroGraphic.family === 'harvest' && plan.sector !== 'food') originality -= 12
  // Weighted hierarchy is a craft signal, not just decoration.
  if ((face.match(/font-weight="(\d+)"/g) || []).length >= 2) originality += 4

  const production = spec.preflight.exportOk ? 88 : spec.preflight.blocking ? 22 : 48
  if (!spec.preflight.exportOk) notes.push('exportBLOCK')

  const visualCraft = weightedCraftScore({
    hero,
    composition,
    hierarchy,
    informationDesign,
    decoration,
    typography,
    sectorFit,
    productFit,
    originality,
  })

  return {
    visualCraft: clampScore(visualCraft),
    composition: clampScore(composition),
    hierarchy: clampScore(hierarchy),
    typography: clampScore(typography),
    hero: clampScore(hero),
    decoration: clampScore(decoration),
    sectorFit: clampScore(sectorFit),
    productFit: clampScore(productFit),
    informationDesign: clampScore(informationDesign),
    originality: clampScore(originality),
    production: clampScore(production),
    notes,
  }
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}
