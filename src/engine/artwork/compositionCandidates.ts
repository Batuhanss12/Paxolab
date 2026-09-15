/**
 * Phase 2 — 3–5 composition candidates, pre-score, top paint, post-score, winner.
 * Painters stay deterministic: winner slots go through existing paintMotifSlots.
 */
import type { Palette, Panel } from '../../types'
import type { DesignPlan } from '../brain/DesignPlan'
import { computeGeometryMetrics } from '../brain/geometryMetrics'
import { densityCap } from '../brain/CompositionGrammar'
import { decorationBudgetOf } from '../brain/VisualConcept'
import { seedTieBreak, visualWeightOf, resolveMotifDesign, atomRegionAllowed, resolvedMotifRole, type MotifRegionId } from './artMotifMeta'
import { atomFitsConceptFamily, familiesCompatible, motifFamilyOf, motifSubfamilyOf, selectFamilyPool } from './artMotifFamily'
import { atomHasFamilyFile } from './assetCatalog/catalog'
import type { AssetMode } from './assetCatalog/types'
import { familyMatchLevel } from './assetCatalog/familyMatrix'
import type { MotifAtom } from './artMotifAtomizer'
import {
  atomMatchesRole,
  boxesCollide,
  buildDesignRegionMap,
  collectObstacles,
  panelOccupancy,
  rankAtomsForRegion,
  resolveDesignRegion,
  slotKindToRegion,
  type SlotKind,
} from './artDesignRegions'
import {
  buildMotifSlots,
  paintMotifSlots,
  type MotifPaintOpts,
  type MotifRecipeId,
  type MotifSlot,
} from './artMotifCompose'
import { critiqueCandidate, type CandidateCritique } from './compositionCritic'
import {
  allowedStrategies,
  clampScore,
  compositionTargets,
  CUSTOM_STRATEGY_SCALE,
  recipeForStrategy,
  strategyForRecipe,
  strategyUsesStockRecipe,
  weightedTotal,
  COMPOSITION_SCORE_WEIGHTS,
  type CompositionScore,
  type CompositionStrategy,
  type CompositionTargets,
} from './compositionStrategy'
import {
  atomAvoided,
  atomLexiconHits,
  atomMatchesAnyLanguage,
  avoidOf,
  earliestUnusedLexiconIndex,
  unusedLexiconHits,
  poolHasUnusedLexicon,
  conceptFidelityOf,
  languagesOfConcept,
  lexiconOf,
  lockupOverlapVerdict,
  preferredRolesForLanguage,
  visualLanguageOfConcept,
} from './visualLanguage'

export type PlacementCandidate = {
  regionId: string
  role: MotifSlot['role']
  atomId: string
  box: MotifSlot['box']
  opacity: number
  visualWeight: number
}

export type CompositionCandidate = {
  id: string
  strategy: CompositionStrategy
  plan: DesignPlan
  placements: PlacementCandidate[]
  slots: MotifSlot[]
  recipeId: MotifRecipeId
  fingerprint: string
  preScore?: CompositionScore
  postScore?: CompositionScore
  critique?: CandidateCritique
  markup?: string
}

export type CompositionSearchTrace = {
  strategy: CompositionStrategy
  assets: string[]
  scores: CompositionScore
  critic: CandidateCritique['status']
  issues: string[]
  total: number
  decision: 'WINNER' | 'FINALIST' | 'REJECTED' | 'ELIMINATED'
}

export type CompositionSearchDebug = {
  winner?: string
  concept?: {
    id: string
    label?: string
    family?: string
    decorationBudget: number
    spend: number
    winnerFamily?: string
    winnerAssetId?: string
    winnerSubfamily?: string
    familyMatch?: 'EXACT' | 'COMPATIBLE' | 'NONE'
    fallbackMode?: AssetMode
    hardConstraint?: 'PASS' | 'FAILURE'
    styleConsistency?: number
    conceptFidelity?: number
    visualLanguage?: string
    languages?: string[]
    avoid?: string[]
    motifLexicon?: string[]
    roles?: string[]
    regions?: string[]
    critic?: string
  }
  reviewStatus?: 'PASS' | 'NEEDS_REVIEW'
  candidates: CompositionSearchTrace[]
  perf: { generateMs: number; candidateCount: number; paintCount: number; retry?: number }
}

const LOCKUP_MASS = 0.92
const PRODUCT_MASS = 0.9
const HERO_MASS = 0.8

let lastDebug: CompositionSearchDebug | undefined

export function lastCompositionSearch(): CompositionSearchDebug | undefined {
  return lastDebug
}

export function clearCompositionSearch(): void {
  lastDebug = undefined
}

function uniqueAtoms(list: MotifAtom[]): MotifAtom[] {
  const seen = new Set<string>()
  return list.filter((a) => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })
}

function clamp01(n: number): number {
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

function complexity01(atom: MotifAtom): number {
  const raw = resolveMotifDesign(atom).complexity ?? atom.complexity ?? 0
  return clamp01(raw > 1.5 ? raw / 100 : raw)
}

export function decorationSpendOf(slots: MotifSlot[], panel: Panel): number {
  return slots.reduce((n, s) => {
    const meta = resolveMotifDesign(s.atom)
    const area = (s.box.w * s.box.h) / Math.max(1, panel.w * panel.h)
    const occupied = clamp01(meta.occupiedAreaRatio ?? area)
    const cost = clamp01(visualWeightOf(s.atom)) * s.opacity * (0.35 + occupied * 0.8 + complexity01(s.atom) * 0.25)
    return n + cost
  }, 0)
}

function fitSlotToBudget(slot: MotifSlot, panel: Panel, remaining: number): MotifSlot | undefined {
  const minOp = Math.max(0.28, resolveMotifDesign(slot.atom).minOpacity ?? 0.28)
  let opacity = slot.opacity
  while (opacity >= minOp - 1e-6) {
    const fitted = { ...slot, opacity }
    if (decorationSpendOf([fitted], panel) <= remaining + 0.03) return fitted
    opacity = Math.round((opacity - 0.08) * 100) / 100
  }
  return undefined
}

export function applyDecorationBudget(slots: MotifSlot[], panel: Panel, budget: number): MotifSlot[] {
  if (!slots.length) return slots
  const cap = Math.max(0.12, budget)
  const ranked = [...slots].sort((a, b) => {
    const ia = visualWeightOf(a.atom) * (a.role === 'frame' ? 1.15 : a.role === 'corner' ? 1 : 0.85)
    const ib = visualWeightOf(b.atom) * (b.role === 'frame' ? 1.15 : b.role === 'corner' ? 1 : 0.85)
    return ib - ia
  })
  const fittedById = new Map<string, MotifSlot>()
  let spend = 0
  for (const slot of ranked) {
    const fitted = fitSlotToBudget(slot, panel, cap - spend)
    if (!fitted) continue
    fittedById.set(slot.atom.id, fitted)
    spend += decorationSpendOf([fitted], panel)
  }
  return slots.map((s) => fittedById.get(s.atom.id)).filter((s): s is MotifSlot => Boolean(s))
}

function shouldCraftFill(plan: DesignPlan): boolean {
  const id = plan.visualConcept.id
  if (!id || id === 'lux') return false
  return Boolean(plan.visualConcept.family || (plan.visualConcept.languages ?? []).length)
}

/** Target spend floor inside the concept budget. Does not raise the cap. */
export function craftFillFloor(plan: DesignPlan, budget: number): number {
  const cap = Math.max(0.12, budget)
  const id = plan.visualConcept.id
  const langs = languagesOfConcept(plan)
  if (id === 'air-paper') return Math.min(cap, cap * 0.55)
  if (id === 'capsule-field') return Math.min(cap, cap * 0.72)
  if (langs.includes('linear')) return Math.min(cap, cap * 0.7)
  if (id === 'soft-oval') return Math.min(cap, cap * 0.62)
  if (id === 'nocturne-crest' || id === 'heraldic-crest') return Math.min(cap, cap * 0.58)
  if (langs.includes('quiet-line')) return Math.min(cap, cap * 0.55)
  return Math.min(cap, cap * 0.62)
}

function growBox(box: MotifSlot['box'], factor: number, panel: Panel): MotifSlot['box'] {
  const w = box.w * factor
  const h = box.h * factor
  const inset = 1.2
  let x = box.x - (w - box.w) / 2
  let y = box.y - (h - box.h) / 2
  x = Math.max(panel.x + inset, Math.min(x, panel.x + panel.w - w - inset))
  y = Math.max(panel.y + inset, Math.min(y, panel.y + panel.h - h - inset))
  return { x, y, w: Math.min(w, panel.w - inset * 2), h: Math.min(h, panel.h - inset * 2) }
}

/** Raise opacity / box toward the concept floor. Never exceeds the budget cap. */
export function fillDecorationBudget(
  slots: MotifSlot[],
  panel: Panel,
  budget: number,
  plan: DesignPlan,
  opts: MotifPaintOpts = {},
): MotifSlot[] {
  if (!slots.length || !shouldCraftFill(plan)) return slots
  const cap = Math.max(0.12, budget)
  const floor = craftFillFloor(plan, cap)
  let next = slots.map((s) => ({ ...s, box: { ...s.box } }))
  let spend = decorationSpendOf(next, panel)
  if (spend >= floor - 1e-6) return next

  for (let i = 0; i < next.length && spend < floor; i++) {
    const meta = resolveMotifDesign(next[i].atom)
    const maxOp = Math.min(0.92, meta.maxOpacity ?? 0.95)
    if (next[i].opacity >= maxOp - 0.01) continue
    const raised = { ...next[i], opacity: Math.min(maxOp, Math.round((next[i].opacity + 0.1) * 100) / 100) }
    const trial = next.map((s, j) => (j === i ? raised : s))
    const nextSpend = decorationSpendOf(trial, panel)
    if (nextSpend <= cap + 0.02) {
      next = trial
      spend = nextSpend
    }
  }

  const langs = languagesOfConcept(plan)
  const mayGrow =
    opts.kitSuppliesFocal ||
    langs.includes('linear') ||
    plan.visualConcept.id === 'soft-oval' ||
    plan.visualConcept.id === 'earthen-premium'
  if (!mayGrow) return next

  const origin = slots.map((s) => s.box)
  for (let step = 0; step < 3 && spend < floor; step++) {
    let grew = false
    for (let i = 0; i < next.length; i++) {
      const meta = resolveMotifDesign(next[i].atom)
      const grown = growBox(next[i].box, 1.08, panel)
      if (grown.w <= next[i].box.w + 0.05) continue
      if (grown.w > origin[i].w * Math.max(1.22, meta.maxScale ?? 1.2) + 0.2) continue
      if (opts.lockup && lockupOverlapVerdict({ ...next[i], box: grown }, opts.lockup).verdict === 'reject') continue
      if (opts.heroBox && opts.heroBox.w > 0 && boxesCollide(grown, opts.heroBox, 0.35)) continue
      if (next.some((s, j) => j !== i && boxesCollide(grown, s.box, 0.5))) continue
      const trial = next.map((s, j) => (j === i ? { ...s, box: grown } : s))
      const nextSpend = decorationSpendOf(trial, panel)
      if (nextSpend > cap + 0.02) continue
      next = trial
      spend = nextSpend
      grew = true
      if (spend >= floor) break
    }
    if (!grew) break
  }
  return next
}

function atomsForConcept(atoms: MotifAtom[], plan: DesignPlan): MotifAtom[] {
  return selectFamilyPool(atoms, plan.visualConcept.family, plan.visualConcept.supportFamily, plan.visualConcept.id).atoms
}

export function slotsPassFamilyConstraint(slots: MotifSlot[], plan: DesignPlan): boolean {
  if (!plan.visualConcept.family) return true
  return slots.every((s) => atomFitsConceptFamily(s.atom, plan.visualConcept.family, plan.visualConcept.supportFamily))
}

function familyConsistencyOf(slots: MotifSlot[], plan: DesignPlan): number {
  if (!plan.visualConcept.family) return 70
  if (!slots.length) return 80
  const levels = slots.map((s) => familyMatchLevel(motifFamilyOf(s.atom), plan.visualConcept.family, plan.visualConcept.supportFamily))
  if (levels.some((l) => l === 'NONE')) return 0
  if (levels.every((l) => l === 'EXACT')) return 100
  return 50
}

function constrainAtomScale(
  atom: MotifAtom,
  strategy: CompositionStrategy,
  plan?: DesignPlan,
  opts?: MotifPaintOpts,
): MotifAtom {
  const range = CUSTOM_STRATEGY_SCALE[strategy]
  if (!range) return atom
  const meta = resolveMotifDesign(atom)
  let maxScale = Math.min(meta.maxScale ?? 1.8, range.max)
  let minScale = Math.min(maxScale, Math.max(meta.minScale ?? 0.35, range.min))
  if (plan) {
    const langs = languagesOfConcept(plan)
    if (langs.includes('linear') && (strategy === 'asymmetric-editorial' || strategy === 'minimal-accent')) {
      minScale = Math.min(maxScale, Math.max(minScale, 0.7))
      maxScale = Math.max(maxScale, 1.16)
    }
    if (opts?.kitSuppliesFocal && strategy === 'hero-with-support') {
      minScale = Math.min(maxScale, Math.max(minScale, 0.68))
      maxScale = Math.max(maxScale, 1.18)
    }
    if (plan.visualConcept.id === 'soft-oval' && strategy === 'hero-with-support') {
      minScale = Math.min(maxScale, Math.max(minScale, 0.62))
    }
  }
  return { ...atom, design: { ...meta, minScale, maxScale } }
}

export function compositionLayoutFingerprint(strategy: CompositionStrategy, slots: MotifSlot[], panel: Panel): string {
  const kinds = slots
    .map((s) => {
      const cx = (s.box.x + s.box.w / 2 - panel.x) / Math.max(1, panel.w)
      const cy = (s.box.y + s.box.h / 2 - panel.y) / Math.max(1, panel.h)
      const quad = `${cy < 0.45 ? 'n' : 's'}${cx < 0.45 ? 'w' : cx > 0.55 ? 'e' : 'c'}`
      return `${s.role}:${quad}`
    })
    .sort()
    .join('+')
  return `${strategy}|${kinds}`
}

function slotRegionId(slot: MotifSlot, panel: Panel): MotifRegionId {
  const cx = (slot.box.x + slot.box.w / 2 - panel.x) / Math.max(1, panel.w)
  const cy = (slot.box.y + slot.box.h / 2 - panel.y) / Math.max(1, panel.h)
  if (slot.role === 'frame' || (slot.box.w > panel.w * 0.7 && slot.box.h > panel.h * 0.7)) return 'field'
  if (cy < 0.38) return cx < 0.38 ? 'nw' : cx > 0.62 ? 'ne' : 'top'
  if (cy > 0.62) return cx < 0.38 ? 'sw' : cx > 0.62 ? 'se' : 'bottom'
  return cx < 0.38 ? 'left' : cx > 0.62 ? 'right' : 'center'
}

function shrinkAwayFromLockup(
  box: { x: number; y: number; w: number; h: number },
  lockup: { x: number; y: number; w: number; h: number },
): { x: number; y: number; w: number; h: number } {
  const scale = 0.72
  const w = box.w * scale
  const h = box.h * scale
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  const lx = lockup.x + lockup.w / 2
  const ly = lockup.y + lockup.h / 2
  let dx = cx - lx
  let dy = cy - ly
  const len = Math.hypot(dx, dy) || 1
  dx = (dx / len) * 1.8
  dy = (dy / len) * 1.8
  return { x: box.x + (box.w - w) / 2 + dx, y: box.y + (box.h - h) / 2 + dy, w, h }
}

function repairCompositionSlots(slots: MotifSlot[], panel: Panel, opts: MotifPaintOpts): MotifSlot[] {
  const lockup = opts.lockup
  const out: MotifSlot[] = []
  for (const slot of slots) {
    if (!atomRegionAllowed(slot.atom, slotRegionId(slot, panel))) continue
    if (!lockup || lockup.w <= 0) {
      out.push(slot)
      continue
    }
    const first = lockupOverlapVerdict(slot, lockup)
    if (first.verdict === 'ok') {
      out.push(slot)
      continue
    }
    if (first.verdict === 'reject') continue
    const shrunk = { ...slot, box: shrinkAwayFromLockup(slot.box, lockup) }
    const second = lockupOverlapVerdict(shrunk, lockup)
    if (second.verdict === 'ok') out.push(shrunk)
  }
  return out
}

function compositionRoleFit(atom: MotifAtom, strategy: CompositionStrategy): number {
  const roles = resolveMotifDesign(atom).compositionRoles ?? []
  if (strategy === 'hero-with-support' && (roles.includes('anchor') || roles.includes('focal-support'))) return 1
  if (strategy === 'asymmetric-editorial' && (roles.includes('focal-support') || roles.includes('anchor'))) return 1
  if (strategy === 'balanced-corners' && roles.includes('corner-decoration')) return 1
  if (strategy === 'framed-content' && roles.includes('frame-accent')) return 1
  if (strategy === 'minimal-accent' && (roles.includes('focal-support') || roles.includes('texture'))) return 1
  return 0
}

function layoutCustomSlots(
  strategy: CompositionStrategy,
  atoms: MotifAtom[],
  panel: Panel,
  plan: DesignPlan,
  opts: MotifPaintOpts,
): MotifSlot[] {
  const style = opts.style
  const seed = opts.seed ?? 0
  const sector = opts.sector
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
  const stamps = uniqueAtoms([
    ...atoms.filter((a) => atomMatchesRole(a, 'stamp')),
    ...atoms.filter((a) => atomMatchesRole(a, 'ornament')),
    ...atoms.filter((a) => atomMatchesRole(a, 'corner')),
    ...atoms,
  ])
  const slots: MotifSlot[] = []
  const push = (atom: MotifAtom | undefined, kind: SlotKind, opacity: number, lockout: boolean, role: MotifSlot['role']) => {
    if (!atom || slots.some((s) => s.atom.id === atom.id) || slots.length >= 5) return
    const placed = resolveDesignRegion({
      panel,
      kind,
      map,
      atom,
      obstacles: [...obstacles, ...slots.map((s) => ({ id: `slot-${s.atom.id}`, rect: s.box, kind: 'decoration' as const, gap: 0.6 }))],
      safe: opts.safe,
      allowLockupOverlap: false,
    })
    if (placed.rejected || placed.rect.w < 0.4 || placed.rect.h < 0.4) return
    const meta = resolveMotifDesign(atom)
    const op = Math.min(meta.maxOpacity ?? 0.95, Math.max(0.28, meta.minOpacity ?? 0.28, opacity))
    slots.push({ atom, box: placed.rect, opacity: op, par: 'xMidYMid meet', lockout, role })
  }
  const usedTokens = () => [...(opts.kitLexiconUsed ?? []), ...slots.flatMap((s) => atomLexiconHits(s.atom, lexiconOf(plan)))]
  const pick = (pool: MotifAtom[], kind: SlotKind, n: number, salt: number) => {
    const region = slotKindToRegion(kind)
    const allowed = pool.filter((a) => atomRegionAllowed(a, region) && !slots.some((s) => s.atom.id === a.id))
    const languages = languagesOfConcept(plan)
    const lexicon = lexiconOf(plan)
    const avoid = avoidOf(plan)
    const used = usedTokens()
    const ranked = rankAtomsForRegion(allowed, region, seed + salt, style, sector)
    const roles = preferredRolesForLanguage(languages[0])
    return [...ranked].sort((a, b) => {
      const va = atomAvoided(a, avoid) ? 1 : 0
      const vb = atomAvoided(b, avoid) ? 1 : 0
      if (va !== vb) return va - vb
      const novA = unusedLexiconHits(a, lexicon, used).length
      const novB = unusedLexiconHits(b, lexicon, used).length
      const fa = atomHasFamilyFile(a) ? 1 : 0
      const fb = atomHasFamilyFile(b) ? 1 : 0
      if (fa !== fb && (novA > 0 || novB > 0)) return fb - fa
      if (novA !== novB) return novB - novA
      const ia = earliestUnusedLexiconIndex(a, lexicon, used)
      const ib = earliestUnusedLexiconIndex(b, lexicon, used)
      if (ia !== ib) return ia - ib
      const ha = atomMatchesAnyLanguage(a, languages) ? 1 : 0
      const hb = atomMatchesAnyLanguage(b, languages) ? 1 : 0
      if (ha !== hb) return hb - ha
      if (roles.length) {
        const ra = roles.includes(resolvedMotifRole(a)) ? 1 : 0
        const rb = roles.includes(resolvedMotifRole(b)) ? 1 : 0
        if (ra !== rb) return rb - ra
      }
      const ca = compositionRoleFit(a, strategy)
      const cb = compositionRoleFit(b, strategy)
      if (ca !== cb) return cb - ca
      return 0
    }).slice(0, n)
  }
  const ranged = (atom: MotifAtom | undefined) => (atom ? constrainAtomScale(atom, strategy, plan, opts) : undefined)
  const tryPush = (pool: MotifAtom[], kind: SlotKind, salt: number, opacity: number, lockout: boolean, role: MotifSlot['role']) => {
    for (const atom of pick(pool, kind, 8, salt)) {
      const before = slots.length
      push(ranged(atom), kind, opacity, lockout, role)
      if (slots.length > before) return
    }
  }

  const heroX = plan.composition.heroZone.x ?? 0.5
  const canCompanion = (pool: MotifAtom[]) => poolHasUnusedLexicon(pool, lexiconOf(plan), usedTokens())
  if (strategy === 'minimal-accent') {
    const kind: SlotKind = heroX >= 0.55 ? 'nw' : 'ne'
    tryPush(stamps, kind, 1, 0.72, false, 'accent')
  } else if (strategy === 'asymmetric-editorial') {
    const kinds: SlotKind[] = heroX >= 0.5 ? ['nw', 'sw'] : ['ne', 'se']
    tryPush(stamps, kinds[0], 2, 0.76, false, 'corner')
    if (canCompanion(stamps)) tryPush(stamps, kinds[1], 3, 0.7, true, 'stamp')
    if (decorationBudgetOf(plan) >= 0.32) {
      const bands = uniqueAtoms([
        ...atoms.filter((a) => atomMatchesRole(a, 'band')),
        ...atoms.filter((a) => atomMatchesRole(a, 'accent')),
        ...atoms.filter((a) => atomMatchesRole(a, 'divider')),
        ...stamps,
      ])
      if (canCompanion(bands)) tryPush(bands, 'band-bottom', 6, 0.64, true, 'accent')
    }
  } else if (strategy === 'hero-with-support') {
    if (!opts.kitSuppliesFocal) {
      tryPush(stamps, 'hero-stamp', 3, 0.8, false, 'stamp')
    }
    const support: SlotKind = heroX >= 0.5 ? 'nw' : 'ne'
    const supportOp = opts.kitSuppliesFocal ? 0.84 : 0.7
    if (canCompanion(stamps) || opts.kitSuppliesFocal) tryPush(stamps, support, 4, supportOp, false, 'corner')
    if (opts.kitSuppliesFocal && decorationBudgetOf(plan) >= 0.24) {
      const bands = uniqueAtoms([
        ...atoms.filter((a) => atomMatchesRole(a, 'band')),
        ...atoms.filter((a) => atomMatchesRole(a, 'accent')),
        ...atoms.filter((a) => atomMatchesRole(a, 'divider')),
        ...stamps,
      ])
      const otherTop: SlotKind = support === 'nw' ? 'ne' : 'nw'
      const unused = (pool: MotifAtom[]) =>
        pool.filter((atom) => unusedLexiconHits(atom, lexiconOf(plan), usedTokens()).length > 0)
      if (canCompanion(stamps)) tryPush(unused(stamps), otherTop, 8, 0.78, false, 'corner')
      if (canCompanion(bands)) tryPush(unused(bands), 'band-bottom', 7, 0.74, true, 'accent')
    }
  }
  return slots
}

function buildCandidateSlots(
  strategy: CompositionStrategy,
  atoms: MotifAtom[],
  panel: Panel,
  plan: DesignPlan,
  opts: MotifPaintOpts,
): MotifSlot[] {
  if (strategyUsesStockRecipe(strategy)) {
    return buildMotifSlots(recipeForStrategy(strategy), atoms, panel, opts.style, opts.seed ?? 0, opts)
  }
  return layoutCustomSlots(strategy, atoms, panel, plan, opts)
}

function occupancyRatio(panel: Panel, opts: MotifPaintOpts, slots: MotifSlot[]): number {
  const occ = panelOccupancy({
    panel,
    lockup: opts.lockup,
    hero: opts.heroBox,
    goldBar: opts.goldBar,
    decorations: slots.map((s) => s.box),
  })
  return occ.occupancy
}

function weightedCentroid(
  panel: Panel,
  opts: MotifPaintOpts,
  slots: MotifSlot[],
): { x: number; y: number; balance: number } {
  let mass = 0
  let mx = 0
  let my = 0
  const add = (box: { x: number; y: number; w: number; h: number }, w: number) => {
    if (w <= 0 || box.w <= 0) return
    const cx = box.x + box.w / 2
    const cy = box.y + box.h / 2
    mass += w
    mx += cx * w
    my += cy * w
  }
  if (opts.lockup) add(opts.lockup, LOCKUP_MASS * (opts.lockup.w * opts.lockup.h))
  if (opts.heroBox) add(opts.heroBox, HERO_MASS * (opts.heroBox.w * opts.heroBox.h))
  for (const slot of slots) {
    add(slot.box, visualWeightOf(slot.atom) * slot.opacity * slot.box.w * slot.box.h)
  }
  if (mass <= 0) return { x: 0.5, y: 0.5, balance: 0.5 }
  const x = (mx / mass - panel.x) / Math.max(1, panel.w)
  const y = (my / mass - panel.y) / Math.max(1, panel.h)
  const balance = Math.max(0, 1 - (Math.abs(x - 0.5) + Math.abs(y - 0.5)))
  return { x, y, balance }
}

function pairStyleScore(a: MotifAtom, b: MotifAtom, lexicon: string[] = []): number {
  const da = resolveMotifDesign(a)
  const db = resolveMotifDesign(b)
  const tagsA = new Set([...(da.styleTags ?? []), ...a.tags])
  const tagsB = new Set([...(db.styleTags ?? []), ...b.tags])
  let score = 48
  let overlap = 0
  for (const t of tagsA) if (tagsB.has(t)) overlap += 1
  score += Math.min(28, overlap * 7)
  const deco = (tags: Set<string>) => [...tags].some((t) => /artdeco|art_deco/.test(t))
  const eco = (tags: Set<string>) => [...tags].some((t) => /eco|botanic|leaf/.test(t))
  if ((deco(tagsA) && eco(tagsB)) || (eco(tagsA) && deco(tagsB))) score -= 42
  const fa = motifFamilyOf(a)
  const fb = motifFamilyOf(b)
  if (fa === fb) score += 10
  else if (familiesCompatible(fa, fb)) score += 3
  else score -= 16
  if (da.compatibleStyles?.length && db.compatibleStyles?.length) {
    const hit = da.compatibleStyles.some((s) => db.compatibleStyles!.includes(s))
    score += hit ? 12 : -22
  }
  if (lexicon.length) {
    const hitsA = atomLexiconHits(a, lexicon)
    const hitsB = atomLexiconHits(b, lexicon)
    const distinct = new Set([...hitsA, ...hitsB])
    if (hitsA.length && hitsB.length && distinct.size >= 2) score += 8
  }
  return clampScore(score)
}

export function scoreCompositionSlots(
  strategy: CompositionStrategy,
  slots: MotifSlot[],
  panel: Panel,
  plan: DesignPlan,
  opts: MotifPaintOpts,
  targets: CompositionTargets,
  markup?: string,
): CompositionScore {
  const occ = occupancyRatio(panel, opts, slots)
  const negative = 1 - occ
  const centroid = weightedCentroid(panel, opts, slots)
  const decoWeights = slots.map((s) => visualWeightOf(s.atom) * s.opacity)
  const maxDeco = decoWeights.reduce((n, v) => Math.max(n, v), 0)
  const densityLoad = slots.reduce((n, s) => {
    const meta = resolveMotifDesign(s.atom)
    const area = s.box.w * s.box.h
    return n + area * s.opacity * visualWeightOf(s.atom) * (1 + (meta.complexity ?? s.atom.complexity) / 80)
  }, 0)
  const densityRatio = densityLoad / Math.max(1, panel.w * panel.h)
  const cap = densityCap(plan.style, plan.decor.density)

  let collision = 100
  for (const slot of slots) {
    const lock = lockupOverlapVerdict(slot, opts.lockup)
    if (lock.verdict === 'reject') collision = Math.min(collision, 8)
    else if (lock.verdict === 'modify') collision = Math.min(collision, 48)
    if (opts.heroBox && opts.heroBox.w > 0 && boxesCollide(slot.box, opts.heroBox, 0.35)) collision = Math.min(collision, 12)
  }

  const hierarchy = clampScore(100 - Math.max(0, maxDeco - 0.42) * 220 - Math.max(0, maxDeco - PRODUCT_MASS + 0.2) * 80)
  const airGap = targets.whitespaceTarget - negative
  const whitespace = clampScore(airGap > 0 ? 100 - airGap * 320 : 100 - Math.abs(airGap) * 90)
  const wantSym = targets.symmetryTarget >= 0.6
  const balance = clampScore(
    wantSym ? centroid.balance * 100 : 100 - Math.abs(centroid.balance - targets.balanceTarget) * 90,
  )
  let styleConsistency = 70
  if (slots.length >= 2) {
    let pair = 0
    let n = 0
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        pair += pairStyleScore(slots[i].atom, slots[j].atom, targets.motifLexicon ?? lexiconOf(plan))
        n += 1
      }
    }
    styleConsistency = n ? pair / n : 70
  } else if (slots[0]) {
    const tags = resolveMotifDesign(slots[0].atom).styleTags ?? []
    const botanicalConcept =
      plan.visualConcept.family === 'botanical' || plan.visualConcept.family === 'harvest'
    if (
      plan.style === 'luxury' &&
      !botanicalConcept &&
      tags.some((t) => t === 'artdeco' || t === 'art_deco' || t === 'luxury')
    ) {
      styleConsistency = 86
    }
    if (tags.some((t) => /eco|botanic/.test(t)) && (plan.style === 'luxury' || plan.style === 'classic')) {
      styleConsistency = botanicalConcept ? Math.max(styleConsistency, 84) : 38
    }
  }
  if (plan.visualConcept.family && slots.length) {
    const fit = slots.filter((s) => atomFitsConceptFamily(s.atom, plan.visualConcept.family, plan.visualConcept.supportFamily)).length
    if (fit / slots.length < 0.5) styleConsistency = Math.min(styleConsistency, 34)
    else if (fit === slots.length) styleConsistency = Math.min(100, styleConsistency + 8)
  }
  const decorationDensity = clampScore(100 - Math.abs(densityRatio - targets.densityTarget) * 280 - Math.max(0, slots.length - cap) * 8)
  const familyConsistency = familyConsistencyOf(slots, plan)
  let assetCompatibility = styleConsistency
  if (slots.length >= 2) assetCompatibility = styleConsistency
  if (familyConsistency <= 0) assetCompatibility = Math.min(assetCompatibility, 8)
  const alignment = slots.length ? 86 : 50
  const roles = new Set(slots.map((s) => s.role))
  const sheets = new Set(slots.map((s) => s.atom.sheetId))
  let rhythm = 62
  if (strategy === 'balanced-corners' && slots.filter((s) => s.role === 'corner').length >= 2) rhythm = 90
  if (strategy === 'asymmetric-editorial') {
    const sideSlots = slots.filter((s) => s.box.w < panel.w * 0.45)
    const nw = sideSlots.some((s) => s.box.x < panel.x + panel.w * 0.4)
    const ne = sideSlots.some((s) => s.box.x > panel.x + panel.w * 0.55)
    rhythm = nw && ne ? 36 : 84
  }
  if (sheets.size >= 3 && slots.length >= 3) rhythm -= 18
  if (roles.size === 1 && slots.length >= 2 && densityRatio <= targets.densityTarget + 0.12) rhythm += 8
  rhythm = clampScore(rhythm)
  const crowded = airGap > 0.12
  const decorationDensityAdj = crowded ? Math.min(decorationDensity, 42) : decorationDensity
  const productionSafety = collision < 20 ? 10 : slots.length ? 88 : 40
  const geo = markup ? computeGeometryMetrics(markup, panel) : undefined
  const geoBalance = geo ? clampScore(geo.balance * 100) : balance
  const conceptFidelity = clampScore(conceptFidelityOf(slots, plan, opts.kitLexiconUsed))

  const parts = {
    hierarchy,
    balance: markup ? (balance * 0.45 + geoBalance * 0.55) : balance,
    whitespace: markup && geo ? clampScore(whitespace * 0.6 + (1 - geo.coverage) * 100 * 0.4) : whitespace,
    styleConsistency: clampScore(styleConsistency),
    familyConsistency: clampScore(familyConsistency),
    decorationDensity: decorationDensityAdj,
    assetCompatibility: clampScore(assetCompatibility),
    conceptFidelity,
    alignment,
    rhythm,
    collisionSafety: collision,
    productionSafety,
  }
  let total = weightedTotal(parts)
  if (targets.whitespaceTarget >= 0.6 && airGap > 0.15) total = clampScore(total - 16 - airGap * 20)
  if (strategy === targets.compositionBias) total = clampScore(total + 2.4)
  if (strategy === 'framed-content') total = clampScore(total - Math.round((1 - targets.framePreference) * 10))
  return { ...parts, total }
}

function placementsOf(slots: MotifSlot[], panel: Panel): PlacementCandidate[] {
  return slots.map((s) => ({
    regionId: slotKindToRegion(
      s.box.x < panel.x + panel.w * 0.35
        ? s.box.y < panel.y + panel.h * 0.4
          ? 'nw'
          : 'sw'
        : s.role === 'frame'
          ? 'frame'
          : 'ne',
    ),
    role: s.role,
    atomId: s.atom.id,
    box: s.box,
    opacity: s.opacity,
    visualWeight: visualWeightOf(s.atom),
  }))
}

function applyAdjustments(score: CompositionScore, critique: CandidateCritique): CompositionScore {
  const next = { ...score }
  for (const adj of critique.scoreAdjustments) {
    const key = adj.topic as keyof Omit<CompositionScore, 'total'>
    if (!(key in COMPOSITION_SCORE_WEIGHTS)) continue
    next[key] = clampScore(next[key] + adj.delta)
  }
  if (critique.status === 'REJECT') {
    next.collisionSafety = Math.min(next.collisionSafety, 12)
    next.productionSafety = Math.min(next.productionSafety, 12)
  }
  next.total = weightedTotal(next)
  return next
}

function tieBreak(a: CompositionCandidate, b: CompositionCandidate, seed: number): number {
  const issuesA = a.critique?.issues.length ?? 0
  const issuesB = b.critique?.issues.length ?? 0
  if (issuesA !== issuesB) return issuesA - issuesB
  const h = (a.postScore ?? a.preScore)?.hierarchy ?? 0
  const hb = (b.postScore ?? b.preScore)?.hierarchy ?? 0
  if (Math.abs(h - hb) >= 1) return hb - h
  const w = (a.postScore ?? a.preScore)?.whitespace ?? 0
  const wb = (b.postScore ?? b.preScore)?.whitespace ?? 0
  if (Math.abs(w - wb) >= 1) return wb - w
  const da = a.slots.length
  const db = b.slots.length
  if (da !== db) return da - db
  return seedTieBreak(a.id, seed) - seedTieBreak(b.id, seed)
}

export function chooseCompositionWinner(candidates: CompositionCandidate[], seed: number, plan?: DesignPlan): CompositionCandidate | undefined {
  const keep = candidates.filter((c) => {
    if (c.critique?.status === 'REJECT') return false
    if (plan && c.slots.length && !slotsPassFamilyConstraint(c.slots, plan)) return false
    return true
  })
  if (!keep.length) return undefined
  return [...keep].sort((a, b) => {
    const sa = a.postScore?.total ?? a.preScore?.total ?? 0
    const sb = b.postScore?.total ?? b.preScore?.total ?? 0
    if (Math.abs(sa - sb) >= 0.8) return sb - sa
    return tieBreak(a, b, seed)
  })[0]
}

export function generateCompositionCandidates(input: {
  panel: Panel
  atoms: MotifAtom[]
  plan: DesignPlan
  opts: MotifPaintOpts
  palette: Palette
}): CompositionCandidate[] {
  void input.palette
  const { panel, plan, opts } = input
  const atoms = atomsForConcept(input.atoms, plan)
  if (!atoms.length) return []
  const budget = decorationBudgetOf(plan)
  const strategies = allowedStrategies(plan)
  const seen = new Set<string>()
  const out: CompositionCandidate[] = []
  for (const strategy of strategies) {
    const raw = buildCandidateSlots(strategy, atoms, panel, plan, opts)
    const filled = fillDecorationBudget(raw, panel, budget, plan, opts)
    const slots = repairCompositionSlots(
      applyDecorationBudget(filled, panel, budget).filter((s) =>
        atomFitsConceptFamily(s.atom, plan.visualConcept.family, plan.visualConcept.supportFamily),
      ),
      panel,
      opts,
    )
    if (!slots.length) continue
    if (strategy === 'framed-content' && !slots.some((s) => s.role === 'frame')) continue
    if (!slotsPassFamilyConstraint(slots, plan)) continue
    const fp = compositionLayoutFingerprint(strategy, slots, panel)
    if (seen.has(fp)) continue
    seen.add(fp)
    out.push({
      id: `${strategy}:${recipeForStrategy(strategy)}`,
      strategy,
      plan,
      slots,
      recipeId: recipeForStrategy(strategy),
      fingerprint: fp,
      placements: placementsOf(slots, panel),
    })
  }
  return out
}

function emptyScore(): CompositionScore {
  return {
    hierarchy: 0,
    balance: 0,
    whitespace: 0,
    styleConsistency: 0,
    familyConsistency: 0,
    decorationDensity: 0,
    assetCompatibility: 0,
    conceptFidelity: 0,
    alignment: 0,
    rhythm: 0,
    collisionSafety: 0,
    productionSafety: 0,
    total: 0,
  }
}

export function selectMotifComposition(input: {
  panel: Panel
  palette: Palette
  atoms: MotifAtom[]
  plan: DesignPlan
  opts: MotifPaintOpts
  forcedRecipe?: MotifRecipeId
}): { markup: string; recipeId: MotifRecipeId; slots: MotifSlot[]; winner?: CompositionCandidate } {
  const started = Date.now()
  const { panel, palette, plan, opts } = input
  const scoped = selectFamilyPool(input.atoms, plan.visualConcept.family, plan.visualConcept.supportFamily, plan.visualConcept.id)
  const atoms = scoped.atoms
  if (!atoms.length) {
    lastDebug = {
      concept: {
        id: plan.visualConcept.id,
        label: plan.visualConcept.label,
        family: plan.visualConcept.family,
        decorationBudget: decorationBudgetOf(plan),
        spend: 0,
        fallbackMode: plan.visualConcept.family ? 'typography-only' : 'none',
        familyMatch: 'NONE',
        hardConstraint: 'PASS',
        critic: 'KEEP',
      },
      reviewStatus: 'PASS',
      candidates: [],
      perf: { generateMs: 0, candidateCount: 0, paintCount: 0, retry: 0 },
    }
    return { markup: '', recipeId: 'stamp-field', slots: [] }
  }

  if (input.forcedRecipe) {
    const paintedSlots = buildMotifSlots(input.forcedRecipe, atoms, panel, opts.style, opts.seed ?? 0, opts).filter((s) =>
      atomFitsConceptFamily(s.atom, plan.visualConcept.family, plan.visualConcept.supportFamily),
    )
    if (!paintedSlots.length) {
      lastDebug = {
        concept: {
          id: plan.visualConcept.id,
          label: plan.visualConcept.label,
          family: plan.visualConcept.family,
          decorationBudget: decorationBudgetOf(plan),
          spend: 0,
          fallbackMode: 'typography-only',
          familyMatch: 'NONE',
          hardConstraint: 'PASS',
          critic: 'KEEP',
        },
        reviewStatus: 'PASS',
        candidates: [],
        perf: { generateMs: Date.now() - started, candidateCount: 0, paintCount: 0, retry: 0 },
      }
      return { markup: '', recipeId: input.forcedRecipe, slots: [] }
    }
    const markupForced = paintMotifSlots(paintedSlots, panel, palette, input.forcedRecipe)
    const atom0 = paintedSlots[0].atom
    lastDebug = {
      winner: input.forcedRecipe,
      concept: {
        id: plan.visualConcept.id,
        label: plan.visualConcept.label,
        family: plan.visualConcept.family,
        decorationBudget: decorationBudgetOf(plan),
        spend: decorationSpendOf(paintedSlots, panel),
        winnerFamily: motifFamilyOf(atom0),
        winnerAssetId: atom0.id,
        winnerSubfamily: motifSubfamilyOf(atom0),
        familyMatch: familyMatchLevel(motifFamilyOf(atom0), plan.visualConcept.family, plan.visualConcept.supportFamily),
        fallbackMode: scoped.fallbackMode,
        hardConstraint: slotsPassFamilyConstraint(paintedSlots, plan) ? 'PASS' : 'FAILURE',
        critic: 'KEEP',
      },
      reviewStatus: slotsPassFamilyConstraint(paintedSlots, plan) ? 'PASS' : 'NEEDS_REVIEW',
      candidates: [
        {
          strategy: strategyForRecipe(input.forcedRecipe),
          assets: paintedSlots.map((s) => s.atom.id),
          scores: emptyScore(),
          critic: 'KEEP',
          issues: [],
          total: 0,
          decision: 'WINNER',
        },
      ],
      perf: { generateMs: Date.now() - started, candidateCount: 1, paintCount: 1, retry: 0 },
    }
    return { markup: markupForced, recipeId: input.forcedRecipe, slots: paintedSlots }
  }

  const targets: CompositionTargets = compositionTargets(plan, opts.style)
  const regions = buildDesignRegionMap({
    panel,
    lockup: opts.lockup ?? opts.safe,
    hero: opts.heroBox,
    goldBar: opts.goldBar,
    safe: opts.safe,
  })

  let pool = atoms
  let winner: CompositionCandidate | undefined
  let candidates: CompositionCandidate[] = []
  let top: CompositionCandidate[] = []
  let paintCount = 0
  let retry = 0
  while (retry < 3) {
    candidates = generateCompositionCandidates({ panel, atoms: pool, plan, opts, palette })
    for (const c of candidates) {
      c.preScore = scoreCompositionSlots(c.strategy, c.slots, panel, plan, opts, targets)
      c.critique = critiqueCandidate({
        slots: c.slots,
        lockup: opts.lockup,
        heroBox: opts.heroBox,
        targets,
        score: c.preScore,
        regions,
        plan,
        panel,
      })
      c.preScore = applyAdjustments(c.preScore, c.critique)
    }
    const viable = candidates.filter((c) => c.critique?.status !== 'REJECT' && slotsPassFamilyConstraint(c.slots, plan))
    const ranked = [...viable].sort((a, b) => {
      const sa = a.preScore?.total ?? 0
      const sb = b.preScore?.total ?? 0
      if (Math.abs(sa - sb) >= 0.8) return sb - sa
      return tieBreak(a, b, opts.seed ?? 0)
    })
    top = ranked.slice(0, Math.min(3, ranked.length))
    for (const c of top) {
      c.markup = paintMotifSlots(c.slots, panel, palette, c.recipeId)
      paintCount += 1
      c.postScore = scoreCompositionSlots(c.strategy, c.slots, panel, plan, opts, targets, c.markup)
      c.critique = critiqueCandidate({
        slots: c.slots,
        lockup: opts.lockup,
        heroBox: opts.heroBox,
        targets,
        score: c.postScore,
        regions,
        plan,
        panel,
      })
      c.postScore = applyAdjustments(c.postScore, c.critique)
    }
    winner = chooseCompositionWinner(top, opts.seed ?? 0, plan)
    if (winner && slotsPassFamilyConstraint(winner.slots, plan) && winner.critique?.status !== 'REJECT') break
    const used = new Set((winner?.slots ?? top.flatMap((c) => c.slots)).map((s) => s.atom.id))
    const rest = pool.filter((a) => !used.has(a.id))
    const langs = languagesOfConcept(plan)
    const better = langs.length ? rest.filter((a) => atomMatchesAnyLanguage(a, langs)) : []
    pool = better.length ? better : rest
    winner = undefined
    retry += 1
    if (!pool.length) break
  }

  const familyOk = Boolean(winner && slotsPassFamilyConstraint(winner.slots, plan))
  if (winner && !familyOk) winner = undefined
  const fallbackMode: AssetMode = winner ? scoped.fallbackMode : 'typography-only'
  const markup = winner?.markup ?? (winner ? paintMotifSlots(winner.slots, panel, palette, winner.recipeId) : '')
  const winnerAtom = winner?.slots[0]?.atom
  const familyMatch = winnerAtom
    ? familyMatchLevel(motifFamilyOf(winnerAtom), plan.visualConcept.family, plan.visualConcept.supportFamily)
    : 'NONE'
  const hardPass = !winner || familyOk
  lastDebug = {
    winner: winner?.strategy,
    concept: {
      id: plan.visualConcept.id,
      label: plan.visualConcept.label,
      family: plan.visualConcept.family,
      decorationBudget: decorationBudgetOf(plan),
      spend: winner ? decorationSpendOf(winner.slots, panel) : 0,
      winnerFamily: winnerAtom ? motifFamilyOf(winnerAtom) : undefined,
      winnerAssetId: winnerAtom?.id,
      winnerSubfamily: winnerAtom ? motifSubfamilyOf(winnerAtom) : undefined,
      familyMatch: winner ? familyMatch : 'NONE',
      fallbackMode,
      hardConstraint: hardPass ? 'PASS' : 'FAILURE',
      styleConsistency: winner?.postScore?.styleConsistency ?? winner?.preScore?.styleConsistency,
      conceptFidelity: winner?.postScore?.conceptFidelity ?? winner?.preScore?.conceptFidelity,
      visualLanguage: visualLanguageOfConcept(plan),
      languages: languagesOfConcept(plan),
      avoid: avoidOf(plan),
      motifLexicon: lexiconOf(plan),
      roles: winner?.slots.map((s) => s.role),
      regions: winner?.slots.map((s) => slotRegionId(s, panel)),
      critic: winner?.critique?.status ?? (fallbackMode === 'typography-only' ? 'KEEP' : 'REJECT'),
    },
    reviewStatus: hardPass ? 'PASS' : 'NEEDS_REVIEW',
    candidates: candidates.map((c) => {
      const score = c.postScore ?? c.preScore
      let decision: CompositionSearchTrace['decision'] = 'ELIMINATED'
      if (c.critique?.status === 'REJECT') decision = 'REJECTED'
      else if (winner && c.id === winner.id) decision = 'WINNER'
      else if (top.some((t) => t.id === c.id)) decision = 'FINALIST'
      return {
        strategy: c.strategy,
        assets: c.slots.map((s) => s.atom.id),
        scores: score ?? emptyScore(),
        critic: c.critique?.status ?? 'KEEP',
        issues: (c.critique?.issues ?? []).map((i) => i.topic),
        total: score?.total ?? 0,
        decision,
      }
    }),
    perf: { generateMs: Date.now() - started, candidateCount: candidates.length, paintCount, retry },
  }

  return {
    markup,
    recipeId: winner?.recipeId ?? 'stamp-field',
    slots: winner?.slots ?? [],
    winner,
  }
}
