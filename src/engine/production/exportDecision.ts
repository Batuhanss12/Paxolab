/**
 * The one place the two gates meet.
 *
 * Export has always been a technical verdict: `preflight.exportOk` is the AND of ten press
 * conditions — bleed, safe area, colour, a real GTIN, fonts, contour. Phase 1 added a second,
 * separate verdict about the design itself (`craftScore.exportAllowed`, from the structured
 * blockers in `brain/designBlockers.ts`), and deliberately left it unwired: `scoreVisualCraft`
 * already *reads* preflight to score `production`, so a design gate inside `preflight.ts` would
 * be a cycle. The two stay apart and are combined here instead.
 *
 *   TECHNICAL   preflight.exportOk        press conditions — unchanged, still owns its own file
 *   DESIGN      craftScore.exportAllowed  broken promises — unchanged, still scored in brain/
 *   FINAL       technical && design       this function, and nowhere else
 *
 * Every caller reads this rather than recomputing the AND: the export chain, the download button
 * that has to be disabled for the same reason, and the server that re-derives both halves before
 * it charges anyone. A second copy of this expression is how a button comes to say "ready" about
 * a file the exporter will refuse to build.
 */
import type { DesignSpec } from '../../types'

/** The design half. Absent scorecard means no design verdict was taken — technical decides alone. */
export function designAllowsExport(spec: Pick<DesignSpec, 'craftScore'>): boolean {
  return spec.craftScore?.exportAllowed ?? true
}

/** The technical half, named so that call sites read as a pair rather than as a field access. */
export function technicalAllowsExport(spec: Pick<DesignSpec, 'preflight'>): boolean {
  return spec.preflight.exportOk
}

/** The final export decision. */
export function exportAllowed(spec: Pick<DesignSpec, 'preflight' | 'craftScore'>): boolean {
  return technicalAllowsExport(spec) && designAllowsExport(spec)
}
