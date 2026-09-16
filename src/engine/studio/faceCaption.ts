/**
 * Honest captions for the painted face. Kit heroGraphic / planSummaryTr are not studio DNA.
 * Language id food-harvest may stay on the spec; it is palette routing, not a hero.
 */
import type { DesignSpec } from '../../types'

export function studioFaceLabel(design: Pick<DesignSpec, 'studio' | 'designPlan'>): string {
  const d = design.studio?.direction
  if (d) return `${d.archetype} · ${d.background}`
  const plan = design.designPlan
  if (!plan) return ''
  const hero = plan.heroGraphic?.family && plan.heroGraphic.family !== 'none' ? plan.heroGraphic.family : ''
  const set = `set ${plan.variationIndex + 1}`
  return hero ? `${hero} · ${set}` : set
}

export function studioProcessSummary(design: Pick<DesignSpec, 'studio' | 'designPlan'>): string {
  const d = design.studio?.direction
  if (d) return `Stüdyo ${d.archetype.replace(/-/g, ' ')} · ${d.background} · ${d.temperament}`
  return design.designPlan?.summaryTr ?? ''
}

/** Kit dialect chip. Empty on studio so food-harvest is not read as the painted face. */
export function studioLanguageCaption(design: Pick<DesignSpec, 'studio' | 'artwork'>): string {
  if (design.studio) return ''
  return design.artwork?.language ?? ''
}
