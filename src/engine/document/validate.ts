import type { DesignDocument } from './types'

export type DocumentIssue = {
  code: string
  nodeId?: string
  panelId?: string
  detail: string
}

export type DocumentValidation = {
  valid: boolean
  issues: DocumentIssue[]
}

export function validateDesignDocument(document: DesignDocument): DocumentValidation {
  const issues: DocumentIssue[] = []
  const panelIds = new Set<string>()
  const nodeIds = new Set<string>()

  if (document.schemaVersion !== 1) {
    issues.push({ code: 'SCHEMA_VERSION', detail: `Unsupported schema ${document.schemaVersion}` })
  }

  for (const panel of document.panels) {
    if (panelIds.has(panel.id)) {
      issues.push({ code: 'DUPLICATE_PANEL', panelId: panel.id, detail: `Duplicate panel ${panel.id}` })
    }
    panelIds.add(panel.id)
    if (panel.bounds.w <= 0 || panel.bounds.h <= 0) {
      issues.push({ code: 'INVALID_PANEL_BOUNDS', panelId: panel.id, detail: `Invalid bounds for ${panel.id}` })
    }
  }

  if (!panelIds.has(document.frontPanelId)) {
    issues.push({ code: 'MISSING_FRONT_PANEL', panelId: document.frontPanelId, detail: 'Front panel does not exist' })
  }

  for (const node of document.nodes) {
    if (nodeIds.has(node.id)) {
      issues.push({ code: 'DUPLICATE_NODE', nodeId: node.id, detail: `Duplicate node ${node.id}` })
    }
    nodeIds.add(node.id)
    if (!panelIds.has(node.panelId)) {
      issues.push({ code: 'MISSING_NODE_PANEL', nodeId: node.id, panelId: node.panelId, detail: 'Node panel does not exist' })
    }
    if (node.bounds.w < 0 || node.bounds.h < 0) {
      issues.push({ code: 'INVALID_NODE_BOUNDS', nodeId: node.id, detail: `Invalid bounds for ${node.id}` })
    }
    const values = [
      node.bounds.x,
      node.bounds.y,
      node.bounds.w,
      node.bounds.h,
      node.transform.x,
      node.transform.y,
      node.transform.scaleX,
      node.transform.scaleY,
      node.transform.rotation,
    ]
    if (values.some((value) => !Number.isFinite(value))) {
      issues.push({ code: 'NON_FINITE_NODE_VALUE', nodeId: node.id, detail: `Non-finite value in ${node.id}` })
    }
  }

  return { valid: issues.length === 0, issues }
}
