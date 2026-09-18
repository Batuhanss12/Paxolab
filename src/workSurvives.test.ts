/**
 * The customer's work survives a refresh.
 *
 * Three separate leaks, all found by reading the persistence layer rather than by any failing
 * test, and all of them the kind a customer discovers after paying:
 *
 *   1. **The logo disappeared.** Neither store saved `allAttachments`, and both restore paths
 *      blanked it. The design on screen kept the logo already painted into it, so nothing looked
 *      wrong — until the next generation looked the logo up, found an empty list, and quietly
 *      produced a design without it.
 *   2. **Half a dual project vanished.** `boxDesign`, `labelDesign`, `surfaceView` and
 *      `bottleShape` were in neither store, so a customer who had made both a carton and a label
 *      lost whichever one was not on screen.
 *   3. **A full quota deleted everything.** `saveSession` answered a storage error by removing the
 *      saved session — the one moment storage is under pressure was the one moment the work was
 *      thrown away.
 *
 * Attachments live in IndexedDB and not in localStorage on purpose: they are base64 and would
 * burst the 5 MB quota, which is what made leak 3 reachable in the first place.
 */
import { describe, expect, it } from 'vitest'
import { appReducer, createInitialAppState, type AppState } from './appState'
import { toPersistedSession as toLocalSession } from './projectStore'
import { toPersistedSession as toCloudSession } from './storage/projectStorage'
import type { DesignSpec } from './types'

const logo = {
  id: 'logo-1',
  name: 'logo.png',
  kind: 'logo' as const,
  dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
}

function design(id: string, kind: DesignSpec['kind']): DesignSpec {
  return { id, kind, revision: 1, copy: { brand: 'Verda', product: 'Krem' } } as unknown as DesignSpec
}

function loaded(): AppState {
  const base = createInitialAppState()
  const withLogo = appReducer(base, { type: 'attachments.add', attachments: [logo] })
  return {
    ...withLogo,
    design: design('label-1', 'label'),
    boxDesign: design('box-1', 'packaging'),
    labelDesign: design('label-1', 'label'),
    surfaceView: 'label',
    bottleShape: 'cylinder' as AppState['bottleShape'],
  }
}

describe('a refresh does not cost the customer anything', () => {
  it('the uploaded logo is written to the store that has room for it', () => {
    const cloud = toCloudSession(loaded())
    expect(cloud.allAttachments, 'ekler buluta yazılmıyor').toEqual([logo])
  })

  it('attachments stay out of localStorage, where they would burst the quota', () => {
    const local = toLocalSession(loaded()) as Record<string, unknown>
    expect('allAttachments' in local, 'base64 ekler yerel depoya sızdı').toBe(false)
  })

  it('both surfaces are saved, by both stores', () => {
    for (const [name, persisted] of [
      ['yerel', toLocalSession(loaded())],
      ['bulut', toCloudSession(loaded())],
    ] as const) {
      expect(persisted.boxDesign?.id, `${name}: kutu kaydedilmedi`).toBe('box-1')
      expect(persisted.labelDesign?.id, `${name}: etiket kaydedilmedi`).toBe('label-1')
      expect(persisted.surfaceView, `${name}: görünen yüzey kaydedilmedi`).toBe('label')
      expect(persisted.bottleShape, `${name}: şişe formu kaydedilmedi`).toBe('cylinder')
    }
  })

  it('the answered-questions ledger is in both stores, so the chat does not re-ask', () => {
    expect(toLocalSession(loaded()).conversation).toBeDefined()
    expect(toCloudSession(loaded()).conversation).toBeDefined()
  })

  /**
   * The restore half. Blanking `allAttachments` here is what made the logo vanish; `pending` is
   * the composer's tray and is meant to be cleared.
   */
  it('hydrating keeps the attachments and both surfaces', () => {
    const restored = appReducer(createInitialAppState(), {
      type: 'hydrate',
      state: toCloudSession(loaded()) as Partial<AppState>,
    })
    expect(restored.allAttachments, 'geri yüklemede logo silindi').toEqual([logo])
    expect(restored.pending, 'bekleyen tepsi temizlenmedi').toEqual([])
    expect(restored.boxDesign?.id).toBe('box-1')
    expect(restored.labelDesign?.id).toBe('label-1')
  })

  it('hydrating an empty store does not invent anything', () => {
    const restored = appReducer(createInitialAppState(), { type: 'hydrate', state: {} })
    expect(restored.design).toBeNull()
    expect(restored.allAttachments).toEqual([])
  })
})
