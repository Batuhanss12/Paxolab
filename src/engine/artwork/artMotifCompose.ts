/**
 * Phase 14-C — Recipe composer using motif atoms (not full-sheet wallpaper).
 * 2–5 slots, lockout under lockup, field opacity ≥ 0.28, stamps 0.55–0.95.
 * Phase 1: slotBox stays; placement goes through region resolve + AABB collision.
 */
import type { Palette, Panel, StyleType } from '../../types'
import type { SafeRect } from './patternMotifs'
import { type ArtPatternEntry, loadArtPatternLibrary } from './artPatternLibrary'
import { atomsForEntry, type MotifAtom, type MotifRole } from './artMotifBank'
import { isWeakSheet } from './artMotifAtomizer'
import {
  atomMatchesRole,
  buildDesignRegionMap,
  collectObstacles,
  rankAtomsForRegion,
  resolveDesignRegion,
  slotBox,
  slotKindToRegion,
  type SlotKind,
} from './artDesignRegions'
import { motifFamilyOf, motifSubfamilyOf } from './artMotifFamily'
import { isRetiredOverlayId, rejectRetiredOverlayAtoms } from './assetCatalog/retiredOverlay'
import { atomRegionAllowed, resolveMotifDesign } from './artMotifMeta'
import { compareAssetPick } from './assetLanguage'
import {
  atomLexiconHits,
  isDecorativeFrame,
  type VisualLanguage,
} from './visualLanguage'

export type MotifRecipeId = 'luxury-frame' | 'stamp-field' | 'band-story' | 'corner-deco'

export type MotifSlot = {
  atom: MotifAtom
  box: { x: number; y: number; w: number; h: number }
  opacity: number
  par: 'xMidYMid meet' | 'xMidYMid slice'
  lockout: boolean
  role: MotifRole
}

export type MotifRecipePaint = {
  id: MotifRecipeId
  keepHero: boolean
  slots: MotifSlot[]
  markup: string
}

export type MotifPaintOpts = {
  safe?: SafeRect
  style?: StyleType | string
  seed?: number
  recipeId?: MotifRecipeId
  lockup?: SafeRect
  heroBox?: SafeRect
  goldBar?: boolean
  sector?: string
  languages?: VisualLanguage[]
  avoid?: string[]
  motifLexicon?: string[]
  kitLexiconUsed?: string[]
  kitSuppliesFocal?: boolean
  preferredRoles?: MotifRole[]
}

const FIELD_OP: Record<string, number> = {
  minimal: 0.3,
  modern: 0.32,
  luxury: 0.34,
  classic: 0.34,
  eco: 0.3,
  playful: 0.32,
}

function tint(svg: string, accent: string): string {
  return svg.replace(/currentColor/g, accent)
}

function hrefOf(svg: string, accent: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(tint(svg, accent), 'utf8').toString('base64')}`
}

/** Kept as the seed-order fallback. Rank-by-score is preferred at slot fill. */
function pick<T>(items: T[], seed: number, count: number): T[] {
  if (!items.length || count <= 0) return []
  const out: T[] = []
  const used = new Set<number>()
  for (let i = 0; i < items.length && out.length < count; i++) {
    const idx = (((seed + i * 5) % items.length) + items.length) % items.length
    if (used.has(idx)) continue
    used.add(idx)
    out.push(items[idx])
  }
  for (let i = 0; i < items.length && out.length < count; i++) {
    if (used.has(i)) continue
    used.add(i)
    out.push(items[i])
  }
  return out
}

function byRole(atoms: MotifAtom[], role: MotifRole): MotifAtom[] {
  return atoms.filter((a) => atomMatchesRole(a, role))
}

export function resolveMotifRecipeId(
  atoms: MotifAtom[],
  style?: StyleType | string,
  seed = 0,
): MotifRecipeId {
  const luxury = style === 'luxury' || style === 'classic'
  const corners = byRole(atoms, 'corner')
  const bands = byRole(atoms, 'band')
  const frames = byRole(atoms, 'frame')
  if (luxury && (frames.length || corners.length >= 2)) {
    return seed % 2 === 0 && (frames.length || corners.length >= 2) ? 'luxury-frame' : 'corner-deco'
  }
  if (corners.length >= 2 && (style === 'minimal' || style === 'modern')) return 'corner-deco'
  if (bands.length) return 'band-story'
  return 'stamp-field'
}

function pickForSlot(
  atoms: MotifAtom[],
  kind: SlotKind,
  seed: number,
  style: string | undefined,
  sector: string | undefined,
  count: number,
  opts: MotifPaintOpts = {},
  used: MotifAtom[] = [],
): MotifAtom[] {
  const region = slotKindToRegion(kind)
  const usedIds = new Set(used.map((a) => a.id))
  const allowed = atoms.filter((a) => atomRegionAllowed(a, region) && !usedIds.has(a.id))
  if (!allowed.length) return []
  const ranked = rankAtomsForRegion(allowed, region, seed, style, sector)
  const lexicon = opts.motifLexicon ?? []
  const avoid = opts.avoid ?? []
  const langs = opts.languages ?? []
  const roles = opts.preferredRoles ?? []
  const usedTokens = [...(opts.kitLexiconUsed ?? []), ...used.flatMap((atom) => atomLexiconHits(atom, lexicon))]
  if (!lexicon.length && !avoid.length && !langs.length && !roles.length) return ranked.slice(0, count)
  const policy = { languages: langs, lexicon, avoid, roles }
  return [...ranked]
    .sort((a, b) => compareAssetPick(a, b, policy, usedTokens))
    .slice(0, count)
}

export function buildMotifSlots(
  recipe: MotifRecipeId,
  atoms: MotifAtom[],
  panel: Panel,
  style: string | undefined,
  seed: number,
  opts: MotifPaintOpts,
): MotifSlot[] {
  atoms = rejectRetiredOverlayAtoms(atoms)
  if (!atoms.length) return []
  const fieldOp = FIELD_OP[style ?? 'luxury'] ?? 0.32
  const stamps = [...byRole(atoms, 'stamp'), ...byRole(atoms, 'ornament'), ...atoms]
  const unique = (list: MotifAtom[]) => {
    const seen = new Set<string>()
    return list.filter((a) => {
      if (seen.has(a.id)) return false
      seen.add(a.id)
      return true
    })
  }
  const corners = unique([...byRole(atoms, 'corner'), ...stamps])
  const bands = unique([...byRole(atoms, 'band'), ...stamps])
  const frames = unique([...byRole(atoms, 'frame'), ...byRole(atoms, 'field-fill')])
  const map = buildDesignRegionMap({
    panel,
    lockup: opts.lockup ?? opts.safe,
    hero: opts.heroBox,
    goldBar: opts.goldBar,
    safe: opts.safe,
  })
  const obstacles = collectObstacles({
    panel,
    lockup: opts.lockup ?? opts.safe,
    hero: opts.heroBox,
    goldBar: opts.goldBar,
    safe: opts.safe,
  })
  const sector = opts.sector
  const slots: MotifSlot[] = []

  const push = (atom: MotifAtom | undefined, kind: SlotKind, opacity: number, lockout: boolean, role: MotifRole) => {
    if (!atom || slots.some((s) => s.atom.id === atom.id) || slots.length >= 5) return
    const placed = resolveDesignRegion({
      panel,
      kind,
      map,
      atom,
      obstacles: [
        ...obstacles,
        ...slots.map((s) => ({ id: `slot-${s.atom.id}`, rect: s.box, kind: 'decoration' as const, gap: 0.6 })),
      ],
      safe: opts.safe,
      allowLockupOverlap: kind === 'frame' && isDecorativeFrame(atom, 'frame'),
    })
    if (placed.rejected || placed.rect.w < 0.4 || placed.rect.h < 0.4) return
    const meta = resolveMotifDesign(atom)
    const op = Math.min(meta.maxOpacity ?? 0.95, Math.max(0.28, meta.minOpacity ?? 0.28, opacity))
    slots.push({ atom, box: placed.rect, opacity: op, par: 'xMidYMid meet', lockout, role })
  }

  const placed = () => slots.map((s) => s.atom)
  if (recipe === 'luxury-frame') {
    push(pickForSlot(frames, 'frame', seed, style, sector, 1, opts, placed())[0], 'frame', 0.42, true, 'frame')
    push(pickForSlot(corners, 'nw', seed + 1, style, sector, 1, opts, placed())[0], 'nw', 0.78, false, 'corner')
    push(pickForSlot(corners, 'ne', seed + 2, style, sector, 1, opts, placed())[0], 'ne', 0.78, false, 'corner')
    if (slots.length < 2) {
      push(pickForSlot(unique(stamps), 'nw', seed + 3, style, sector, 1, opts, placed())[0], 'nw', 0.74, false, 'stamp')
      push(pickForSlot(unique(stamps), 'ne', seed + 4, style, sector, 1, opts, placed())[0], 'ne', 0.74, false, 'stamp')
    }
  } else if (recipe === 'corner-deco') {
    push(pickForSlot(corners, 'nw', seed, style, sector, 1, opts, placed())[0], 'nw', 0.8, false, 'corner')
    push(pickForSlot(corners, 'ne', seed + 1, style, sector, 1, opts, placed())[0], 'ne', 0.8, false, 'corner')
    if (slots.length < 3) {
      push(pickForSlot(unique(stamps), 'sw', seed + 4, style, sector, 1, opts, placed())[0], 'sw', 0.62, true, 'stamp')
    }
  } else if (recipe === 'band-story') {
    push(pickForSlot(bands, 'band-top', seed, style, sector, 1, opts, placed())[0], 'band-top', 0.62, true, 'band')
    push(pickForSlot(unique(stamps), 'sw', seed + 3, style, sector, 1, opts, placed())[0], 'sw', 0.7, true, 'stamp')
    push(pickForSlot(unique(stamps), 'se', seed + 4, style, sector, 1, opts, placed())[0], 'se', 0.7, true, 'stamp')
  } else {
    const kinds: SlotKind[] = ['nw', 'ne', 'sw', 'hero-stamp']
    for (let i = 0; i < Math.min(4, Math.max(2, atoms.length)); i++) {
      const atom = pickForSlot(unique(stamps), kinds[i] ?? 'se', seed + i, style, sector, 1, opts, placed())[0]
      push(atom, kinds[i] ?? 'se', i === 2 ? fieldOp + 0.28 : 0.72, true, 'stamp')
    }
  }

  if (!slots.length && atoms[0]) push(atoms[0], 'hero-stamp', 0.8, false, 'stamp')
  if (!slots.length && atoms[0]) {
    const fallback = pick(atoms, seed, 1)[0]
    const box = slotBox(panel, 'nw', opts.safe)
    if (fallback && box.w >= 0.4) {
      slots.push({ atom: fallback, box, opacity: 0.8, par: 'xMidYMid meet', lockout: true, role: 'stamp' })
    }
  }
  return slots.slice(0, 5)
}

export function paintMotifSlots(slots: MotifSlot[], panel: Panel, p: Palette, recipe: MotifRecipeId): string {
  return slots
    .filter((slot) => !isRetiredOverlayId(slot.atom.id) && !isRetiredOverlayId(slot.atom.sheetId) && !isRetiredOverlayId(slot.atom.sourceName))
    .map((slot) => {
      const clip = slot.lockout && panel.id ? ` clip-path="url(#lockout-${panel.id})"` : ''
      const family = motifFamilyOf(slot.atom)
      const sub = motifSubfamilyOf(slot.atom) ?? ''
      return `<image data-art="art-pattern-compose" data-motif-atom="${slot.atom.id}" data-motif-role="${slot.role}" data-motif-family="${family}" data-motif-subfamily="${sub}" data-library-recipe="${recipe}" x="${slot.box.x.toFixed(2)}" y="${slot.box.y.toFixed(2)}" width="${slot.box.w.toFixed(2)}" height="${slot.box.h.toFixed(2)}" href="${hrefOf(slot.atom.markup, p.accent)}" opacity="${slot.opacity}" preserveAspectRatio="${slot.par}"${clip} />`
    })
    .join('')
}

export function paintMotifRecipeFromAtoms(
  panel: Panel,
  p: Palette,
  atoms: MotifAtom[],
  opts: MotifPaintOpts = {},
): MotifRecipePaint {
  const empty: MotifRecipePaint = { id: 'stamp-field', keepHero: true, slots: [], markup: '' }
  atoms = rejectRetiredOverlayAtoms(atoms)
  if (!atoms.length) return empty
  const recipe = opts.recipeId ?? resolveMotifRecipeId(atoms, opts.style, opts.seed ?? 0)
  const slots = buildMotifSlots(recipe, atoms, panel, opts.style, opts.seed ?? 0, opts)
  return {
    id: recipe,
    keepHero: true,
    slots,
    markup: paintMotifSlots(slots, panel, p, recipe),
  }
}

export function paintMotifRecipe(
  panel: Panel,
  p: Palette,
  entry: ArtPatternEntry,
  opts: MotifPaintOpts = {},
): MotifRecipePaint {
  if (entry.skipReason || isRetiredOverlayId(entry.id)) return { id: 'stamp-field', keepHero: true, slots: [], markup: '' }
  const atoms = atomsForEntry(entry)
  if (isWeakSheet(entry, atoms)) return { id: 'stamp-field', keepHero: true, slots: [], markup: '' }
  return paintMotifRecipeFromAtoms(panel, p, atoms, opts)
}

export function paintMotifRecipeById(
  panel: Panel,
  p: Palette,
  sheetId: string,
  opts: MotifPaintOpts = {},
): MotifRecipePaint {
  const entry = loadArtPatternLibrary().find((item) => item.id === sheetId)
  if (!entry || isRetiredOverlayId(sheetId)) return { id: 'stamp-field', keepHero: true, slots: [], markup: '' }
  return paintMotifRecipe(panel, p, entry, opts)
}

export { slotBox, pick }
