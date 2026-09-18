/**
 * Design Brain → studio direction.
 *
 * `createPlan` runs on every generate and produces a rich, sector-aware plan — type authority,
 * visual intent, decoration budget, negative space, metallic role, positioning. Until this bridge
 * existed the studio path read none of it: the plan fed the kit painters and the critic, while the
 * studio decided its four dimensions from the sector table alone. Measured on the audit: the brain
 * was computed and then ignored by the path that paints most faces.
 *
 * What crosses the bridge is deliberately narrow. The plan speaks about *typography, frame and
 * ornament* — the three axes Phase 1 turned into decisions — and about nothing else: not the
 * archetype (the sector table and the customer own that), not the temperament (the mood owns it),
 * not the background (the archetype's DNA owns it). A hint is emitted only where the plan's signal
 * is strong enough to be worth a decision; a `balanced` authority says nothing and so sends nothing.
 *
 * Precedence is by position: these hints go *first* among the extras, so knowledge and the
 * customer's own overrides — later in the list — win every key they touch.
 */
import type { DesignBrief } from '../../types'
import type { DesignPlan } from '../brain/DesignPlan'
import { decorationBudgetOf } from '../brain/VisualConcept'
import type { DirectionHints, FrameStyle, OrnamentLevel, TypePairing } from './types'

/** The three axes the plan may speak to, as the ranking reads them. */
export type StudioIntent = {
  typePairing?: TypePairing
  frame?: FrameStyle
  ornament?: OrnamentLevel
}

/**
 * Ornament from the decoration budget and the air the composition asks for.
 *
 * Budgets across the concept table run 0.18–0.48 (measured), so the cut points sit inside that
 * range: the quiet line and minimal concepts fall under 0.24, the botanical / harvest / deco
 * concepts clear 0.40. `negativeSpace: high` overrides upward budget — a face that wants air is
 * not rich whatever the concept spends.
 */
export function ornamentFromPlan(plan: DesignPlan): OrnamentLevel | undefined {
  const budget = decorationBudgetOf(plan)
  if (plan.composition.negativeSpace === 'high' || budget <= 0.24) return 'quiet'
  if (budget >= 0.4 && plan.density.front !== 'sparse') return 'rich'
  return undefined
}

/**
 * Type pairing from authority and the faces the plan chose.
 *
 * `display` + serif + wide tracking is the tracked-serif house style (Rebull, Diako); `quiet`
 * or a sans display is the light/heavy sans pair; a serif with balanced authority is the
 * serif-display / sans-meta pair (GUESS, Anadolu). The script pairing is never suggested here —
 * a script prefix is a product-family choice the archetype's DNA makes, not a brain decision.
 */
export function typePairingFromPlan(plan: DesignPlan): TypePairing | undefined {
  const { authority, displayFace, trackingIntent } = plan.typography
  if (authority === 'quiet') return 'sans-light/sans-heavy'
  if (displayFace === 'sans') return authority === 'display' ? undefined : 'sans-light/sans-heavy'
  if (authority === 'display') return trackingIntent === 'wide' ? 'spaced-serif/spaced-sans' : 'serif-display/sans-meta'
  return 'serif-display/sans-meta'
}

/**
 * Frame from positioning and intent. Only the clear cases speak: a technical or playful face, or
 * one that asks for air, wants no edge; a luxury face with foil wants the plate edge. Everything
 * else is left to the archetype's own first choice.
 */
export function frameFromPlan(plan: DesignPlan): FrameStyle | undefined {
  if (plan.positioning === 'technical' || plan.positioning === 'playful') return 'none'
  if (plan.visualIntent === 'air') return 'none'
  if (plan.positioning === 'luxury' && plan.color.metallic === 'foil') return 'band-hairline'
  return undefined
}

export function intentFromPlan(plan: DesignPlan): StudioIntent {
  const out: StudioIntent = {}
  const typePairing = typePairingFromPlan(plan)
  const frame = frameFromPlan(plan)
  const ornament = ornamentFromPlan(plan)
  if (typePairing) out.typePairing = typePairing
  if (frame) out.frame = frame
  if (ornament) out.ornament = ornament
  return out
}

/**
 * Brief depth → direction. What the customer said about price and feeling is a stronger signal
 * than the style rule's default budget, so this sits *after* the plan hint and *before* knowledge
 * and the customer's explicit commands. Ornament only: a mass-market tier is painted quiet, a
 * boutique one rich; "sakin" / "zarif" pull toward quiet, "gösterişli" toward rich. Audience and
 * channel do not move a decision here — they reach the LLM art director as text.
 */
export function hintsFromBriefDepth(brief: Pick<DesignBrief, 'priceTier' | 'feeling'>): DirectionHints | null {
  const feeling = (brief.feeling ?? '').toLocaleLowerCase('tr')
  let ornament: OrnamentLevel | undefined
  let why = ''
  if (brief.priceTier === 'mass') {
    ornament = 'quiet'
    why = 'ekonomik segment'
  } else if (brief.priceTier === 'boutique') {
    ornament = 'rich'
    why = 'butik segment'
  }
  if (/sakin|zarif|dingin|huzur/.test(feeling)) {
    ornament = 'quiet'
    why = `his: ${brief.feeling}`
  } else if (/gösterişli|şaşaalı|zengin/.test(feeling)) {
    ornament = 'rich'
    why = `his: ${brief.feeling}`
  }
  if (!ornament) return null
  return { ornament, rationale: [`Brief derinliği (${why}): süs ${ornament}.`] }
}

/** The plan as a direction hint — empty when the plan has nothing strong enough to say. */
export function hintsFromPlan(plan: DesignPlan): DirectionHints | null {
  const intent = intentFromPlan(plan)
  const said: string[] = []
  if (intent.typePairing) said.push(`tip ${intent.typePairing}`)
  if (intent.frame) said.push(`çerçeve ${intent.frame}`)
  if (intent.ornament) said.push(`süs ${intent.ornament}`)
  if (!said.length) return null
  return {
    ...intent,
    rationale: [`Tasarım beyni (${plan.positioning} · ${plan.visualIntent} · ${plan.typography.authority}): ${said.join(', ')}.`],
  }
}
