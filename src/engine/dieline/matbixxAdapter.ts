import type { DielineModel, DimensionsMm, Panel, PanelKind, PanelRole, Point, StructureId } from '../../types'
import type { DielineResult, Panel as MxPanel, Path } from './matbixx/types'

export function polygonAabb(polygon: Point[]): { x: number; y: number; w: number; h: number } {
  if (polygon.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
  const xs = polygon.map((p) => p.x)
  const ys = polygon.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  return {
    x: minX,
    y: minY,
    w: Math.max(0, Math.max(...xs) - minX),
    h: Math.max(0, Math.max(...ys) - minY),
  }
}

export function kindFromMatbixxPanel(panel: MxPanel): PanelKind {
  const id = panel.id.toLowerCase()
  const face = (panel.face || '').toLowerCase()
  if (face === 'cell' || id.startsWith('cell-')) return 'product-window'
  if (id.startsWith('aux-') || face === 'device') return 'device-overlay'
  if (face === 'glue' || id.includes('glue')) return 'glue'
  if (id.includes('tuck') || id.includes('dust') || face === 'lid-tuck') return 'tuck-flap'
  if (face === 'front' || id === 'front' || id === 'base-front') return 'hero-front'
  if (face === 'back' || id === 'back' || id === 'base-back') return 'legal-back'
  if (face === 'left' || face === 'right' || /(^|-)side/.test(id)) return 'side-spine'
  if (id.startsWith('wall-') && face === 'side') return 'polygon-wall'
  return 'plain'
}

function roleOf(kind: PanelKind, face: string): PanelRole {
  if (kind === 'glue') return 'glue'
  if (kind === 'tuck-flap') return 'tuck'
  if (face === 'top' || face === 'lid' || face === 'bottom') return 'flap'
  return 'body'
}

export function creaseSegments(paths: Path[]): [Point, Point][] {
  const out: [Point, Point][] = []
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]
      const b = path[i + 1]
      if (a && b && (a.x !== b.x || a.y !== b.y)) out.push([a, b])
    }
  }
  return out
}

function overlayPanel(id: string, polygon: Point[]): Panel {
  const box = polygonAabb(polygon)
  return {
    id,
    role: 'body',
    kind: 'device-overlay',
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    polygon: polygon.map((p) => ({ x: p.x, y: p.y })),
  }
}

export function toDielineModel(
  result: DielineResult,
  dimensions: DimensionsMm,
  structureId: StructureId,
  extraOverlay: { cut?: Path[]; perf?: Path[] } = {},
): DielineModel {
  const panels: Panel[] = result.panels.map((panel) => {
    const box = polygonAabb(panel.polygon)
    const kind = kindFromMatbixxPanel(panel)
    return {
      id: panel.id,
      role: roleOf(kind, panel.face),
      kind,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      polygon: panel.polygon.map((p) => ({ x: p.x, y: p.y })),
    }
  })

  extraOverlay.cut?.forEach((poly, i) => panels.push(overlayPanel(`aux-cut-${i}`, poly)))
  extraOverlay.perf?.forEach((poly, i) => panels.push(overlayPanel(`aux-perf-${i}`, poly)))

  const glueIds = panels.filter((panel) => panel.kind === 'glue').map((panel) => panel.id)
  const issues = [...result.errors]
  if (!result.success && issues.length === 0) issues.push('MatBixx üretim başarısız')

  const width = result.bounds.width || Math.max(0, ...panels.map((p) => p.x + p.w))
  const height = result.bounds.height || Math.max(0, ...panels.map((p) => p.y + p.h))

  return {
    structureId,
    unit: 'mm',
    width,
    height,
    dimensions,
    panels,
    cut: result.paths.cut.map((path) => path.map((p) => ({ x: p.x, y: p.y }))),
    crease: creaseSegments(result.paths.crease),
    glueIds,
    consistent: result.success && issues.length === 0 && panels.length > 0 && width > 0 && height > 0,
    issues,
  }
}
