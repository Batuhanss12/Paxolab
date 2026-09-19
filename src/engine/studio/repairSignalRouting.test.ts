/**
 * The repair signals steer a default, and never a choice.
 *
 * `repairSignals` were produced from Phase 1 and read by nothing. Three phases of calibration made
 * them mean something — `focal` was a constant 45 on half the engine (1.5), `categoryFit` reported
 * the chooser's own floor as a failure and `distinctiveness` counted two axes that cannot move
 * (2A) — and Phase 2F measured what happens when they route: 16 of 216 faces re-rolled, craft
 * 74.8 → 75.0, focal 58.9 → 60.9, faces still carrying a signal down from 45 to 29.
 *
 * 2F still switched it back off, because the swap also overruled directions somebody had asked
 * for: "elektronik kutu ama mermer ve altın" stopped landing on marble and a sanitised LLM
 * direction stopped being consumed. The engine's rule is that a word in the brief outranks the
 * sector's opinion of it. `DesignDirection.archetypePin` is what lets the route obey it — measured
 * first: of the 45 signal-carrying faces in the sweep, none was pinned by a word, a user, a family
 * or a model, so the guard protects exactly the cases that broke and costs none of the gain.
 */
import { describe, expect, it } from 'vitest'
import { STUDIO_CRAFT_FLOOR, STUDIO_LEAD_FLOOR, craftRouteImproves, needsCraftRoute } from './studioRepair'

const clean = { visualCraft: 75, hero: 80, blockers: [], repairSignals: [] }
const weak = { ...clean, repairSignals: [{ axis: 'focal', score: 35 }] }

/** Deliberate choosers. `sector` is the prior the walk starts from; `knowledge` is the engine's own. */
const CHOSEN = ['visual', 'user', 'family', 'llm'] as const
const DEFAULT = ['sector', 'knowledge', undefined] as const

describe('a weak reading routes a face nobody chose', () => {
  it('even when the total and the lead are healthy', () => {
    expect(needsCraftRoute(clean)).toBe(false)
    expect(needsCraftRoute(weak)).toBe(true)
  })

  it('and every default counts as nobody', () => {
    for (const pin of DEFAULT) expect(needsCraftRoute({ ...weak, archetypePin: pin }), String(pin)).toBe(true)
  })

  it('but a direction somebody asked for is left alone', () => {
    for (const pin of CHOSEN) expect(needsCraftRoute({ ...weak, archetypePin: pin }), pin).toBe(false)
  })

  it('a blocker still outranks the pin: a broken promise is no one preference', () => {
    for (const pin of CHOSEN) {
      expect(needsCraftRoute({ ...clean, archetypePin: pin, blockers: [{ id: 'HIERARCHY_VIOLATION' }] }), pin).toBe(true)
    }
  })
})

describe('an alternative is kept only when it answers the reading', () => {
  it('the weak axis has to actually improve', () => {
    const same = { ...clean, visualCraft: 78, repairSignals: [{ axis: 'focal', score: 35 }] }
    expect(craftRouteImproves(weak, same), 'aynı focal, daha yüksek toplam').toBe(false)
    expect(craftRouteImproves(weak, { ...clean, repairSignals: [{ axis: 'focal', score: 60 }] })).toBe(true)
  })

  it('a different axis improving is not an answer', () => {
    const elsewhere = { ...clean, repairSignals: [{ axis: 'categoryFit', score: 90 }, { axis: 'focal', score: 35 }] }
    expect(craftRouteImproves(weak, elsewhere)).toBe(false)
  })

  it('and it may not be bought with craft', () => {
    /*
     * Holding only `STUDIO_CRAFT_FLOOR` let a face trade three points of total for one of focal —
     * measured as a 0.3 drop in the sweep mean. The total has to hold too.
     */
    const cheaper = { ...clean, visualCraft: 70, repairSignals: [{ axis: 'focal', score: 85 }] }
    expect(cheaper.visualCraft).toBeGreaterThan(STUDIO_CRAFT_FLOOR)
    expect(craftRouteImproves(weak, cheaper)).toBe(false)
  })

  it('a face judged on its lead is judged the way it always was', () => {
    const noLead = { visualCraft: 74, hero: STUDIO_LEAD_FLOOR - 1, blockers: [], repairSignals: [] }
    expect(needsCraftRoute(noLead)).toBe(true)
    expect(craftRouteImproves(noLead, { ...clean, visualCraft: 74 })).toBe(true)
    expect(craftRouteImproves(noLead, { ...noLead, visualCraft: 76 })).toBe(false)
  })
})

describe('the route stays bounded', () => {
  it('a reading that cannot be improved swaps nothing', () => {
    /*
     * The budget is three steps in `FormaLocalEngine`; the guard here is that a step is kept only
     * when it is strictly better, so two equally weak candidates cannot ping-pong.
     */
    const a = { ...clean, repairSignals: [{ axis: 'focal', score: 35 }] }
    const b = { ...clean, repairSignals: [{ axis: 'focal', score: 35 }] }
    expect(craftRouteImproves(a, b)).toBe(false)
    expect(craftRouteImproves(b, a)).toBe(false)
  })
})
