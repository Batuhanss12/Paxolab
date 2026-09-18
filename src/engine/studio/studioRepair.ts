/**
 * Studio-native repair — one shot, ledger driven.
 *
 * The kit `repairPlan` speaks kit vocabulary (hero family, decor budget) and stays off on the
 * studio path. When the studio ledger reports overlap or an out-of-bounds line, the only honest
 * lever is the identity scale that produced it: shrink type / mark a step and let the same
 * deterministic painter run again. The critic still never edits SVG and never picks a winner.
 */
import type { StudioReport } from './types'
import { clampStudioScale } from './types'

export type StudioRepairDelta = {
  titleScale: number
  logoScale: number
  /** Human-readable note for the process summary / decision log. */
  reason: string
}

export type LedgerEvidence = Pick<StudioReport, 'collisions' | 'outOfBounds'>

/**
 * The craft score below which a clean face is still not shipped as-is.
 *
 * `scoreVisualCraft` had always been computed and never consulted: a face with no collisions and
 * a score of 30 went out exactly like one at 75. Measured on the eighteen golden faces the score
 * runs 57–76, so the floor sits below the worst face the catalogue deliberately keeps — the gate
 * exists to catch a mood-walk landing an archetype on a panel it reads badly on, not to argue
 * with the table. Like the ledger repair it is bounded (three archetype steps) and monotonic: an
 * alternative is kept only when it is ledger-clean *and* scores strictly higher.
 */
export const STUDIO_CRAFT_FLOOR = 50

export function ledgerHits(report: LedgerEvidence | undefined): number {
  if (!report) return 0
  return report.collisions.length + report.outOfBounds.length
}

/**
 * Returns the single retune to try, or null when the face is clean (or already at the floor).
 * Callers must keep the retry only when it lowers `ledgerHits` — repair may never make it worse.
 */
export function planStudioRepair(
  report: LedgerEvidence,
  identity: { titleScale?: number; logoScale?: number },
): StudioRepairDelta | null {
  const hits = ledgerHits(report)
  if (hits === 0) return null

  const currentTitle = identity.titleScale ?? 1
  const currentLogo = identity.logoScale ?? 1
  const step = hits >= 3 ? 0.82 : 0.9
  const titleScale = clampStudioScale(currentTitle * step, currentTitle)
  const logoScale = clampStudioScale(currentLogo * step, currentLogo)

  if (titleScale >= currentTitle && logoScale >= currentLogo) return null
  return {
    titleScale,
    logoScale,
    reason: `${hits} ledger bulgusu — punto/marka ölçeği ×${step}`,
  }
}
