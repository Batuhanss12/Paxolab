/**
 * Which field a panel wears, and in which palette.
 *
 * One design covers every panel of one product. The panels differ in *anatomy* — hero, information,
 * manifesto, seam — never in visual system. This module is the single place that answers "what
 * texture goes behind this panel", because the rule has now been broken twice in the same way:
 *
 *   - on cartons (F-14): sides, lid and back picked their texture from a hand-written list of four
 *     archetypes, so everything outside that list fell to a flat slab of colour. The crest carton
 *     showed it plainly — a gold roundel on a light arabesque field in the middle, two flat dark
 *     slabs beside it, a flat light back;
 *   - on labels (F-17): all three back painters started with a bare `ground()` while all twelve
 *     front painters laid down the direction's field, so opening the set showed a textured front
 *     next to a blank back.
 *
 * Two archetypes wear a different field on their secondary panels on purpose, and both name it in
 * their own DNA anatomy: the noir carton's marble spines and the tech carton's circuitry.
 */
import { darken, mix } from './color'
import type { BackgroundFamily, DesignDirection, StudioArchetype, StudioPalette } from './types'

const SPINE_FIELD: Partial<Record<StudioArchetype, BackgroundFamily>> = {
  'noir-stack': 'marble',
  'diagonal-tech': 'circuit',
}

/** The background family a non-front panel of this design should carry. */
export function secondaryField(d: DesignDirection): BackgroundFamily {
  return SPINE_FIELD[d.archetype] ?? d.background
}

/**
 * The palette the field is painted in, once the panel has chosen its own ground.
 *
 * `mute` pushes the accent toward the ground. Backs take a high value because they carry the
 * densest type on the product: the field should say "this panel belongs to the box" without
 * competing with the ingredient column.
 */
export function fieldPalette(p: StudioPalette, archetype: StudioArchetype, bg: string, mute = 0): StudioPalette {
  return {
    ...p,
    ground: bg,
    accent: mix(p.accent, bg, Math.max(mute, archetype === 'noir-stack' ? 0.35 : 0)),
    accent2: archetype === 'botanical-card' ? darken(bg, 0.08) : p.accent2,
  }
}

/** How strongly a secondary panel carries the field. Backs whisper; spines speak. */
export const FIELD_INTENSITY = {
  side: 0.5,
  lid: 0.42,
  flap: 0.34,
  /** Both carton and label backs — the panel with the regulatory block on it. */
  back: 0.26,
} as const

/** How far the accent is pushed toward the ground, per panel role. */
export const FIELD_MUTE = {
  side: 0,
  lid: 0.25,
  flap: 0.45,
  back: 0.6,
} as const
