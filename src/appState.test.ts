import { describe, expect, it } from 'vitest'
import { appReducer, createInitialAppState, type AppState } from './appState'

const attachment = {
  id: 'logo-1',
  name: 'logo.svg',
  kind: 'logo' as const,
  dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
}

describe('appReducer', () => {
  it('keeps attachment collections in sync', () => {
    const added = appReducer(createInitialAppState(), { type: 'attachments.add', attachments: [attachment] })
    const cleared = appReducer(added, { type: 'pending.clear' })

    expect(added.pending).toEqual([attachment])
    expect(cleared.pending).toEqual([])
    expect(cleared.allAttachments).toEqual([attachment])
  })

  it('supports design undo and redo without losing revisions', () => {
    const base = createInitialAppState()
    const first = { id: 'first', brief: base.brief, revision: 1 } as AppState['design']
    const second = { id: 'second', brief: base.brief, revision: 2 } as AppState['design']
    const withFirst = { ...base, design: first }
    const withSecond = appReducer(withFirst, { type: 'generation.finish', design: second!, printReady: false })
    const undone = appReducer(withSecond, { type: 'history.undo' })
    const redone = appReducer(undone, { type: 'history.redo' })

    expect(undone.design?.id).toBe('first')
    expect(redone.design?.id).toBe('second')
  })

  it('resets the complete session', () => {
    const changed = appReducer(createInitialAppState(), { type: 'phase', phase: 'workspace' })
    const reset = appReducer(changed, { type: 'reset' })

    expect(reset).toEqual(createInitialAppState())
  })
})
