import type { StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
import type { HeroFamily, VisualConceptBlock } from './DesignPlan'

const CONCEPTS: Record<string, VisualConceptBlock> = {
  'perfume:luxury': { id: 'nocturne-crest', tags: ['night', 'foil-signal', 'one-hero'] },
  'perfume:classic': { id: 'heraldic-seal', tags: ['seal', 'double-line', 'heritage'] },
  'perfume:eco': { id: 'botanical-night', tags: ['leaf', 'quiet-gold'] },
  'cream:luxury': { id: 'soft-oval', tags: ['cream', 'oval', 'air'] },
  'serum:luxury': { id: 'drop-concentrate', tags: ['serum', 'drop'] },
  'food:luxury': { id: 'harvest-press', tags: ['wreath', 'press', 'net'] },
  'food:eco': { id: 'harvest-kraft', tags: ['grain', 'leaf', 'press'] },
  'electronics:luxury': { id: 'signal-plaque', tags: ['plaque', 'spec', 'precision'] },
  'electronics:modern': { id: 'tech-glyph', tags: ['grid', 'index', 'slate'] },
  'eco:any': { id: 'kraft-botanical', tags: ['grain', 'leaf', 'warm'] },
  'playful:any': { id: 'capsule-field', tags: ['badge', 'capsule', 'controlled'] },
  'modern:any': { id: 'index-stripe', tags: ['stripe', 'lattice', 'left'] },
  'minimal:any': { id: 'air-paper', tags: ['paper', 'rule', 'quiet'] },
  'classic:any': { id: 'heraldic-cartouche', tags: ['cartouche', 'ornament'] },
}

export function visualConceptFor(style: StyleType, sector: SectorId, hero: HeroFamily): VisualConceptBlock {
  const keyed = CONCEPTS[`${sector}:${style}`] ?? CONCEPTS[`${style}:any`]
  if (keyed) {
    return hero === 'none' || keyed.tags.includes(hero) ? keyed : { ...keyed, tags: [...keyed.tags, hero] }
  }
  return { id: `${sector}-${style}`, tags: [hero === 'none' ? 'air' : hero] }
}
