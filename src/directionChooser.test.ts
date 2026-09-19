/**
 * The chooser opens on a question, not on a repaint.
 *
 * Reported from the running app: stepping through tones in the 2D view threw the customer back
 * into the eight-design chooser, and clicking a card made the strip look like it "refreshed".
 * Both were the same over-trigger. The open test had been widened to compare the offer's candidate
 * *list*, so that pressing "tasarımları değiştir" would reopen — but any generation that re-ranks
 * the strip changes that list, and a tone change re-ranks, and pinning a card re-ranks.
 *
 * What makes an offer unanswered is the customer asking for a different set. Nothing else.
 */
import { describe, expect, it } from 'vitest'
import { appReducer, createInitialAppState, type AppState } from './appState'
import type { DesignSpec } from './types'

/** Just enough of a spec for the reducer: the surface, the brief's repertoire, and an offer. */
function spec(opts: { kind?: DesignSpec['kind']; repertoire?: 'studio' | 'reference'; archetypes: string[] }): DesignSpec {
  return {
    kind: opts.kind ?? 'packaging',
    brief: { studioRepertoire: opts.repertoire ?? 'studio' },
    studio: { offer: { candidates: opts.archetypes.map((archetype) => ({ archetype })) } },
  } as unknown as DesignSpec
}

const finish = (state: AppState, design: DesignSpec): AppState =>
  appReducer(state, { type: 'generation.finish', design, printReady: false })

const STUDIO_EIGHT = ['marble-frame', 'botanical-card', 'line-scene', 'wave-panel', 'ink-panel', 'noir-stack', 'diagonal-tech', 'crest-panel']
const REFERENCE_EIGHT = ['arch-crown', 'collage-plate', 'silhouette-foot', 'ribbon-crest', 'grid-mono', 'pattern-float', 'blob-acid', 'inner-card']

describe('the eight-design chooser', () => {
  it('opens on the first face of a surface', () => {
    const after = finish(createInitialAppState(), spec({ archetypes: STUDIO_EIGHT }))
    expect(after.directionChoiceOpen).toBe(true)
  })

  it('stays shut while the customer works on the design they chose', () => {
    let state = finish(createInitialAppState(), spec({ archetypes: STUDIO_EIGHT }))
    state = appReducer(state, { type: 'directionChoice', open: false })

    // A tone change: same set, re-ranked. This is what threw the owner out of the 2D view.
    const reranked = [...STUDIO_EIGHT.slice(3), ...STUDIO_EIGHT.slice(0, 3)]
    state = finish(state, spec({ archetypes: reranked }))
    expect(state.directionChoiceOpen, 'ton değişimi seçim ekranını açtı').toBe(false)

    // Picking a card pins its family, which re-ranks the strip again.
    const pinned = ['crest-panel', ...STUDIO_EIGHT.filter((a) => a !== 'crest-panel')]
    state = finish(state, spec({ archetypes: pinned }))
    expect(state.directionChoiceOpen, 'kart seçimi listeyi yeniledi').toBe(false)

    // A plain repaint with the very same strip.
    state = finish(state, spec({ archetypes: pinned }))
    expect(state.directionChoiceOpen).toBe(false)
  })

  it('opens again when the customer asks for a different set', () => {
    let state = finish(createInitialAppState(), spec({ archetypes: STUDIO_EIGHT }))
    state = appReducer(state, { type: 'directionChoice', open: false })

    state = finish(state, spec({ repertoire: 'reference', archetypes: REFERENCE_EIGHT }))
    expect(state.directionChoiceOpen, '"tasarımları değiştir" seçim ekranını açmadı').toBe(true)

    // …and shuts again once they pick from the new set.
    state = appReducer(state, { type: 'directionChoice', open: false })
    state = finish(state, spec({ repertoire: 'reference', archetypes: [...REFERENCE_EIGHT].reverse() }))
    expect(state.directionChoiceOpen).toBe(false)

    // Going back is also a question.
    state = finish(state, spec({ repertoire: 'studio', archetypes: STUDIO_EIGHT }))
    expect(state.directionChoiceOpen, '"ilk tasarımlara dön" seçim ekranını açmadı').toBe(true)
  })

  it('opens when the surface changes, because that is a different product', () => {
    let state = finish(createInitialAppState(), spec({ archetypes: STUDIO_EIGHT }))
    state = appReducer(state, { type: 'directionChoice', open: false })
    state = finish(state, spec({ kind: 'label', archetypes: STUDIO_EIGHT }))
    expect(state.directionChoiceOpen).toBe(true)
  })

  it('never opens on a single-candidate offer', () => {
    const after = finish(createInitialAppState(), spec({ archetypes: ['marble-frame'] }))
    expect(after.directionChoiceOpen).toBe(false)
  })
})
