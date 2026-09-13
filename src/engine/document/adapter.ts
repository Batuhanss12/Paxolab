import type { ArtworkModel, DielineModel } from '../../types'
import { escapeSvg } from '../artwork/svgGeometry'
import type { DesignDocument, DesignNode, DocumentNodeBase, NodeTransform } from './types'
import { identityTransform } from './types'
import { elementToNode, parseSvgElements } from './svgParser'

function isIdentity(transform: NodeTransform): boolean {
  return (
    transform.x === 0 &&
    transform.y === 0 &&
    transform.scaleX === 1 &&
    transform.scaleY === 1 &&
    transform.rotation === 0
  )
}

function transformMarkup(node: DocumentNodeBase, markup: string): string {
  if (isIdentity(node.transform)) return markup
  const centerX = node.bounds.x + node.bounds.w / 2
  const centerY = node.bounds.y + node.bounds.h / 2
  const transform = [
    `translate(${node.transform.x} ${node.transform.y})`,
    `rotate(${node.transform.rotation} ${centerX} ${centerY})`,
    `translate(${centerX} ${centerY})`,
    `scale(${node.transform.scaleX} ${node.transform.scaleY})`,
    `translate(${-centerX} ${-centerY})`,
  ].join(' ')
  return `<g data-document-node="${escapeSvg(node.id)}" transform="${transform}">${markup}</g>`
}

function renderNode(node: DesignNode): string {
  if (!node.visible || node.kind === 'group') return ''
  if (node.kind === 'svg-fragment') return transformMarkup(node, node.markup)
  if (node.kind === 'text') {
    const { style } = node
    const x = style.textAnchor === 'middle'
      ? node.bounds.x + node.bounds.w / 2
      : style.textAnchor === 'end'
        ? node.bounds.x + node.bounds.w
        : node.bounds.x
    return transformMarkup(
      node,
      `<text x="${x}" y="${node.bounds.y + style.fontSizeMm}" fill="${style.fill}" font-family="${escapeSvg(style.fontFamily)}" font-size="${style.fontSizeMm}" font-weight="${style.fontWeight}" letter-spacing="${style.letterSpacingMm}" text-anchor="${style.textAnchor}">${escapeSvg(node.text)}</text>`,
    )
  }
  if (node.kind === 'shape') {
    return transformMarkup(
      node,
      `<path d="${escapeSvg(node.path)}" fill="${node.style.fill}" stroke="${node.style.stroke}" stroke-width="${node.style.strokeWidthMm}" opacity="${node.style.opacity}" />`,
    )
  }
  const aspectRatio = node.preserveAspectRatio === 'none' ? 'none' : `xMidYMid ${node.preserveAspectRatio}`
  return transformMarkup(
    node,
    `<image href="${escapeSvg(node.href)}" x="${node.bounds.x}" y="${node.bounds.y}" width="${node.bounds.w}" height="${node.bounds.h}" preserveAspectRatio="${aspectRatio}" opacity="${node.opacity}" />`,
  )
}

export function documentFromArtwork(
  id: string,
  name: string,
  dieline: DielineModel,
  artwork: ArtworkModel,
  timestamp: number,
): DesignDocument {
  const nodes: DesignNode[] = []
  let zIndex = 0

  for (const layer of artwork.layers) {
    const panel = dieline.panels.find((candidate) => candidate.id === layer.panelId)
    const panelBounds = panel
      ? { x: panel.x, y: panel.y, w: panel.w, h: panel.h }
      : { x: 0, y: 0, w: 0, h: 0 }

    // Legacy monolithic node — kept for backward compat (renders full panel).
    nodes.push({
      id: `legacy:${layer.panelId}`,
      kind: 'svg-fragment',
      panelId: layer.panelId,
      name: `${layer.panelId} artwork`,
      role: 'legacy',
      bounds: panelBounds,
      transform: identityTransform(),
      visible: true,
      locked: true,
      zIndex: zIndex++,
      markup: layer.markup,
    })

    // Element-level nodes — parsed from the same markup, hidden by default.
    // These enable future element-level editing without breaking legacy rendering.
    const elements = parseSvgElements(layer.markup)
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]
      const node = elementToNode(el, `el:${layer.panelId}:${i}`, layer.panelId, zIndex)
      if (node) {
        // Element-level nodes start hidden — legacy node renders the panel.
        // When element-level editing is enabled, the legacy node can be hidden
        // and these nodes made visible individually.
        node.visible = false
        nodes.push(node)
        zIndex++
      }
    }
  }

  return {
    schemaVersion: 1,
    id,
    name,
    unit: 'mm',
    frontPanelId: artwork.frontPanelId,
    language: artwork.language,
    systemKey: artwork.systemKey,
    panels: dieline.panels.map((panel) => ({
      id: panel.id,
      role: panel.role,
      bounds: { x: panel.x, y: panel.y, w: panel.w, h: panel.h },
      polygon: panel.polygon.map((point) => ({ ...point })),
      locked: true,
    })),
    nodes,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function artworkFromDocument(document: DesignDocument): ArtworkModel {
  return {
    frontPanelId: document.frontPanelId,
    language: document.language,
    systemKey: document.systemKey,
    layers: document.panels.map((panel) => ({
      panelId: panel.id,
      markup: document.nodes
        .filter((node) => node.panelId === panel.id)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map(renderNode)
        .join(''),
    })),
  }
}
