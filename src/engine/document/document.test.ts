import { describe, expect, it } from 'vitest'
import type { ArtworkModel, DielineModel } from '../../types'
import {
  addTextNode,
  artworkFromDocument,
  documentFromArtwork,
  moveNode,
  patchNode,
  removeNode,
  validateDesignDocument,
} from '.'

const dieline: DielineModel = {
  structureId: 'flat-label',
  unit: 'mm',
  width: 70,
  height: 90,
  dimensions: { L: 70, W: 0, H: 90 },
  panels: [
    {
      id: 'label',
      role: 'body',
      x: 0,
      y: 0,
      w: 70,
      h: 90,
      polygon: [
        { x: 0, y: 0 },
        { x: 70, y: 0 },
        { x: 70, y: 90 },
        { x: 0, y: 90 },
      ],
    },
  ],
  cut: [],
  crease: [],
  glueIds: [],
  consistent: true,
  issues: [],
}

const artwork: ArtworkModel = {
  frontPanelId: 'label',
  language: 'neutral',
  systemKey: 'label:generic:minimal',
  layers: [{ panelId: 'label', markup: '<g><text>FORMA</text></g>' }],
}

describe('DesignDocument compatibility', () => {
  it('round-trips legacy artwork without changing SVG markup', () => {
    const document = documentFromArtwork('design-1', 'FORMA', dieline, artwork, 100)

    expect(validateDesignDocument(document)).toEqual({ valid: true, issues: [] })
    expect(artworkFromDocument(document)).toEqual(artwork)
  })

  it('applies node transforms without mutating source markup', () => {
    const document = documentFromArtwork('design-1', 'FORMA', dieline, artwork, 100)
    document.nodes[0].transform.x = 4
    document.nodes[0].transform.rotation = 8

    const rendered = artworkFromDocument(document)
    expect(rendered.layers[0].markup).toContain('data-document-node="legacy:label"')
    expect(rendered.layers[0].markup).toContain('translate(4 0)')
    expect(artwork.layers[0].markup).toBe('<g><text>FORMA</text></g>')
  })

  it('adds, moves, locks and removes editable text nodes immutably', () => {
    const original = documentFromArtwork('design-1', 'FORMA', dieline, artwork, 100)
    const legacyCount = original.nodes.length
    const added = addTextNode(original, {
      id: 'text:tagline',
      panelId: 'label',
      text: 'Yeni metin',
      fill: '#ffffff',
      timestamp: 101,
    })
    const moved = moveNode(added, 'text:tagline', { x: 4, y: -2 }, 102)
    const locked = patchNode(moved, 'text:tagline', { locked: true }, 103)
    const unchanged = removeNode(locked, 'text:tagline', 104)
    const unlocked = patchNode(locked, 'text:tagline', { locked: false }, 105)
    const removed = removeNode(unlocked, 'text:tagline', 106)

    expect(original.nodes).toHaveLength(legacyCount)
    expect(moved.nodes.find((node) => node.id === 'text:tagline')?.transform).toMatchObject({ x: 4, y: -2 })
    expect(unchanged).toBe(locked)
    expect(removed.nodes.some((node) => node.id === 'text:tagline')).toBe(false)
  })

  it('rejects duplicate nodes and missing panel references', () => {
    const document = documentFromArtwork('design-1', 'FORMA', dieline, artwork, 100)
    document.nodes.push({ ...document.nodes[0], panelId: 'missing' })

    const validation = validateDesignDocument(document)
    expect(validation.valid).toBe(false)
    expect(validation.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['DUPLICATE_NODE', 'MISSING_NODE_PANEL']),
    )
  })
})
