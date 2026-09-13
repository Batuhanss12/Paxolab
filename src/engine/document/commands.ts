import type { DesignDocument, DesignNode, TextNode } from './types'
import { identityTransform } from './types'

export function updateNode(
  document: DesignDocument,
  nodeId: string,
  update: (node: DesignNode) => DesignNode,
  timestamp: number,
): DesignDocument {
  if (!document.nodes.some((node) => node.id === nodeId)) return document
  return {
    ...document,
    nodes: document.nodes.map((node) => (node.id === nodeId ? update(node) : node)),
    updatedAt: timestamp,
  }
}

export function patchNode(
  document: DesignDocument,
  nodeId: string,
  patch: Partial<Pick<DesignNode, 'name' | 'visible' | 'locked' | 'zIndex'>> & {
    bounds?: Partial<DesignNode['bounds']>
    transform?: Partial<DesignNode['transform']>
  },
  timestamp: number,
): DesignDocument {
  const node = document.nodes.find((candidate) => candidate.id === nodeId)
  if (!node) return document
  return updateNode(
    document,
    nodeId,
    (current) => ({
      ...current,
      ...patch,
      bounds: { ...current.bounds, ...patch.bounds },
      transform: { ...current.transform, ...patch.transform },
    }) as DesignNode,
    timestamp,
  )
}

export function addTextNode(
  document: DesignDocument,
  input: {
    id: string
    panelId: string
    text: string
    fill: string
    timestamp: number
  },
): DesignDocument {
  const panel = document.panels.find((candidate) => candidate.id === input.panelId)
  if (!panel || document.nodes.some((node) => node.id === input.id)) return document
  const maxZ = document.nodes.reduce((max, node) => Math.max(max, node.zIndex), 0)
  const fontSizeMm = Math.max(2.8, Math.min(6, panel.bounds.h * 0.06))
  const node: TextNode = {
    id: input.id,
    kind: 'text',
    panelId: panel.id,
    name: 'Metin',
    role: 'copy',
    bounds: {
      x: panel.bounds.x + panel.bounds.w * 0.15,
      y: panel.bounds.y + panel.bounds.h * 0.7,
      w: panel.bounds.w * 0.7,
      h: fontSizeMm * 1.4,
    },
    transform: identityTransform(),
    visible: true,
    locked: false,
    zIndex: maxZ + 1,
    text: input.text,
    style: {
      fill: input.fill,
      fontFamily: 'Inter, Arial, sans-serif',
      fontSizeMm,
      fontWeight: 500,
      letterSpacingMm: 0.2,
      textAnchor: 'middle',
    },
  }
  return { ...document, nodes: [...document.nodes, node], updatedAt: input.timestamp }
}

export function removeNode(document: DesignDocument, nodeId: string, timestamp: number): DesignDocument {
  const node = document.nodes.find((candidate) => candidate.id === nodeId)
  if (!node || node.locked || node.kind === 'svg-fragment') return document
  return { ...document, nodes: document.nodes.filter((candidate) => candidate.id !== nodeId), updatedAt: timestamp }
}

export function moveNode(
  document: DesignDocument,
  nodeId: string,
  delta: { x: number; y: number },
  timestamp: number,
): DesignDocument {
  const node = document.nodes.find((candidate) => candidate.id === nodeId)
  if (!node || node.locked) return document
  return patchNode(
    document,
    nodeId,
    { transform: { x: node.transform.x + delta.x, y: node.transform.y + delta.y } },
    timestamp,
  )
}

/** Bring a node to the front (highest zIndex in its panel). */
export function bringToFront(document: DesignDocument, nodeId: string, timestamp: number): DesignDocument {
  const node = document.nodes.find((n) => n.id === nodeId)
  if (!node || node.locked) return document
  const maxZ = document.nodes.reduce((max, n) => Math.max(max, n.zIndex), 0)
  return patchNode(document, nodeId, { zIndex: maxZ + 1 }, timestamp)
}

/** Send a node to the back (lowest zIndex in its panel). */
export function sendToBack(document: DesignDocument, nodeId: string, timestamp: number): DesignDocument {
  const node = document.nodes.find((n) => n.id === nodeId)
  if (!node || node.locked) return document
  const minZ = document.nodes.reduce((min, n) => Math.min(min, n.zIndex), 0)
  return patchNode(document, nodeId, { zIndex: minZ - 1 }, timestamp)
}

/** Toggle visibility of a node. */
export function toggleVisibility(document: DesignDocument, nodeId: string, timestamp: number): DesignDocument {
  const node = document.nodes.find((n) => n.id === nodeId)
  if (!node || node.locked) return document
  return patchNode(document, nodeId, { visible: !node.visible }, timestamp)
}

/** Toggle lock state of a node. */
export function toggleLock(document: DesignDocument, nodeId: string, timestamp: number): DesignDocument {
  const node = document.nodes.find((n) => n.id === nodeId)
  if (!node) return document
  return patchNode(document, nodeId, { locked: !node.locked }, timestamp)
}

/** Update text content of a TextNode. */
export function updateText(
  document: DesignDocument,
  nodeId: string,
  text: string,
  timestamp: number,
): DesignDocument {
  const node = document.nodes.find((n) => n.id === nodeId)
  if (!node || node.kind !== 'text') return document
  return updateNode(
    document,
    nodeId,
    (current) => (current.kind === 'text' ? { ...current, text } : current),
    timestamp,
  )
}

/** Update text style of a TextNode. */
export function updateTextStyle(
  document: DesignDocument,
  nodeId: string,
  stylePatch: Partial<TextNode['style']>,
  timestamp: number,
): DesignDocument {
  const node = document.nodes.find((n) => n.id === nodeId)
  if (!node || node.kind !== 'text') return document
  return updateNode(
    document,
    nodeId,
    (current) =>
      current.kind === 'text'
        ? { ...current, style: { ...current.style, ...stylePatch } }
        : current,
    timestamp,
  )
}

/** Update shape style of a ShapeNode. */
export function updateShapeStyle(
  document: DesignDocument,
  nodeId: string,
  stylePatch: Partial<{ fill: string; stroke: string; strokeWidthMm: number; opacity: number }>,
  timestamp: number,
): DesignDocument {
  const node = document.nodes.find((n) => n.id === nodeId)
  if (!node || node.kind !== 'shape') return document
  return updateNode(
    document,
    nodeId,
    (current) =>
      current.kind === 'shape'
        ? { ...current, style: { ...current.style, ...stylePatch } }
        : current,
    timestamp,
  )
}

/** Duplicate a node with a new id and offset position. */
export function duplicateNode(
  document: DesignDocument,
  nodeId: string,
  newId: string,
  timestamp: number,
): DesignDocument {
  const node = document.nodes.find((n) => n.id === nodeId)
  if (!node || node.locked) return document
  const maxZ = document.nodes.reduce((max, n) => Math.max(max, n.zIndex), 0)
  const copy: DesignNode = {
    ...node,
    id: newId,
    bounds: { ...node.bounds, x: node.bounds.x + 4, y: node.bounds.y + 4 },
    transform: { ...node.transform },
    zIndex: maxZ + 1,
    locked: false,
  }
  return { ...document, nodes: [...document.nodes, copy], updatedAt: timestamp }
}
