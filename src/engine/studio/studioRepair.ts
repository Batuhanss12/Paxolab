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

/**
 * The lead element is the gate's sharpest signal, and it was invisible until the evaluator read
 * the studio's own vocabulary.
 *
 * Measured after that repair, over the eighteen frozen faces: a sound face totals 71–77, the same
 * face with its subject / field / frame stripped 62–68, with everything wrong at once 54–64. The
 * weighted total cannot separate a broken face from a curated one — nearly a third of its weight
 * is text-regex sector and information signals that breakage never touches. But "the thing this
 * archetype is *for* was not painted" is unambiguous: a subject-led archetype on a panel too small
 * for its subject scores 30 on `hero`, a sound face 80–90. So the gate steps on that alone as well
 * as on the total. A family the customer pinned is never moved by either — the ranking honours the
 * pin before the step is applied.
 */
export const STUDIO_LEAD_FLOOR = 45

/**
 * `archetypePin` is what let the repair signals be switched on at all.
 *
 * Phase 2F measured the gain — 16 of 216 faces re-routed, craft 74.8 → 75.0, focal 58.9 → 60.9,
 * faces still carrying a signal down from 45 to 29 — and took it back out, because the swap also
 * overruled directions the customer had asked for: "elektronik kutu ama mermer ve altın" stopped
 * landing on marble and a sanitised LLM direction stopped being consumed. The engine's rule is that
 * a word in the brief outranks the sector's opinion of it, and nothing here could tell the two
 * apart until `DesignDirection` started carrying who pinned the archetype.
 *
 * Measured before moving it: of the 45 signal-carrying faces in the sweep, **none** was pinned by
 * a word, a user or a family — so the guard costs nothing and protects exactly the cases that broke.
 */
type CraftReading = {
  visualCraft: number
  hero?: number
  blockers?: { id: string }[]
  repairSignals?: { axis: string; score: number }[]
  archetypePin?: 'visual' | 'sector' | 'user' | 'family' | 'llm' | 'knowledge'
}

/**
 * A direction somebody chose on purpose is not the route's to move.
 *
 * A word in the brief, a picked card, a family lock and a model's own answer are all deliberate.
 * `sector` is the prior the walk starts from and `knowledge` is the engine's own learned prior —
 * both are defaults, and defaults are exactly what a weak reading should be allowed to re-roll.
 */
function chosenOnPurpose(card: CraftReading): boolean {
  const pin = card.archetypePin
  return pin === 'visual' || pin === 'user' || pin === 'family' || pin === 'llm'
}

/**
 * Should the engine try the next archetype for this face? Pure; any one trigger is enough.
 *
 * A blocker is the sharpest of the three: it is not a low score but a promise the design made and
 * broke, so the face is worth re-rolling even when every number reads well. Measured at zero across
 * 216 sweep faces, 324 job×family faces and 18 goldens, so today this trigger fires on nothing —
 * it is here for the regression, not for the backlog.
 */
export function needsCraftRoute(card: CraftReading): boolean {
  if (card.blockers?.length) return true
  // A weak reading is worth a re-roll — unless the archetype is the one the customer asked for.
  if (card.repairSignals?.length && !chosenOnPurpose(card)) return true
  return card.visualCraft < STUDIO_CRAFT_FLOOR || (card.hero ?? 100) < STUDIO_LEAD_FLOOR
}

/**
 * Is the alternative better on the axis that routed the face? The gate stays monotonic — an
 * alternative is kept only when it answers the reason it was tried for: a face under the total
 * floor needs a strictly higher total; a face without its lead needs one that *has* its lead and
 * does not fall under the total floor to get it.
 */
export function craftRouteImproves(current: CraftReading, alt: CraftReading): boolean {
  const had = current.blockers?.length ?? 0
  if (had > 0) {
    // Routed for a broken promise: the alternative has to actually keep it, and may not buy that
    // by collapsing the total. Fewer blockers is not enough — a swap is not a repair.
    return (alt.blockers?.length ?? 0) === 0 && alt.visualCraft >= STUDIO_CRAFT_FLOOR
  }
  if (current.visualCraft < STUDIO_CRAFT_FLOOR) return alt.visualCraft > current.visualCraft
  const weak = current.repairSignals?.[0]
  if (weak && !chosenOnPurpose(current) && (current.hero ?? 100) >= STUDIO_LEAD_FLOOR) {
    /*
     * Routed for a weak reading: the alternative has to answer *that* reading and may not pay for
     * it with craft. Holding only the floor let a face trade three points of total for one point of
     * focal, so the total has to hold as well.
     */
    const now = alt.repairSignals?.find((r) => r.axis === weak.axis)?.score ?? 100
    return now > weak.score && alt.visualCraft >= current.visualCraft
  }
  return (alt.hero ?? 100) >= STUDIO_LEAD_FLOOR && alt.visualCraft >= STUDIO_CRAFT_FLOOR
}

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
