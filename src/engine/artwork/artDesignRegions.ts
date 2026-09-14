/**
 * Phase 1 — decorative region map from real panel + lockup + protected boxes.
 * Does not change lockup typography. `slotBox` remains the geometric fallback.
 */
import type { Panel } from '../../types'
import type { SafeRect } from './patternMotifs'
import {
  bboxArea,
  bboxIntersection,
  bboxIntersectionArea,
  bboxOverlaps,
  type BBox,
} from './artMotifGeom'
import {
  type MotifAvoidRegion,
  type MotifMetaHost,
  type MotifRegionId,
  type MotifRole,
  resolveMotifDesign,
  resolvedMotifRole,
  seedTieBreak,
} from './artMotifMeta'

export type SlotKind = 'stamp' | 'nw' | 'ne' | 'sw' | 'se' | 'band-top' | 'band-bottom' | 'frame' | 'hero-stamp'

export type DesignRegion = {
  id: MotifRegionId
  rect: BBox
  available: boolean
  occupancy: number
  priority: number
  roleSuitability: Record<string, number>
  protected: boolean
}

export type OccupancyReport = {
  usablePanelArea: number
  occupiedArea: number
  occupancy: number
  lockupArea: number
  heroArea: number
  decorationArea: number
  protectedArea: number
}

export type RegionObstacle = {
  id: string
  rect: BBox
  kind: MotifAvoidRegion | 'lockup' | 'hero' | 'decoration'
  gap?: number
}

export type RegionMapInput = {
  panel: Panel
  lockup?: SafeRect
  hero?: SafeRect
  extras?: RegionObstacle[]
  goldBar?: boolean
  safe?: SafeRect
  decorations?: BBox[]
}

const REGION_IDS: MotifRegionId[] = ['nw', 'ne', 'sw', 'se', 'top', 'bottom', 'left', 'right', 'center', 'field']

const PRIORITY: Record<MotifRegionId, number> = {
  nw: 8,
  ne: 8,
  sw: 6,
  se: 6,
  top: 7,
  bottom: 4,
  left: 5,
  right: 5,
  field: 3,
  center: 1,
}

export function slotBox(
  panel: Panel,
  kind: SlotKind,
  safe?: SafeRect,
): BBox {
  const { x, y, w, h } = panel
  const m = Math.min(w, h)
  const inset = m * 0.045
  const stamp = Math.min(w * 0.22, m * 0.2)
  if (kind === 'nw') return { x: x + inset, y: y + inset, w: stamp, h: stamp }
  if (kind === 'ne') return { x: x + w - inset - stamp, y: y + inset, w: stamp, h: stamp }
  if (kind === 'sw') return { x: x + inset, y: y + h - inset - stamp, w: stamp, h: stamp }
  if (kind === 'se') return { x: x + w - inset - stamp, y: y + h - inset - stamp, w: stamp, h: stamp }
  if (kind === 'band-top') return { x, y, w, h: Math.max(8, h * 0.15) }
  if (kind === 'band-bottom') {
    const band = Math.max(8, h * 0.12)
    return { x: x + inset, y: y + h - inset - band, w: w - inset * 2, h: band }
  }
  if (kind === 'frame') {
    const pad = m * 0.05
    return { x: x + pad, y: y + pad, w: w - pad * 2, h: h - pad * 2 }
  }
  if (kind === 'hero-stamp') {
    const size = Math.min(w * 0.3, m * 0.24)
    const top = safe ? Math.max(y + 2.2, safe.y - size - 2.4) : y + h * 0.08
    return { x: x + (w - size) / 2, y: top, w: size, h: size }
  }
  return { x: x + (w - stamp) / 2, y: y + inset + m * 0.02, w: stamp, h: stamp }
}

export function slotKindToRegion(kind: SlotKind): MotifRegionId {
  if (kind === 'band-top') return 'top'
  if (kind === 'band-bottom') return 'bottom'
  if (kind === 'frame') return 'field'
  if (kind === 'hero-stamp') return 'top'
  if (kind === 'stamp') return 'center'
  return kind
}

export function collectObstacles(input: RegionMapInput): RegionObstacle[] {
  const { panel } = input
  const out: RegionObstacle[] = []
  if (input.lockup) out.push({ id: 'lockup', rect: input.lockup, kind: 'lockup', gap: 1.6 })
  if (input.hero && input.hero.w > 0 && input.hero.h > 0) {
    out.push({ id: 'hero', rect: input.hero, kind: 'hero', gap: 1.2 })
  }
  if (input.goldBar) {
    out.push({
      id: 'legal',
      rect: { x: panel.x, y: panel.y + panel.h - 13.2, w: panel.w, h: 13.2 },
      kind: 'legal',
      gap: 0.8,
    })
  }
  if (input.extras) out.push(...input.extras)
  for (const deco of input.decorations ?? []) {
    out.push({ id: 'decoration', rect: deco, kind: 'decoration', gap: 0.6 })
  }
  return out
}

export function panelOccupancy(input: RegionMapInput): OccupancyReport {
  const usable = Math.max(1, input.panel.w * input.panel.h)
  const lockupArea = input.lockup ? bboxArea(input.lockup) : 0
  const heroArea = input.hero && input.hero.w > 0 ? bboxArea(input.hero) : 0
  const decorationArea = (input.decorations ?? []).reduce((n, b) => n + bboxArea(b), 0)
  const obstacles = collectObstacles(input)
  const protectedArea = obstacles
    .filter((o) => o.kind === 'lockup' || o.kind === 'legal' || o.kind === 'barcode' || o.kind === 'logo')
    .reduce((n, o) => n + bboxArea(o.rect), 0)
  const occupiedArea = Math.min(usable, lockupArea + heroArea + decorationArea + Math.max(0, protectedArea - lockupArea))
  return {
    usablePanelArea: usable,
    occupiedArea,
    occupancy: occupiedArea / usable,
    lockupArea,
    heroArea,
    decorationArea,
    protectedArea,
  }
}

function regionSeedRect(panel: Panel, id: MotifRegionId, safe?: SafeRect): BBox {
  const { x, y, w, h } = panel
  const m = Math.min(w, h)
  const inset = m * 0.045
  const band = Math.max(8, h * 0.15)
  const side = Math.max(8, w * 0.18)
  if (id === 'nw' || id === 'ne' || id === 'sw' || id === 'se') return slotBox(panel, id, safe)
  if (id === 'top') return { x: x + inset, y: y + inset, w: w - inset * 2, h: band }
  if (id === 'bottom') return { x: x + inset, y: y + h - inset - band, w: w - inset * 2, h: band }
  if (id === 'left') return { x: x + inset, y: y + inset, w: side, h: h - inset * 2 }
  if (id === 'right') return { x: x + w - inset - side, y: y + inset, w: side, h: h - inset * 2 }
  if (id === 'center') {
    return { x: x + w * 0.22, y: y + h * 0.28, w: w * 0.56, h: h * 0.36 }
  }
  return { x: x + inset, y: y + inset, w: w - inset * 2, h: h - inset * 2 }
}

function padded(rect: BBox, gap: number): BBox {
  return { x: rect.x - gap, y: rect.y - gap, w: rect.w + gap * 2, h: rect.h + gap * 2 }
}

function clipAgainst(rect: BBox, obs: BBox, gap: number, id: MotifRegionId): BBox | null {
  const hit = bboxIntersection(rect, padded(obs, gap))
  if (!hit) return rect
  if (bboxIntersectionArea(rect, padded(obs, gap)) / Math.max(1, bboxArea(rect)) > 0.72) return null
  let next = { ...rect }
  const obsR = obs.x + obs.w + gap
  const obsB = obs.y + obs.h + gap
  const obsL = obs.x - gap
  const obsT = obs.y - gap
  if (id === 'nw' || id === 'ne' || id === 'top') {
    if (next.y + next.h > obsT && next.y < obsT) next = { ...next, h: Math.max(0, obsT - next.y) }
  }
  if (id === 'sw' || id === 'se' || id === 'bottom') {
    if (next.y < obsB && next.y + next.h > obsB) {
      const y = Math.max(next.y, obsB)
      next = { ...next, y, h: Math.max(0, next.y + next.h - y) }
    }
  }
  if (id === 'ne' || id === 'se' || id === 'right') {
    if (next.x < obsL && next.x + next.w > obsL) next = { ...next, w: Math.max(0, obsL - next.x) }
  }
  if (id === 'nw' || id === 'sw' || id === 'left') {
    if (next.x + next.w > obsR && next.x < obsR) next = { ...next, w: Math.max(0, obsR - next.x) }
  }
  if (id === 'center' || id === 'field') return null
  if (next.w < 0.4 || next.h < 0.4) return null
  return next
}

function suitability(id: MotifRegionId): Record<string, number> {
  const corner = id === 'nw' || id === 'ne' || id === 'sw' || id === 'se' ? 1 : id === 'center' ? 0 : 0.15
  return {
    stamp: id === 'center' || id === 'top' ? 0.75 : 0.45,
    corner,
    band: id === 'top' || id === 'bottom' || id === 'left' || id === 'right' ? 1 : 0.12,
    frame: id === 'field' ? 1 : 0.25,
    'field-fill': id === 'field' ? 1 : 0.1,
    ornament: id === 'field' || corner > 0.5 ? 0.7 : 0.35,
    divider: id === 'top' || id === 'bottom' ? 1 : 0.1,
    accent: id === 'ne' || id === 'nw' || id === 'top' || id === 'bottom' ? 0.8 : 0.3,
  }
}

export function buildDesignRegionMap(input: RegionMapInput): DesignRegion[] {
  const obstacles = collectObstacles(input)
  const lockLegal = obstacles.filter((o) => o.kind === 'lockup' || o.kind === 'legal' || o.kind === 'barcode' || o.kind === 'logo' || o.kind === 'product')
  const all = obstacles.filter((o) => o.kind !== 'decoration')
  return REGION_IDS.map((id) => {
    let rect: BBox | null = regionSeedRect(input.panel, id, input.safe)
    let protectedRegion = id === 'center'
    for (const obs of all) {
      if (!rect) break
      const ignoreLockup = id === 'field' && obs.kind === 'lockup'
      if (ignoreLockup) continue
      const next = clipAgainst(rect, obs.rect, obs.gap ?? 1.2, id)
      if (!next) {
        if (obs.kind === 'lockup' || obs.kind === 'legal' || obs.kind === 'barcode') protectedRegion = true
        if (id === 'center' || id === 'field') {
          protectedRegion = obs.kind === 'lockup' || protectedRegion
          break
        }
        rect = null
        break
      }
      rect = next
    }
    const area = rect ? bboxArea(rect) : 0
    const occupied = rect
      ? lockLegal.reduce((n, o) => n + bboxIntersectionArea(rect as BBox, padded(o.rect, o.gap ?? 0)), 0)
      : area
    const occupancy = area <= 0 ? 1 : Math.min(1, occupied / area)
    const available = Boolean(rect && area > 2 && occupancy < 0.85 && !((id === 'center' || id === 'bottom') && protectedRegion && occupancy > 0.45))
    if (id === 'center' && input.lockup && rect && bboxIntersectionArea(rect, input.lockup) / Math.max(1, area) > 0.35) {
      protectedRegion = true
    }
    return {
      id,
      rect: rect ?? regionSeedRect(input.panel, id, input.safe),
      available: available && !(id === 'center' && protectedRegion),
      occupancy,
      priority: PRIORITY[id],
      roleSuitability: suitability(id),
      protected: protectedRegion || occupancy > 0.8,
    }
  })
}

export function regionById(map: DesignRegion[], id: MotifRegionId): DesignRegion | undefined {
  return map.find((r) => r.id === id)
}

export function boxesCollide(a: BBox, b: BBox, gap = 0): boolean {
  return bboxOverlaps(a, padded(b, gap))
}

function scaleBox(box: BBox, scale: number, kind: SlotKind): BBox {
  const s = Math.max(0.05, scale)
  const w = box.w * s
  const h = box.h * s
  if (kind === 'ne') return { x: box.x + box.w - w, y: box.y, w, h }
  if (kind === 'nw') return { x: box.x, y: box.y, w, h }
  if (kind === 'se') return { x: box.x + box.w - w, y: box.y + box.h - h, w, h }
  if (kind === 'sw') return { x: box.x, y: box.y + box.h - h, w, h }
  if (kind === 'band-bottom') return { x: box.x + (box.w - w) / 2, y: box.y + box.h - h, w, h }
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h }
}

export type ResolveRegionResult = {
  rect: BBox
  regionId: MotifRegionId
  region?: DesignRegion
  scale: number
  rejected: boolean
  reason?: string
}

export function resolveDesignRegion(input: {
  panel: Panel
  kind: SlotKind
  map?: DesignRegion[]
  atom?: MotifMetaHost
  obstacles?: RegionObstacle[]
  safe?: SafeRect
  allowLockupOverlap?: boolean
}): ResolveRegionResult {
  const regionId = slotKindToRegion(input.kind)
  const fallback = slotBox(input.panel, input.kind, input.safe)
  const region = input.map ? regionById(input.map, regionId) : undefined
  let base = fallback
  if (region && region.available && region.rect.w > 0.4 && region.rect.h > 0.4) {
    if (input.kind === 'nw' || input.kind === 'ne' || input.kind === 'sw' || input.kind === 'se' || input.kind === 'stamp' || input.kind === 'hero-stamp') {
      const w = Math.min(fallback.w, region.rect.w)
      const h = Math.min(fallback.h, region.rect.h)
      if (input.kind === 'ne') base = { x: region.rect.x + region.rect.w - w, y: region.rect.y, w, h }
      else if (input.kind === 'nw') base = { x: region.rect.x, y: region.rect.y, w, h }
      else if (input.kind === 'se') base = { x: region.rect.x + region.rect.w - w, y: region.rect.y + region.rect.h - h, w, h }
      else if (input.kind === 'sw') base = { x: region.rect.x, y: region.rect.y + region.rect.h - h, w, h }
      else base = { x: region.rect.x + (region.rect.w - w) / 2, y: region.rect.y + (region.rect.h - h) / 2, w, h }
    } else {
      base = region.rect
    }
  }

  const meta = input.atom ? resolveMotifDesign(input.atom) : undefined
  const minScale = meta?.minScale ?? 0.35
  const maxScale = meta?.maxScale ?? 1.8
  let scale = Math.min(maxScale, Math.max(minScale, 1))
  const origin = base
  let box = scale === 1 ? origin : scaleBox(origin, scale, input.kind)

  const frame = input.kind === 'frame' || input.allowLockupOverlap
  const obstacles = (input.obstacles ?? []).filter((o) => {
    if (frame && (o.kind === 'lockup' || o.kind === 'logo' || o.kind === 'product')) return false
    return true
  })

  if (region?.protected && !frame && (regionId === 'center' || meta?.avoidRegions?.includes('center'))) {
    if (input.kind === 'stamp' || regionId === 'center') {
      return { rect: box, regionId, region, scale, rejected: true, reason: 'protected-region' }
    }
  }

  const hits = (placed: BBox) => obstacles.find((o) => boxesCollide(placed, o.rect, o.gap ?? 0))
  let hit = hits(box)
  while (hit && scale > minScale + 0.001) {
    scale = Math.max(minScale, scale * 0.82)
    box = scaleBox(origin, scale, input.kind)
    hit = hits(box)
  }
  if (hit) {
    return { rect: box, regionId, region, scale, rejected: true, reason: `collision:${hit.id}` }
  }
  if (box.w < 0.4 || box.h < 0.4) {
    return { rect: box, regionId, region, scale, rejected: true, reason: 'too-small' }
  }
  const placedScale = box.w / Math.max(0.01, fallback.w)
  if (placedScale < minScale - 0.001 || placedScale > maxScale + 0.001) {
    const clamped = Math.min(maxScale, Math.max(minScale, placedScale))
    box = scaleBox(fallback, clamped, input.kind)
    scale = clamped
    if (hits(box)) return { rect: box, regionId, region, scale, rejected: true, reason: 'scale-collision' }
  }
  return { rect: box, regionId, region, scale, rejected: false }
}

export function scoreAtomForRegion(
  atom: MotifMetaHost,
  regionId: MotifRegionId,
  style?: string,
  sector?: string,
): number {
  const meta = resolveMotifDesign(atom)
  const role = resolvedMotifRole(atom)
  if (meta.avoidRegions?.includes(regionId as MotifAvoidRegion)) return -80
  if (regionId === 'center' && (role === 'corner' || meta.avoidRegions?.includes('center'))) return -24
  let score = 0
  const suit = suitability(regionId)[role] ?? 0.3
  score += suit * 8
  if (meta.preferredRegions?.includes(regionId)) score += 6
  else if (meta.preferredRegions?.length) score -= 1.5
  if (role === 'corner' && (regionId === 'nw' || regionId === 'ne' || regionId === 'sw' || regionId === 'se')) score += 4
  if (role === 'corner' && regionId === 'center') score -= 12
  if ((role === 'band' || role === 'divider') && (regionId === 'top' || regionId === 'bottom')) score += 3
  if (meta.compatibleStyles?.length) {
    if (style && meta.compatibleStyles.includes(style)) score += 5
    else if (style) score -= 4
  }
  if (meta.styleTags?.length && style) {
    if (meta.styleTags.includes(style)) score += 2
    if (style === 'luxury' && sector !== 'food' && sector !== 'beverage' && meta.styleTags.some((t) => t === 'artdeco' || t === 'art_deco')) score += 3
    if ((sector === 'food' || sector === 'beverage') && meta.styleTags.some((t) => t === 'eco' || t === 'botanic' || t === 'harvest')) score += 4
  }
  if (meta.compatibleSectors?.length) {
    if (sector && meta.compatibleSectors.includes(sector)) score += 3
    else if (sector) score -= 1
  }
  const weight = meta.visualWeight ?? 0.45
  if (style === 'minimal' && weight > 0.72) score -= 6
  return score
}

export function rankAtomsForRegion<T extends MotifMetaHost & { id: string }>(
  atoms: T[],
  regionId: MotifRegionId,
  seed: number,
  style?: string,
  sector?: string,
): T[] {
  return [...atoms].sort((a, b) => {
    const sa = scoreAtomForRegion(a, regionId, style, sector)
    const sb = scoreAtomForRegion(b, regionId, style, sector)
    if (Math.abs(sa - sb) >= 0.08) return sb - sa
    const ta = seedTieBreak(a.id, seed)
    const tb = seedTieBreak(b.id, seed)
    return ta === tb ? a.id.localeCompare(b.id) : ta - tb
  })
}

export function atomMatchesRole(atom: MotifMetaHost, role: MotifRole): boolean {
  const resolved = resolvedMotifRole(atom)
  if (resolved === role || atom.roleGuess === role) return true
  if (role === 'band' && resolved === 'divider') return true
  if ((role === 'stamp' || role === 'ornament') && resolved === 'accent') return true
  return false
}
