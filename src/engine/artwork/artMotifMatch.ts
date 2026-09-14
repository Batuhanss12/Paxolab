/**
 * Phase 15-B — score motif-bank atoms against brief (sector × mood × color).
 * Prefers 1–2 sheets so a face is not a collage of unrelated vocabularies.
 */
import type { StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
import { colorFamilyOf, parseBriefColors, type ColorFamily } from './briefPalette'
import { loadArtPatternLibrary, usableArtPatterns } from './artPatternLibrary'
import { atomsForEntry } from './artMotifBank'
import { isWeakSheet, type MotifAtom } from './artMotifAtomizer'
import { moodPrior, type MoodId } from '../brain/moodPriors'
import { resolveMotifDesign, resolvedMotifRole, seedTieBreak, visualWeightOf } from './artMotifMeta'

export type MotifMatchQuery = {
  mood: MoodId | StyleType | ''
  sector: SectorId | string
  colors: string
  seed?: number
  sheetId?: string
  maxAtoms?: number
}

export type MotifMatchResult = {
  atoms: MotifAtom[]
  sheetIds: string[]
  scores: { id: string; sheetId: string; score: number }[]
}

export type MotifSheetVocab = {
  moods: MoodId[]
  sectors: string[]
  tags: string[]
  color: ColorFamily | 'ornate' | 'geometric'
}

type SheetVocab = MotifSheetVocab

const SKIP_IDS = new Set(['22', '68', '252'])

const SHEET_VOCAB: Record<string, SheetVocab> = {
  'islamic-border-new-2': {
    moods: ['luxury', 'classic'],
    sectors: ['perfume', 'cream'],
    tags: ['classic', 'border', 'ornate', 'frame'],
    color: 'ornate',
  },
  'artdeco-frame': {
    moods: ['luxury', 'classic'],
    sectors: ['perfume', 'cream'],
    tags: ['artdeco', 'frame', 'geometric', 'classic'],
    color: 'dark-metal',
  },
  artdeco2: {
    moods: ['luxury', 'classic', 'modern'],
    sectors: ['perfume', 'electronics'],
    tags: ['artdeco', 'geometric'],
    color: 'dark-metal',
  },
  'art-deco-pattern-gold-black-166': {
    moods: ['luxury', 'classic'],
    sectors: ['perfume'],
    tags: ['artdeco', 'geometric', 'classic'],
    color: 'dark-metal',
  },
  '588vintage': {
    moods: ['classic', 'eco', 'playful'],
    sectors: ['food', 'cream'],
    tags: ['vintage', 'classic'],
    color: 'warm',
  },
  pattern16: {
    moods: ['modern', 'minimal', 'playful'],
    sectors: ['electronics', 'generic', 'serum'],
    tags: ['geometric'],
    color: 'geometric',
  },
  '2106-m04-i036-n002': {
    moods: ['modern', 'minimal', 'classic'],
    sectors: ['serum', 'cream', 'generic'],
    tags: ['band', 'border'],
    color: 'light',
  },
  '47122': {
    moods: ['luxury', 'classic'],
    sectors: ['perfume', 'cream'],
    tags: ['ornate', 'stamp'],
    color: 'ornate',
  },
  '7f15fe79-4e1d-4526-b211-fe6dd617e458': {
    moods: ['luxury', 'classic', 'playful'],
    sectors: ['perfume', 'food'],
    tags: ['ornament', 'stamp'],
    color: 'ornate',
  },
}

function vocabFor(sheetId: string, tags: string[], sourceName: string): SheetVocab {
  if (SHEET_VOCAB[sheetId]) return SHEET_VOCAB[sheetId]
  const hit = Object.entries(SHEET_VOCAB).find(([id]) => sheetId.startsWith(id) || id.startsWith(sheetId.slice(0, 8)))
  if (hit) return hit[1]
  const blob = `${sheetId} ${sourceName} ${tags.join(' ')}`.toLowerCase()
  if (/artdeco|art-deco|gold-black/.test(blob)) return SHEET_VOCAB['artdeco-frame']
  if (/islamic|border/.test(blob)) return SHEET_VOCAB['islamic-border-new-2']
  if (/vintage/.test(blob)) return SHEET_VOCAB['588vintage']
  if (/leaf|botanic|organic|palm/.test(blob)) {
    return { moods: ['eco', 'minimal', 'classic'], sectors: ['food', 'cream'], tags: ['eco', 'botanical'], color: 'botanical' }
  }
  if (/geometric|pattern/.test(blob)) return SHEET_VOCAB.pattern16
  return {
    moods: [],
    sectors: [],
    tags: tags.length ? tags : ['misc'],
    color: 'ornate',
  }
}

function colorAlign(family: ColorFamily, vocab: ColorFamily | 'ornate' | 'geometric'): number {
  if (family === 'dark-metal' && (vocab === 'dark-metal' || vocab === 'ornate')) return 4
  if (family === 'botanical' && (vocab === 'botanical' || vocab === 'warm')) return 4
  if (family === 'light' && (vocab === 'light' || vocab === 'geometric')) return 3
  if (family === 'warm' && (vocab === 'warm' || vocab === 'botanical' || vocab === 'ornate')) return 2
  if (family === 'dark-metal' && vocab === 'geometric') return 1
  if (family === 'botanical' && vocab === 'ornate') return 0
  if (family === 'light' && vocab === 'dark-metal') return 0
  return 1
}

export function scoreAtom(
  atom: MotifAtom,
  query: MotifMatchQuery,
  vocab: SheetVocab,
  family: ColorFamily,
): number {
  const mood = (query.mood || 'luxury') as MoodId
  const prior = moodPrior(mood)
  const meta = resolveMotifDesign(atom)
  const role = resolvedMotifRole(atom)
  const weight = visualWeightOf(atom)
  let score = 0

  if (meta.compatibleStyles?.length && !meta.compatibleStyles.includes(mood)) score -= 6
  else if (vocab.moods.includes(mood)) score += 5
  else score -= 1
  if (meta.compatibleStyles?.includes(mood)) score += 4

  const sector = String(query.sector || 'generic')
  if (meta.compatibleSectors?.length) {
    if (meta.compatibleSectors.includes(sector)) score += 3
    else if (!meta.compatibleSectors.includes('generic')) score -= 3
  } else if (vocab.sectors.includes(sector)) score += 3
  else if (vocab.sectors.includes('generic') && (sector === 'generic' || !vocab.sectors.length)) score += 0.5

  score += colorAlign(family, vocab.color)
  for (const tag of atom.tags) {
    if (vocab.tags.includes(tag) || tag === mood) score += 1
  }
  for (const tag of meta.styleTags ?? []) {
    if (tag === mood) score += 2
    if (vocab.tags.includes(tag)) score += 0.5
  }
  if (
    (mood === 'luxury' || mood === 'classic') &&
    (meta.styleTags ?? []).some((t) => t === 'artdeco' || t === 'art_deco')
  ) {
    score += 3
  }
  if (mood === 'luxury' && (role === 'frame' || role === 'corner')) score += 2
  if (mood === 'minimal' && (role === 'corner' || role === 'stamp' || role === 'accent')) score += 2
  if (mood === 'modern' && (role === 'band' || role === 'divider')) score += 2
  if (mood === 'eco' && atom.tags.some((t) => /eco|botanic|leaf/.test(t))) score += 3
  if (prior.fieldSparse > 0.7 && atom.complexity > 40) score -= 2
  if (prior.ornament < 0.15 && role === 'field-fill') score -= 3
  if ((mood === 'minimal' || prior.fieldSparse > 0.85) && weight > 0.72) score -= 8
  if (prior.density === 'sparse' && weight > 0.9) score -= 6
  return score
}

function collectAtoms(sheetId?: string): { atom: MotifAtom; vocab: SheetVocab }[] {
  const entries = usableArtPatterns(loadArtPatternLibrary()).filter((e) => !SKIP_IDS.has(e.id) && (!sheetId || e.id === sheetId))
  const out: { atom: MotifAtom; vocab: SheetVocab }[] = []
  for (const entry of entries) {
    const atoms = atomsForEntry(entry)
    if (isWeakSheet(entry, atoms) || !atoms.length) continue
    const vocab = vocabFor(entry.id, entry.tags, entry.sourceName)
    for (const atom of atoms) out.push({ atom, vocab })
  }
  return out
}

export function matchMotifs(query: MotifMatchQuery): MotifMatchResult {
  const family = colorFamilyOf(parseBriefColors(query.colors))
  const pool = collectAtoms(query.sheetId)
  const empty: MotifMatchResult = { atoms: [], sheetIds: [], scores: [] }
  if (!pool.length) return empty

  const seed = query.seed ?? 0
  const scored = pool
    .map(({ atom, vocab }) => ({
      atom,
      vocab,
      score: scoreAtom(atom, query, vocab, family),
    }))
    .sort((a, b) => {
      const d = b.score - a.score
      if (Math.abs(d) >= 0.12) return d > 0 ? 1 : -1
      const ta = seedTieBreak(a.atom.id, seed)
      const tb = seedTieBreak(b.atom.id, seed)
      return ta === tb ? a.atom.id.localeCompare(b.atom.id) : ta - tb
    })

  const bySheet = new Map<string, number>()
  for (const row of scored) {
    const cur = bySheet.get(row.atom.sheetId) ?? 0
    bySheet.set(row.atom.sheetId, Math.max(cur, row.score))
  }
  const rankedSheets = [...bySheet.entries()].sort((a, b) => b[1] - a[1])
  const primary = rankedSheets[0]?.[0]
  const secondary =
    rankedSheets[1] && rankedSheets[0] && rankedSheets[1][1] >= rankedSheets[0][1] * 0.78 ? rankedSheets[1][0] : undefined

  const max = Math.min(5, Math.max(2, query.maxAtoms ?? 4))
  const picked: MotifAtom[] = []
  const used = new Set<string>()
  const takeFrom = (sheetId: string | undefined, count: number) => {
    if (!sheetId) return
    for (const row of scored) {
      if (picked.length >= count) break
      if (row.atom.sheetId !== sheetId || used.has(row.atom.id)) continue
      used.add(row.atom.id)
      picked.push(row.atom)
    }
  }
  takeFrom(primary, Math.min(max, 4))
  if (secondary && picked.length < max) takeFrom(secondary, max)

  const sheetIds = [...new Set(picked.map((a) => a.sheetId))]
  return {
    atoms: picked,
    sheetIds,
    scores: scored.slice(0, 12).map((row) => ({ id: row.atom.id, sheetId: row.atom.sheetId, score: row.score })),
  }
}
