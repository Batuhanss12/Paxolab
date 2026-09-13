import type { DesignPlan } from './DesignPlan'

export type GraphNode = {
  id: string
  role: string
  note: string
}

export type DesignGraph = {
  root: 'brief'
  nodes: GraphNode[]
}

/** Structured Brand → Product → Type → Decor → Marks → Dieline. Metadata only. */
export function buildDesignGraph(plan: DesignPlan): DesignGraph {
  return {
    root: 'brief',
    nodes: [
      { id: 'brand', role: plan.hierarchy.primary, note: 'Lockup display' },
      { id: 'product', role: plan.hierarchy.secondary, note: 'Line under brand — never a brand clone' },
      { id: 'descriptor', role: plan.hierarchy.tertiary, note: 'Category or volume' },
      { id: 'typography', role: plan.typography.displayFace, note: `${plan.typography.authority} / ${plan.typography.trackingIntent}` },
      { id: 'artDirection', role: plan.artDirection?.vocabulary ?? plan.style, note: plan.visualConcept?.id ?? '—' },
      { id: 'hero', role: plan.heroGraphic?.family ?? 'none', note: `${plan.patternSystem?.family ?? 'none'} · ${plan.backgroundTreatment ?? 'quiet-paper'}` },
      { id: 'decor', role: plan.decor.density, note: plan.decor.allowed.join(', ') || 'none' },
      { id: 'marks', role: plan.marks.recipeKey, note: 'Back or label-back only' },
      {
        id: 'dieline',
        role: plan.surface,
        note: plan.surface === 'label' ? 'ön tasarım · arka kullanım' : 'front hero · spine brand · back legal',
      },
    ],
  }
}
