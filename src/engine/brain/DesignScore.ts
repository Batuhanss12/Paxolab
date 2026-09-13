import type { DesignSpec } from '../../types'
import { densityCap } from './CompositionGrammar'
import type { DesignPlan } from './DesignPlan'

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
  let hierarchy = 70
  let density = 70
  let honesty = 80

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
  let densityFront = 82
  if (heroes > 1) densityFront -= 40
  if (heroes > 2) densityFront -= 20
  if (prims > cap) densityFront -= 30
  if (plan.illustrationSystem?.primitives.length > cap) densityFront -= 15
  if (plan.cue === 'force-overload') densityFront = Math.min(densityFront, 28)

  let lockupClearance = 72
  if (plan.decor.lockupClearance && /lockout-/.test(face)) lockupClearance = 92
  else if (plan.style === 'minimal' || plan.surface === 'label') lockupClearance = 80
  else if (plan.style === 'luxury' && !/lockout-/.test(face)) lockupClearance = 28

  const hierarchyStrength = hierarchy

  let sectorBlind = 78
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

  let sideIntentionality = 70
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
