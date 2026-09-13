import type { Point, PanelRole } from '../../types'

export type DocumentNodeRole =
  | 'background'
  | 'decor'
  | 'hero'
  | 'brand'
  | 'product'
  | 'copy'
  | 'legal'
  | 'mark'
  | 'barcode'
  | 'legacy'

export type NodeBounds = {
  x: number
  y: number
  w: number
  h: number
}

export type NodeTransform = {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

export type DocumentNodeBase = {
  id: string
  panelId: string
  name: string
  role: DocumentNodeRole
  bounds: NodeBounds
  transform: NodeTransform
  visible: boolean
  locked: boolean
  zIndex: number
}

export type SvgFragmentNode = DocumentNodeBase & {
  kind: 'svg-fragment'
  markup: string
}

export type TextNode = DocumentNodeBase & {
  kind: 'text'
  text: string
  style: {
    fill: string
    fontFamily: string
    fontSizeMm: number
    fontWeight: number
    letterSpacingMm: number
    textAnchor: 'start' | 'middle' | 'end'
  }
}

export type ShapeNode = DocumentNodeBase & {
  kind: 'shape'
  path: string
  style: {
    fill: string
    stroke: string
    strokeWidthMm: number
    opacity: number
  }
}

export type ImageNode = DocumentNodeBase & {
  kind: 'image'
  href: string
  preserveAspectRatio: 'meet' | 'slice' | 'none'
  opacity: number
}

export type GroupNode = DocumentNodeBase & {
  kind: 'group'
  childIds: string[]
}

export type DesignNode = SvgFragmentNode | TextNode | ShapeNode | ImageNode | GroupNode

export type DocumentPanel = {
  id: string
  role: PanelRole
  bounds: NodeBounds
  polygon: Point[]
  locked: boolean
}

export type DesignDocument = {
  schemaVersion: 1
  id: string
  name: string
  unit: 'mm'
  frontPanelId: string
  language: string
  systemKey?: string
  panels: DocumentPanel[]
  nodes: DesignNode[]
  createdAt: number
  updatedAt: number
}

export function identityTransform(): NodeTransform {
  return { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }
}
