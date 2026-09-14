/**
 * Phase 15 — mood as soft priors (weights), not style costumes.
 * styleType stays on the brief for compatibility; treat it as mood.
 */
import type { StyleType } from '../../types'
import type { Density, SectorId } from '../designSystem/types'

export type MoodId = StyleType

export type MoodPrior = {
  serif: boolean
  tracking: number
  density: Density
  metallic: number
  ornament: number
  goldBarBias: number
  crestBias: number
  fieldSparse: number
  contrastBoost: number
}

const PRIORS: Record<MoodId, MoodPrior> = {
  luxury: {
    serif: true,
    tracking: 6.6,
    density: 'sparse',
    metallic: 0.85,
    ornament: 0.45,
    goldBarBias: 0.8,
    crestBias: 0.75,
    fieldSparse: 0.7,
    contrastBoost: 0.18,
  },
  classic: {
    serif: true,
    tracking: 5.4,
    density: 'balanced',
    metallic: 0.35,
    ornament: 0.4,
    goldBarBias: 0.2,
    crestBias: 0.45,
    fieldSparse: 0.45,
    contrastBoost: 0.08,
  },
  modern: {
    serif: false,
    tracking: 2.4,
    density: 'balanced',
    metallic: 0.05,
    ornament: 0.15,
    goldBarBias: 0,
    crestBias: 0,
    fieldSparse: 0.55,
    contrastBoost: 0.12,
  },
  minimal: {
    serif: false,
    tracking: 6.2,
    density: 'sparse',
    metallic: 0,
    ornament: 0.08,
    goldBarBias: 0,
    crestBias: 0,
    fieldSparse: 0.9,
    contrastBoost: 0.04,
  },
  eco: {
    serif: true,
    tracking: 3.0,
    density: 'balanced',
    metallic: 0,
    ornament: 0.28,
    goldBarBias: 0,
    crestBias: 0.1,
    fieldSparse: 0.5,
    contrastBoost: 0.06,
  },
  playful: {
    serif: false,
    tracking: 1.4,
    density: 'dense',
    metallic: 0,
    ornament: 0.35,
    goldBarBias: 0,
    crestBias: 0,
    fieldSparse: 0.25,
    contrastBoost: 0.1,
  },
}

export function moodPrior(mood: MoodId | '' | undefined): MoodPrior {
  return PRIORS[(mood || 'luxury') as MoodId] ?? PRIORS.luxury
}

/** Gold bar only when recipe + sector agree — never because luxury is a costume. */
export function allowGoldBar(sector: SectorId, mood: MoodId | '', grammar: 'box' | 'label'): boolean {
  if (grammar !== 'box') return false
  if (sector === 'electronics' || sector === 'cleaning') return false
  const prior = moodPrior(mood)
  if (prior.goldBarBias < 0.5) return false
  return sector === 'perfume'
}

/** Crest / harvest hero is sector craft, not a style pack dump. */
export function allowHeroMark(sector: SectorId, mood: MoodId | ''): boolean {
  const prior = moodPrior(mood)
  if (sector === 'electronics' || sector === 'cleaning') return false
  if (sector === 'perfume') return prior.crestBias >= 0.4
  if (sector === 'food' || sector === 'beverage') return mood === 'eco' || mood === 'classic' || mood === 'luxury'
  return false
}
