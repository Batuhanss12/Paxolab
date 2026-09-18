/** Small principle KB. Director consults these — the painter does not. */
export type PrincipleId =
  | 'hierarchy-brand-first'
  | 'negative-space-is-luxury'
  | 'lockup-is-sacred'
  | 'one-motif-family'
  | 'sector-blind-front'
  | 'marks-not-on-hero'
  | 'metallic-restraint'
  | 'legal-belongs-back'

export type DesignPrinciple = {
  id: PrincipleId
  title: string
  rule: string
}

export const DESIGN_PRINCIPLES: DesignPrinciple[] = [
  {
    id: 'hierarchy-brand-first',
    title: 'Marka önce',
    rule: 'Lockup order is brand → product → category/volume. Volume is never the hero.',
  },
  {
    id: 'negative-space-is-luxury',
    title: 'Lüks = boşluk',
    rule: 'More luxury means more air and less pattern — not more gold.',
  },
  {
    id: 'lockup-is-sacred',
    title: 'Lockup kutsal',
    rule: 'Foil, contour, and ticks must not cross glyph stems. Lockup clearance is required.',
  },
  {
    id: 'one-motif-family',
    title: 'Tek motif ailesi',
    rule: 'One decor family per kit. Do not stack crest + lattice + capsules.',
  },
  {
    id: 'sector-blind-front',
    title: 'Sektör kör testi',
    rule: 'Front must read perfume / cream / food / electronics without opening Girdiler.',
  },
  {
    id: 'marks-not-on-hero',
    title: 'İşaretler kahraman değil',
    rule: 'Warning icons and barcodes stay off the front hero and off the label face.',
  },
  {
    id: 'metallic-restraint',
    title: 'Metal ölçülü',
    rule: 'Accent is a signal, not a flood. Tighten luxury by reducing extras, not adding foil.',
  },
  {
    id: 'legal-belongs-back',
    title: 'Legal sırtta',
    rule: 'INCI / usage / maker live on box back or label back. Front stays design.',
  },
]

export function principlesFor(style: string, surface: string): PrincipleId[] {
  const base: PrincipleId[] = ['hierarchy-brand-first', 'lockup-is-sacred', 'sector-blind-front', 'marks-not-on-hero']
  if (style === 'luxury') base.push('negative-space-is-luxury', 'metallic-restraint')
  if (surface === 'label') base.push('legal-belongs-back')
  else base.push('legal-belongs-back', 'one-motif-family')
  return base
}

/** Existing critic/score topics only. Does not invent checks or change thresholds. */
const TOPIC_TO_PRINCIPLE: Record<string, PrincipleId> = {
  hierarchy: 'hierarchy-brand-first',
  hierarchyStrength: 'hierarchy-brand-first',
  lockup: 'lockup-is-sacred',
  lockupClearance: 'lockup-is-sacred',
  sectorBlind: 'sector-blind-front',
  crossSectorBleed: 'sector-blind-front',
  honesty: 'marks-not-on-hero',
  density: 'negative-space-is-luxury',
  densityFront: 'negative-space-is-luxury',
  restraint: 'negative-space-is-luxury',
  styleLeakage: 'one-motif-family',
}

export function principleForCriticTopic(topic: string): PrincipleId | undefined {
  return TOPIC_TO_PRINCIPLE[topic]
}

/**
 * The principle a learned recommendation is an instance of, via the critic-topic table so the
 * table stays the single source. A quiet ornament, a dropped frame, an avoided heavy motif and a
 * tightening cue are all the same lesson — negative space is luxury; stacked motif families are
 * style leakage. Preferences with no principle behind them (an archetype, a pairing) return
 * undefined rather than a forced fit.
 */
export function principleForRecommendation(rec: {
  kind: string
  prefer?: boolean
  tokens?: string[]
  cue?: string
  frame?: string
  ornament?: string
}): PrincipleId | undefined {
  switch (rec.kind) {
    case 'avoid-motif':
      return rec.tokens?.some((t) => /dense|stack|pattern/.test(t)) ? principleForCriticTopic('styleLeakage') : principleForCriticTopic('restraint')
    case 'director-cue':
      return rec.cue === 'luxury-tighten' || rec.cue === 'open-air' ? principleForCriticTopic('density') : undefined
    case 'studio-ornament':
      return (rec.prefer && rec.ornament === 'quiet') || (!rec.prefer && rec.ornament === 'rich') ? principleForCriticTopic('restraint') : undefined
    case 'studio-frame':
      return rec.prefer && rec.frame === 'none' ? principleForCriticTopic('density') : undefined
    default:
      return undefined
  }
}
