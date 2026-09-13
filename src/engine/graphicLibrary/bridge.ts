/**
 * GraphicLibrary bridge — maps the motor's DesignPlan to the GraphicLibrary's GrammarInput,
 * resolves picks, and provides paint helpers. This is the opt-in integration point.
 *
 * The motor opts in by calling bridgePicks(plan) and using the returned picks to drive
 * paintGraphic() calls. When the bridge is not used, the motor falls back to its
 * existing pattern/hero/primitive painters.
 */
import type { DesignPlan } from '../brain/DesignPlan'
import type { DesignSystem } from '../designSystem/types'
import type { Palette, Panel } from '../../types'
import { resolveGrammar } from './grammar'
import { paintGraphic } from './registry'
import type { GrammarInput, GrammarPicks, PaintCtx, SafeRect } from './types'
import { heroAxisX } from '../artwork/heroes/heroPlacement'

/** Convert a motor DesignPlan + DesignSystem into a GraphicLibrary GrammarInput. */
export function planToGrammarInput(plan: DesignPlan, system: DesignSystem): GrammarInput {
  return {
    style: plan.style,
    sector: plan.sector,
    surface: system.grammar === 'label' ? 'label' : 'box',
    variationIndex: plan.variationIndex,
    density: plan.density.front === 'sparse' ? 'sparse' : plan.density.front === 'dense' ? 'dense' : 'balanced',
  }
}

/** Resolve graphic picks for a DesignPlan. Returns null picks if the library is not active. */
export function bridgePicks(plan: DesignPlan | undefined, system: DesignSystem): GrammarPicks | null {
  if (!plan) return null
  // Opt-in: variation index >= 1 uses the GraphicLibrary.
  // Set 0 uses the motor's existing painters; set 1+ uses the library.
  if (plan.variationIndex < 1) return null
  return resolveGrammar(planToGrammarInput(plan, system))
}

/** Build a PaintCtx from motor state. */
export function bridgeCtx(
  panel: Panel,
  palette: Palette,
  opacity: number,
  safe: SafeRect | undefined,
  seed: number,
  scale?: number,
): PaintCtx {
  return { panel, palette, opacity, safe, seed, scale }
}

/** Build a PaintCtx for hero painting — includes composition zone + scale from DesignPlan. */
export function bridgeHeroCtx(
  panel: Panel,
  palette: Palette,
  safe: SafeRect | undefined,
  plan: DesignPlan,
  system: DesignSystem,
): PaintCtx {
  const label = system.grammar === 'label'
  const heroY = label ? Math.min(0.12, plan.composition.heroZone.y) : plan.composition.heroZone.y
  const wrapY = system.wrapSeam ? Math.min(heroY, 0.11) : heroY
  const heroScale = (plan.heroGraphic.scale ?? 1) * (plan.crop.heroCrop ?? 1) * (label ? 0.82 : 1)
  return {
    panel,
    palette,
    opacity: 1,
    safe,
    seed: plan.artDirection.antiRepetition.seed ?? 7,
    heroYFrac: wrapY,
    heroXFrac: heroAxisX(plan, system, panel),
    heroScale,
  }
}

/** Paint a pattern from the library. Returns '' if pick is null or not found. */
export function bridgePattern(picks: GrammarPicks | null, ctx: PaintCtx): string {
  if (!picks || !picks.pattern) return ''
  return paintGraphic('pattern', picks.pattern, ctx)
}

/** Paint a hero from the library. Returns '' if pick is null or 'none'. */
export function bridgeHero(picks: GrammarPicks | null, ctx: PaintCtx): string {
  if (!picks || !picks.hero || picks.hero === 'none') return ''
  return paintGraphic('hero', picks.hero, ctx)
}

/** Paint a primitive from the library. Returns '' if pick is null or not found. */
export function bridgePrimitive(picks: GrammarPicks | null, ctx: PaintCtx): string {
  if (!picks || !picks.primitive) return ''
  return paintGraphic('primitive', picks.primitive, ctx)
}

/** Paint a motif from the library. Returns '' if pick is null or not found. */
export function bridgeMotif(picks: GrammarPicks | null, ctx: PaintCtx): string {
  if (!picks || !picks.motif) return ''
  return paintGraphic('motif', picks.motif, ctx)
}
