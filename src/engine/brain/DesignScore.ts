import type { DesignSpec } from '../../types'
import type { DesignPlan } from './DesignPlan'

export type DesignScorecard = {
  hierarchy: number
  density: number
  honesty: number
  notes: string[]
}

/** Light post-render scores. Does not rewrite SVG. */
export function scoreDesign(spec: Pick<DesignSpec, 'artwork' | 'preflight' | 'copy' | 'kind'>, plan: DesignPlan): DesignScorecard {
  const face =
    spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
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

  return {
    hierarchy: Math.max(0, Math.min(100, hierarchy)),
    density: Math.max(0, Math.min(100, density)),
    honesty: Math.max(0, Math.min(100, honesty)),
    notes,
  }
}
