/**
 * Phase 1 — asset intelligence types and resolution.
 * Geometric `roleGuess` stays on the atom; this layer is optional metadata
 * with explicit > inferred > roleGuess > sheet > default precedence.
 */
import type { BBox } from './artMotifGeom'

export type MotifRole =
  | 'stamp'
  | 'corner'
  | 'band'
  | 'frame'
  | 'field-fill'
  | 'ornament'
  | 'divider'
  | 'accent'

export type MotifRegionId =
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'
  | 'field'

export type MotifAvoidRegion = 'logo' | 'product' | 'hero' | 'barcode' | 'legal' | 'center' | 'edge'

export type MotifSymmetry = 'none' | 'horizontal' | 'vertical' | 'bilateral' | 'radial'
export type MotifOrientation = 'horizontal' | 'vertical' | 'square' | 'corner' | 'free'
export type MotifDensity = 'low' | 'medium' | 'high'
export type MotifCompositionRole =
  | 'anchor'
  | 'corner-decoration'
  | 'frame-accent'
  | 'divider'
  | 'background'
  | 'focal-support'
  | 'texture'

export interface MotifDesignMetadata {
  role?: MotifRole
  styleTags?: string[]
  compatibleStyles?: string[]
  compatibleSectors?: string[]
  visualWeight?: number
  complexity?: number
  symmetry?: MotifSymmetry
  orientation?: MotifOrientation
  preferredRegions?: MotifRegionId[]
  allowedRegions?: MotifRegionId[]
  forbiddenRegions?: MotifRegionId[]
  avoidRegions?: MotifAvoidRegion[]
  minScale?: number
  maxScale?: number
  minOpacity?: number
  maxOpacity?: number
  density?: MotifDensity
  compositionRoles?: MotifCompositionRole[]
  aspectRatio?: number
  primitiveCount?: number
  occupiedAreaRatio?: number
  bboxWidth?: number
  bboxHeight?: number
  /** ingest-derived filename role; never treated as confirmed */
  roleFromFilename?: MotifRole
  source?: 'explicit' | 'inferred' | 'filename' | 'default'
  family?: import('../brain/DesignPlan').MotifFamilyId
  subfamily?: string
}

export type MotifMetaHost = {
  roleGuess: MotifRole
  roleConfirmed?: MotifRole
  complexity: number
  tags: string[]
  sourceName: string
  bbox: BBox
  markup?: string
  design?: MotifDesignMetadata
}

export const DEFAULT_MOTIF_DESIGN: Required<
  Pick<
    MotifDesignMetadata,
    | 'visualWeight'
    | 'complexity'
    | 'symmetry'
    | 'orientation'
    | 'minScale'
    | 'maxScale'
    | 'minOpacity'
    | 'maxOpacity'
    | 'density'
  >
> = {
  visualWeight: 0.45,
  complexity: 8,
  symmetry: 'none',
  orientation: 'free',
  minScale: 0.35,
  maxScale: 1.8,
  minOpacity: 0.28,
  maxOpacity: 0.95,
  density: 'medium',
}

const STYLE_ALIASES: Record<string, string> = {
  artdeco: 'art_deco',
  'art-deco': 'art_deco',
  'art_deco': 'art_deco',
  deco: 'art_deco',
  luxury: 'luxury',
  classic: 'classic',
  vintage: 'vintage',
  geometric: 'geometric',
  modern: 'modern',
  minimal: 'minimal',
  eco: 'eco',
  botanic: 'eco',
  botanical: 'eco',
  organic: 'eco',
  playful: 'playful',
  ornate: 'luxury',
  cosmetic: 'cosmetic',
  perfume: 'perfume',
  cream: 'cream',
}

export function clamp01(n: number): number {
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function resolvedMotifRole(atom: MotifMetaHost): MotifRole {
  return atom.roleConfirmed ?? atom.design?.role ?? atom.roleGuess
}

/** ALLOWED/FORBIDDEN are hard; preferred is only a ranking hint. */
export function atomRegionAllowed(atom: MotifMetaHost, regionId: MotifRegionId): boolean {
  const meta = resolveMotifDesign(atom)
  if (meta.forbiddenRegions?.includes(regionId)) return false
  if (meta.allowedRegions?.length && !meta.allowedRegions.includes(regionId)) return false
  return true
}

/** explicit field-by-field override of inferred/defaults. Empty arrays still win. */
export function mergeMotifDesign(
  inferred: MotifDesignMetadata,
  explicit?: Partial<MotifDesignMetadata>,
): MotifDesignMetadata {
  if (!explicit) return { ...inferred, source: inferred.source ?? 'inferred' }
  const merged: MotifDesignMetadata = { ...inferred }
  for (const [key, value] of Object.entries(explicit) as [keyof MotifDesignMetadata, MotifDesignMetadata[keyof MotifDesignMetadata]][]) {
    if (value !== undefined) {
      ;(merged as Record<string, unknown>)[key as string] = value
    }
  }
  if (explicit.source) merged.source = explicit.source
  else if (!merged.source) merged.source = inferred.source ?? 'inferred'
  return merged
}

function filenameHasToken(n: string, token: string): boolean {
  if (token === 'eco') return /(?:^|[^a-z])eco(?:[^a-z]|$)/.test(n) && !/artdeco|art-deco/.test(n)
  if (token === 'deco') return /art[-_]?deco|artdeco|(?:^|[-_])deco(?:[-_]|$)/.test(n)
  return n.includes(token)
}

export function filenameMotifHints(name: string): Partial<MotifDesignMetadata> {
  const n = name.toLowerCase()
  const styleTags = new Set<string>()
  const compatibleStyles = new Set<string>()
  const compatibleSectors = new Set<string>()
  let roleFromFilename: MotifRole | undefined

  for (const [token, alias] of Object.entries(STYLE_ALIASES)) {
    if (filenameHasToken(n, token)) {
      styleTags.add(alias)
      if (alias === 'art_deco') {
        styleTags.add('artdeco')
        styleTags.add('luxury')
        styleTags.add('geometric')
        compatibleStyles.add('luxury')
        compatibleStyles.add('classic')
      }
      if (alias === 'luxury') compatibleStyles.add('luxury')
      if (alias === 'classic' || alias === 'vintage') {
        compatibleStyles.add('classic')
        compatibleStyles.add('luxury')
      }
      if (alias === 'geometric') {
        compatibleStyles.add('modern')
        compatibleStyles.add('minimal')
      }
      if (alias === 'eco') {
        compatibleStyles.add('eco')
        compatibleStyles.add('minimal')
        compatibleSectors.add('food')
      }
      if (alias === 'modern') compatibleStyles.add('modern')
      if (alias === 'minimal') compatibleStyles.add('minimal')
      if (alias === 'playful') compatibleStyles.add('playful')
      if (alias === 'perfume') compatibleSectors.add('perfume')
      if (alias === 'cosmetic') {
        compatibleSectors.add('cream')
        compatibleSectors.add('perfume')
      }
      if (alias === 'cream') compatibleSectors.add('cream')
    }
  }

  if (/corner/.test(n)) roleFromFilename = 'corner'
  else if (/frame|border/.test(n)) roleFromFilename = 'frame'
  else if (/divider/.test(n)) roleFromFilename = 'divider'
  else if (/band/.test(n)) roleFromFilename = 'band'
  else if (/ornament/.test(n)) roleFromFilename = 'ornament'
  else if (/stamp|crest|seal/.test(n)) roleFromFilename = 'stamp'
  else if (/accent/.test(n)) roleFromFilename = 'accent'

  if (roleFromFilename === 'frame') {
    styleTags.add('frame')
    compatibleStyles.add('luxury')
    compatibleStyles.add('classic')
  }
  if (roleFromFilename === 'corner') styleTags.add('corner')

  const out: Partial<MotifDesignMetadata> = { source: 'filename' }
  if (styleTags.size) out.styleTags = [...styleTags]
  if (compatibleStyles.size) out.compatibleStyles = [...compatibleStyles]
  if (compatibleSectors.size) out.compatibleSectors = [...compatibleSectors]
  if (roleFromFilename) out.roleFromFilename = roleFromFilename
  return out
}

export function visualWeightOf(atom: MotifMetaHost): number {
  const w = resolveMotifDesign(atom).visualWeight
  return w == null ? DEFAULT_MOTIF_DESIGN.visualWeight : clamp01(w)
}

export function resolveMotifDesign(atom: MotifMetaHost): MotifDesignMetadata {
  const inferred = inferMotifDesign(atom)
  return mergeMotifDesign(inferred, atom.design)
}

export function ensureMotifDesign<T extends MotifMetaHost>(atom: T, sheet?: BBox): T {
  const inferred = inferMotifDesign(atom, sheet)
  const design = mergeMotifDesign(inferred, atom.design)
  if (atom.design && designsEquivalent(atom.design, design)) return atom
  return { ...atom, design }
}

function designsEquivalent(a: MotifDesignMetadata, b: MotifDesignMetadata): boolean {
  return a.visualWeight === b.visualWeight && a.role === b.role && a.complexity === b.complexity && a.source === b.source
}

export type MotifInferInput = MotifMetaHost & { sheet?: BBox }

export function inferMotifDesign(atom: MotifInferInput, sheet?: BBox): MotifDesignMetadata {
  const box = atom.bbox
  const sheetBox = sheet ?? atom.sheet
  const ar = box.w / Math.max(0.01, box.h)
  const sheetArea = sheetBox ? Math.max(1, sheetBox.w * sheetBox.h) : Math.max(1, box.w * box.h * 8)
  const occupiedAreaRatio = clamp01((box.w * box.h) / sheetArea)
  const hints = filenameMotifHints(atom.sourceName)
  const structure = markupStructure(atom.markup ?? '')
  const roleGuess = atom.roleGuess
  const cornerLike = isCornerLike(box, sheetBox, roleGuess)
  const frameLike = roleGuess === 'frame' || occupiedAreaRatio > 0.45 && (ar > 1.6 || ar < 0.6)
  const fieldLike = roleGuess === 'field-fill' || occupiedAreaRatio > 0.5 && !cornerLike
  const orientation = guessOrientation(ar, cornerLike, roleGuess)
  const symmetry = guessSymmetry(box, sheetBox, cornerLike)
  const density = guessDensity(occupiedAreaRatio, atom.complexity, structure)
  const role = guessSemanticRole(roleGuess, ar, hints.roleFromFilename, cornerLike, frameLike)
  const visualWeight = computeVisualWeight(occupiedAreaRatio, atom.complexity, density, structure)
  const preferred = preferredRegionsFor(role, box, sheetBox, cornerLike)
  const avoid = avoidRegionsFor(role)
  const compositionRoles = compositionRolesFor(role, fieldLike)

  const inferred: MotifDesignMetadata = {
    role,
    styleTags: unique([...(hints.styleTags ?? []), ...atom.tags.filter((t) => t !== roleGuess)]),
    compatibleStyles: hints.compatibleStyles,
    compatibleSectors: hints.compatibleSectors,
    visualWeight: round2(visualWeight),
    complexity: atom.complexity,
    symmetry,
    orientation,
    preferredRegions: preferred,
    avoidRegions: avoid,
    minScale: DEFAULT_MOTIF_DESIGN.minScale,
    maxScale: DEFAULT_MOTIF_DESIGN.maxScale,
    minOpacity: DEFAULT_MOTIF_DESIGN.minOpacity,
    maxOpacity: DEFAULT_MOTIF_DESIGN.maxOpacity,
    density,
    compositionRoles,
    aspectRatio: round2(ar),
    primitiveCount: atom.complexity,
    occupiedAreaRatio: round2(occupiedAreaRatio),
    bboxWidth: round2(box.w),
    bboxHeight: round2(box.h),
    roleFromFilename: hints.roleFromFilename,
    source: 'inferred',
  }
  return inferred
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))]
}

function markupStructure(markup: string): { filled: boolean; lineHeavy: boolean } {
  if (!markup) return { filled: false, lineHeavy: false }
  const fills = markup.match(/\bfill="([^"]*)"/gi) ?? []
  const none = fills.filter((f) => /none/i.test(f)).length
  const colored = fills.length - none
  const strokes = (markup.match(/\bstroke=/gi) ?? []).length
  return {
    filled: colored > 0 && colored >= none,
    lineHeavy: strokes > colored || (fills.length > 0 && none > colored),
  }
}

function isCornerLike(box: BBox, sheet: BBox | undefined, role: MotifRole): boolean {
  if (role === 'corner') return true
  if (!sheet) return false
  const cx = (box.x + box.w / 2 - sheet.x) / Math.max(1, sheet.w)
  const cy = (box.y + box.h / 2 - sheet.y) / Math.max(1, sheet.h)
  return (
    (cx < 0.22 && cy < 0.22) ||
    (cx > 0.78 && cy < 0.22) ||
    (cx < 0.22 && cy > 0.78) ||
    (cx > 0.78 && cy > 0.78)
  )
}

function guessOrientation(ar: number, cornerLike: boolean, role: MotifRole): MotifOrientation {
  if (role === 'corner' || cornerLike) return 'corner'
  if (ar > 1.45) return 'horizontal'
  if (ar < 0.7) return 'vertical'
  if (Math.abs(ar - 1) < 0.12) return 'square'
  return 'free'
}

function guessSymmetry(box: BBox, sheet: BBox | undefined, cornerLike: boolean): MotifSymmetry {
  if (cornerLike) return 'none'
  if (!sheet) return 'none'
  const cx = (box.x + box.w / 2 - sheet.x) / Math.max(1, sheet.w)
  const cy = (box.y + box.h / 2 - sheet.y) / Math.max(1, sheet.h)
  const ar = box.w / Math.max(0.01, box.h)
  const midX = Math.abs(cx - 0.5) < 0.08
  const midY = Math.abs(cy - 0.5) < 0.08
  if (midX && midY && Math.abs(ar - 1) < 0.12) return 'radial'
  if (midX && midY) return 'bilateral'
  if (midX) return 'vertical'
  if (midY) return 'horizontal'
  return 'none'
}

function guessDensity(
  occupied: number,
  complexity: number,
  structure: { filled: boolean; lineHeavy: boolean },
): MotifDensity {
  if (occupied > 0.32 || complexity > 40 || (structure.filled && occupied > 0.2)) return 'high'
  if (occupied < 0.08 && complexity < 8 && !structure.filled) return 'low'
  return 'medium'
}

function guessSemanticRole(
  roleGuess: MotifRole,
  ar: number,
  fromFile: MotifRole | undefined,
  cornerLike: boolean,
  frameLike: boolean,
): MotifRole {
  if (roleGuess === 'band' && (ar > 3.2 || ar < 0.32)) return 'divider'
  if (fromFile && fromFile === roleGuess) return fromFile
  if (fromFile === 'frame' && (roleGuess === 'frame' || frameLike)) return 'frame'
  if (fromFile === 'corner' && (roleGuess === 'corner' || cornerLike)) return 'corner'
  if (fromFile === 'divider' && roleGuess === 'band') return 'divider'
  return roleGuess
}

function computeVisualWeight(
  occupied: number,
  complexity: number,
  density: MotifDensity,
  structure: { filled: boolean; lineHeavy: boolean },
): number {
  const area = clamp01(occupied / 0.35)
  const cx = clamp01(complexity / 64)
  const dens = density === 'high' ? 1 : density === 'low' ? 0.22 : 0.52
  const fill = structure.filled ? 0.18 : structure.lineHeavy ? 0 : 0.06
  return clamp01(0.28 * area + 0.38 * cx + 0.22 * dens + fill)
}

function preferredRegionsFor(
  role: MotifRole,
  box: BBox,
  sheet: BBox | undefined,
  cornerLike: boolean,
): MotifRegionId[] {
  if (role === 'corner' || cornerLike) {
    if (!sheet) return ['nw', 'ne', 'sw', 'se']
    const cx = (box.x + box.w / 2 - sheet.x) / Math.max(1, sheet.w)
    const cy = (box.y + box.h / 2 - sheet.y) / Math.max(1, sheet.h)
    const id: MotifRegionId = cy < 0.5 ? (cx < 0.5 ? 'nw' : 'ne') : cx < 0.5 ? 'sw' : 'se'
    return [id, 'nw', 'ne', 'sw', 'se']
  }
  if (role === 'band' || role === 'divider') {
    if (!sheet) return ['top', 'bottom']
    const cy = (box.y + box.h / 2 - sheet.y) / Math.max(1, sheet.h)
    const cx = (box.x + box.w / 2 - sheet.x) / Math.max(1, sheet.w)
    if (box.w / Math.max(0.01, box.h) > 1.4) return cy < 0.4 ? ['top'] : cy > 0.6 ? ['bottom'] : ['top', 'bottom']
    return cx < 0.4 ? ['left'] : cx > 0.6 ? ['right'] : ['left', 'right']
  }
  if (role === 'frame') return ['field']
  if (role === 'field-fill') return ['field']
  if (role === 'stamp' || role === 'accent') return ['center', 'top', 'nw', 'ne']
  return ['field', 'nw', 'ne']
}

function avoidRegionsFor(role: MotifRole): MotifAvoidRegion[] {
  if (role === 'corner') return ['center', 'logo', 'product', 'barcode', 'legal']
  if (role === 'stamp' || role === 'accent') return ['barcode', 'legal']
  if (role === 'field-fill' || role === 'frame') return ['logo', 'product', 'barcode', 'legal']
  if (role === 'band' || role === 'divider') return ['barcode', 'legal']
  return ['barcode', 'legal']
}

function compositionRolesFor(role: MotifRole, fieldLike: boolean): MotifCompositionRole[] {
  if (role === 'corner') return ['corner-decoration']
  if (role === 'frame') return ['frame-accent']
  if (role === 'band' || role === 'divider') return ['divider']
  if (role === 'field-fill' || fieldLike) return ['background', 'texture']
  if (role === 'stamp') return ['anchor', 'focal-support']
  if (role === 'accent') return ['focal-support']
  return ['texture']
}

/** Deterministic tie-break (FNV-1a). Never use Math.random. */
export function seedTieBreak(id: string, seed: number): number {
  let h = (Math.imul(seed + 1, 16777619) ^ 2166136261) >>> 0
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}
