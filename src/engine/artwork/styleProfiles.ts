/**
 * Style profiles — per-style ornament/tracking/frame/serif/density configuration.
 * Extracted from languages.ts to isolate style config from palette/type data.
 */
import type { StyleType } from '../../types'

export type StyleProfile = {
  ornament: number
  tracking: number
  frame: 0 | 1 | 2 | 3
  serif: boolean
  goldBar: boolean
  corners: boolean
  density: 'sparse' | 'balanced' | 'dense'
  align: 'center' | 'left'
  paperFill: boolean
}

export function styleProfile(style: StyleType): StyleProfile {
  switch (style) {
    case 'luxury':
      return { ornament: 1, tracking: 6.6, frame: 3, serif: true, goldBar: true, corners: true, density: 'dense', align: 'center', paperFill: false }
    case 'classic':
      return { ornament: 0.7, tracking: 5.4, frame: 2, serif: true, goldBar: false, corners: false, density: 'balanced', align: 'center', paperFill: true }
    case 'modern':
      return { ornament: 0.2, tracking: 2.4, frame: 0, serif: false, goldBar: false, corners: false, density: 'balanced', align: 'left', paperFill: false }
    case 'minimal':
      return { ornament: 0, tracking: 6.2, frame: 0, serif: false, goldBar: false, corners: false, density: 'sparse', align: 'center', paperFill: true }
    case 'eco':
      return { ornament: 0.55, tracking: 3.0, frame: 1, serif: true, goldBar: false, corners: false, density: 'balanced', align: 'center', paperFill: true }
    case 'playful':
      return { ornament: 0.65, tracking: 1.4, frame: 1, serif: false, goldBar: true, corners: false, density: 'dense', align: 'center', paperFill: false }
    default:
      return { ornament: 0.4, tracking: 4, frame: 1, serif: true, goldBar: false, corners: false, density: 'balanced', align: 'center', paperFill: false }
  }
}

export function styleWeight(style: StyleType): { ornament: number; tracking: number; frame: number; serif: boolean } {
  const p = styleProfile(style)
  return { ornament: p.ornament, tracking: p.tracking, frame: p.frame, serif: p.serif }
}
