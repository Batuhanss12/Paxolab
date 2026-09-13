/**
 * Preflight checks — contrast, text overflow, collision detection.
 * Extracted from preflight.ts to isolate check logic from the orchestrator.
 */
import type { DesignSpec, Palette } from '../../types'
import { measureLockupCollision, measureFrontDecorCollision } from '../designSystem'
import { findHeroPanel } from '../dieline/panelKind'
import type { DesignSystem } from '../designSystem/types'
import { measureHeroCollision } from '../artwork/heroes/heroPlacement'

/** Check WCAG-like contrast between foreground and background. */
export function checkContrast(palette: Palette): boolean {
  const fgLum = luminance(palette.fg)
  const bgLum = luminance(palette.bg)
  const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05)
  return ratio >= 3.0 // AA for large text
}

export function luminance(hex: string): number {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i)
  if (!m) return 0.5
  const r = parseInt(m[1], 16) / 255
  const g = parseInt(m[2], 16) / 255
  const b = parseInt(m[3], 16) / 255
  const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b)
}

/** Check if any text in the front panel overflows its bounds. */
export function checkTextOverflow(spec: { artwork?: { layers: { panelId: string; markup: string }[] }; dieline: DesignSpec['dieline'] }): boolean {
  const front = findHeroPanel(spec.dieline.panels)
  if (!front) return true
  const face = spec.artwork?.layers.find((l) => l.panelId === front.id)?.markup ?? ''
  // Simple heuristic: if any text element has x > panel width or y > panel height, it overflows.
  const textRe = /<text[^>]*\sx="([\d.]+)"[^>]*\sy="([\d.]+)"/g
  let m: RegExpExecArray | null
  while ((m = textRe.exec(face)) !== null) {
    const x = parseFloat(m[1])
    const y = parseFloat(m[2])
    if (x > front.x + front.w || y > front.y + front.h) return false
  }
  return true
}

export function detectCollisions(
  spec: Pick<DesignSpec, 'copy' | 'dieline' | 'overrides' | 'kind' | 'brief'> & {
    designPlan?: DesignSpec['designPlan']
  },
  system: DesignSystem,
) {
  const front = findHeroPanel(spec.dieline.panels)
  if (!front) return { hit: true, reasons: ['no-front'] }
  const labelFace = spec.kind === 'label' || system.grammar === 'label'
  const lockupReport = measureLockupCollision(front, system, spec.copy, spec.overrides, labelFace)
  // P1-A: also check decor collision (claim/badge/volume/NET)
  const ingredientClaims = spec.brief?.ingredientClaims ?? ''
  const decorReport = measureFrontDecorCollision(front, system, spec.copy, spec.overrides, labelFace, ingredientClaims)
  const heroReport = measureHeroCollision(front, system, spec.copy, spec.overrides, labelFace, ingredientClaims, spec.designPlan)
  const reasons = [...lockupReport.reasons, ...decorReport.reasons, ...heroReport.reasons]
  return { hit: reasons.length > 0, reasons }
}
