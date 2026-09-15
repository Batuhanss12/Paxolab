/**
 * Studio family key — one visual system shared by box and label.
 * Companion generate (“etiketi de üret”) pins the sibling archetype; it does not start a second motor.
 */
import type {
  BackgroundFamily,
  BoxArchetype,
  DirectionHints,
  LabelArchetype,
  StudioArchetype,
  StudioFamily,
  StudioSurface,
} from './types'

export type FamilyPair = {
  box: BoxArchetype
  label: LabelArchetype
  background?: BackgroundFamily
}

export const STUDIO_FAMILIES: Record<StudioFamily, FamilyPair> = {
  marble: { box: 'marble-frame', label: 'marble-frame', background: 'marble' },
  botanical: { box: 'botanical-card', label: 'card-on-art', background: 'botanical' },
  'line-scene': { box: 'line-scene', label: 'line-scene', background: 'line-scene' },
  wave: { box: 'wave-panel', label: 'wave-panel', background: 'wave' },
  landscape: { box: 'landscape-window', label: 'landscape-badge', background: 'landscape-meadow' },
  ink: { box: 'ink-wash', label: 'ink-panel', background: 'ink-wash' },
  'dark-luxe': { box: 'dark-landscape', label: 'ink-panel' },
  tech: { box: 'diagonal-tech', label: 'diagonal-split', background: 'diagonal' },
}

const ARCHETYPE_FAMILY: Partial<Record<StudioArchetype, StudioFamily>> = {
  'marble-frame': 'marble',
  'botanical-card': 'botanical',
  'card-on-art': 'botanical',
  'line-scene': 'line-scene',
  'wave-panel': 'wave',
  'landscape-window': 'landscape',
  'landscape-badge': 'landscape',
  'ink-wash': 'ink',
  'ink-panel': 'ink',
  'dark-landscape': 'dark-luxe',
  'diagonal-tech': 'tech',
  'diagonal-split': 'tech',
}

export function isStudioFamily(value: unknown): value is StudioFamily {
  return typeof value === 'string' && value in STUDIO_FAMILIES
}

export function familyOf(archetype: StudioArchetype, fallback?: StudioFamily): StudioFamily | undefined {
  if (fallback && isStudioFamily(fallback)) {
    const pair = STUDIO_FAMILIES[fallback]
    if (pair.box === archetype || pair.label === archetype) return fallback
  }
  return ARCHETYPE_FAMILY[archetype]
}

export function archetypeForFamily(family: StudioFamily, surface: StudioSurface): StudioArchetype {
  return STUDIO_FAMILIES[family][surface]
}

/** Pin the sibling archetype for this surface. Last-merge wins in resolveDirection. */
export function hintsFromFamily(family: unknown, surface: StudioSurface): DirectionHints | null {
  if (!isStudioFamily(family)) return null
  const pair = STUDIO_FAMILIES[family]
  return {
    archetype: pair[surface],
    ...(pair.background ? { background: pair.background } : {}),
    source: 'family',
    rationale: ['Aynı görsel aile — kutu ve etiket aynı DNA.'],
  }
}
