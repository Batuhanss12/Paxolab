import { describe, expect, it } from 'vitest'
import { appReducer, createInitialAppState, designSurface, sameSurface, type AppState } from './appState'

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

  it('keeps box and label designs in separate slots', () => {
    const base = createInitialAppState()
    const box = { id: 'box-1', kind: 'box' as const, brief: { ...base.brief, packagingMode: 'box' as const }, revision: 1 } as unknown as NonNullable<AppState['design']>
    const label = { id: 'label-1', kind: 'label' as const, brief: { ...base.brief, packagingMode: 'label' as const }, revision: 1 } as unknown as NonNullable<AppState['design']>
    const withBox = appReducer({ ...base, design: box }, { type: 'generation.finish', design: box, printReady: false })
    const withLabel = appReducer(withBox, { type: 'generation.finish', design: label, printReady: false })
    const backToBox = appReducer(withLabel, { type: 'surfaceView', surface: 'box' })

    expect(withBox.boxDesign?.id).toBe('box-1')
    expect(withLabel.boxDesign?.id).toBe('box-1')
    expect(withLabel.labelDesign?.id).toBe('label-1')
    expect(withLabel.design?.id).toBe('label-1')
    expect(withLabel.designHistory).toEqual([])
    expect(backToBox.design?.id).toBe('box-1')
    expect(backToBox.surfaceView).toBe('box')
    expect(backToBox.showTemplates).toBe(false)
  })

  it('maps packaging designs to the box surface so StyleBar can regenerate', () => {
    expect(designSurface({ kind: 'packaging' })).toBe('box')
    expect(designSurface({ kind: 'label' })).toBe('label')
    expect(sameSurface({ kind: 'packaging' }, { packagingMode: 'box' })).toBe(true)
    expect(sameSurface({ kind: 'packaging' }, { packagingMode: 'label' })).toBe(false)
    expect(sameSurface({ kind: 'label' }, { packagingMode: 'label' })).toBe(true)
  })
})
