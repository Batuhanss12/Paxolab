/**
 * Direction fingerprint — what makes two candidate designs actually different.
 *
 * The offer already guarantees eight *families*: `uniqueFamilyRows` never shows the same skeleton
 * twice. The creative-brain audit measured what that guarantee does not cover. Across three
 * ordinary briefs the eight candidates took 8 archetypes and 6–8 backgrounds, but **one** ornament
 * level, **one** temperament and **one** layout variant, and only 2–3 of the 4 lockups. Two brands
 * with opposite personalities landed on the same archetype in 6 of 6 sector/mood pairs. So "eight
 * different families" and "eight different designs" are not the same claim, and the second one
 * needs a measure of its own.
 *
 * This module is that measure. A fingerprint is the direction reduced to the axes a customer can
 * *see* differ; the distance between two fingerprints is the number of those axes that differ. It
 * is deliberately a count, not a weighted score: a weight would encode an opinion about which
 * difference matters more, and the point of the instrument is to report, not to judge. Later
 * phases add axes as the repertoire grows (band, rotation, graphic language, spacing); the
 * arithmetic stays the same.
 *
 * Two readings of the same fingerprint:
 *   - `FINGERPRINT_AXES` — everything, for logging and for the offer diversity constraint;
 *   - `COMPOSITION_AXES` — the subset the audit found frozen across an offer. Distance on these is
 *     the number the roadmap tracks ("each pair differs on ≥ 2 axes" is the Phase 3 target).
 */
import type { DesignDirection } from './types'

export const FINGERPRINT_AXES = [
  'archetype',
  'lockup',
  'typePairing',
  'frame',
  'ornament',
  'temperament',
  'background',
  'variant',
] as const

export type FingerprintAxis = (typeof FINGERPRINT_AXES)[number]

/**
 * The axes that decide *arrangement* rather than *surface*: where the weight sits, how much air,
 * how the colour is treated, which of the archetype's arrangements. Archetype and background are
 * excluded on purpose — they always differ across an offer by construction, so counting them would
 * report a diversity the customer does not experience.
 */
export const COMPOSITION_AXES = ['lockup', 'ornament', 'temperament', 'variant'] as const

export type Fingerprint = Record<FingerprintAxis, string>

export type FingerprintSource = Pick<DesignDirection, FingerprintAxis>

export function directionFingerprint(d: FingerprintSource): Fingerprint {
  const out = {} as Fingerprint
  for (const axis of FINGERPRINT_AXES) out[axis] = String(d[axis])
  return out
}

/** Number of axes on which two fingerprints differ (Hamming distance over the chosen axes). */
export function fingerprintDistance(
  a: Fingerprint,
  b: Fingerprint,
  axes: readonly FingerprintAxis[] = FINGERPRINT_AXES,
): number {
  let n = 0
  for (const axis of axes) if (a[axis] !== b[axis]) n += 1
  return n
}

/**
 * Two candidates count as distinct designs when they differ on at least `minAxes` composition
 * axes. Two is the floor the roadmap sets: one differing axis is a variant of the same idea.
 */
export function isDistinct(a: Fingerprint, b: Fingerprint, minAxes = 2, axes: readonly FingerprintAxis[] = COMPOSITION_AXES): boolean {
  return fingerprintDistance(a, b, axes) >= minAxes
}

/** How many different values each axis takes across a set — the "eksen çeşitliliği" table. */
export function distinctPerAxis(list: readonly Fingerprint[]): Record<FingerprintAxis, number> {
  const out = {} as Record<FingerprintAxis, number>
  for (const axis of FINGERPRINT_AXES) out[axis] = new Set(list.map((f) => f[axis])).size
  return out
}

export type PairwiseSummary = {
  /** Number of pairs compared: n·(n−1)/2. */
  pairs: number
  min: number
  mean: number
  /** Pairs at distance 0 on the chosen axes — the same design twice, as far as those axes can tell. */
  identical: number
  /** Pairs below the distinctness floor. */
  notDistinct: number
}

/** Pairwise distances over a candidate set, summarised. Pure; deterministic order. */
export function pairwiseSummary(
  list: readonly Fingerprint[],
  axes: readonly FingerprintAxis[] = COMPOSITION_AXES,
  minAxes = 2,
): PairwiseSummary {
  let pairs = 0
  let min = Number.POSITIVE_INFINITY
  let total = 0
  let identical = 0
  let notDistinct = 0
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const d = fingerprintDistance(list[i]!, list[j]!, axes)
      pairs += 1
      total += d
      if (d < min) min = d
      if (d === 0) identical += 1
      if (d < minAxes) notDistinct += 1
    }
  }
  return { pairs, min: pairs ? min : 0, mean: pairs ? total / pairs : 0, identical, notDistinct }
}
