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
