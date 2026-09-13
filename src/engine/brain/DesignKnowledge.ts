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
