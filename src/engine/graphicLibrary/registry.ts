/**
 * GraphicLibrary registry — central registry for all graphics.
 * Each category (pattern, motif, primitive, composition, hero) has its own map.
 * Graphics register themselves at module load; the grammar queries by category + filters.
 */
import type { GraphicCategory, GraphicEntry, GraphicId, GraphicMeta, PainterFn } from './types'

const registries: Record<GraphicCategory, Map<GraphicId, GraphicEntry>> = {
  pattern: new Map(),
  motif: new Map(),
  primitive: new Map(),
  composition: new Map(),
  hero: new Map(),
}

/** Register a graphic. Idempotent — re-registering overwrites. */
export function registerGraphic(meta: GraphicMeta, paint: PainterFn): void {
  const cat = meta.category
  registries[cat].set(meta.id, { meta, paint })
}

/** Register many graphics at once (convenience for bulk module imports). */
export function registerGraphics(entries: GraphicEntry[]): void {
  for (const { meta, paint } of entries) registerGraphic(meta, paint)
}

/** Look up a graphic by category + id. */
export function getGraphic(category: GraphicCategory, id: GraphicId): GraphicEntry | undefined {
  return registries[category].get(id)
}

/** List all graphics in a category. */
export function listGraphics(category: GraphicCategory): GraphicEntry[] {
  return [...registries[category].values()]
}

/** List graphic IDs in a category. */
export function listGraphicIds(category: GraphicCategory): GraphicId[] {
  return [...registries[category].keys()]
}

/** Check if a graphic exists. */
export function hasGraphic(category: GraphicCategory, id: GraphicId): boolean {
  return registries[category].has(id)
}

/** Paint a graphic by category + id. Returns '' if not found. */
export function paintGraphic(category: GraphicCategory, id: GraphicId, ctx: import('./types').PaintCtx): string {
  const entry = registries[category].get(id)
  return entry ? entry.paint(ctx) : ''
}

/** Clear a category (for testing). */
export function clearCategory(category: GraphicCategory): void {
  registries[category].clear()
}
