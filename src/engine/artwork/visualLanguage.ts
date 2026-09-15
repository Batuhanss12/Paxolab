/**
 * Visual language + lockup clearance helpers for Phase 2.1.
 * Binds to existing concept tags, family, role, subfamily — not a new vocabulary table.
 */
import { axisGap } from '../designSystem/artBox'
import { bboxIntersectionArea } from './artMotifGeom'
import {
  resolveMotifDesign,
  type MotifMetaHost,
  type MotifRole,
} from './artMotifMeta'

export type VisualLanguage = 'oval' | 'organic' | 'geometric' | 'linear' | 'botanical' | 'heraldic' | 'art-deco' | 'quiet-line'

export type LockupOverlapVerdict = 'ok' | 'modify' | 'reject'

type SlotLike = {
  atom: MotifMetaHost & { id?: string; sheetId?: string; sourceName: string }
  box: { x: number; y: number; w: number; h: number }
  role: MotifRole
}

const LANGS: VisualLanguage[] = ['oval', 'organic', 'geometric', 'linear', 'botanical', 'heraldic', 'art-deco', 'quiet-line']

type ConceptPlan = {
  visualConcept: {
    id?: string
    tags?: string[]
    family?: string
    languages?: string[]
    avoid?: string[]
    motifLexicon?: string[]
  }
  visualIntent?: string
}

function inferLanguage(plan: ConceptPlan): VisualLanguage | undefined {
  const id = (plan.visualConcept.id ?? '').toLowerCase()
  const tags = (plan.visualConcept.tags ?? []).join(' ').toLowerCase()
  const family = plan.visualConcept.family
  const blob = `${id} ${tags}`
  if (id === 'soft-oval' || /\boval\b/.test(blob)) return 'oval'
  if (family === 'botanical' || family === 'harvest' || /olive|leaf|botanic|earthen|grove/.test(blob)) return 'botanical'
  if (family === 'heraldic' || /crest|herald|nocturne|cartouche/.test(blob)) return 'heraldic'
  if (id === 'air-paper' || family === 'quiet-line') return 'quiet-line'
  if (family === 'linear-tech' || /glyph|stripe|index/.test(blob)) return 'linear'
  if (family === 'geometric-deco' || /artdeco|art-deco|foil/.test(blob)) return 'art-deco'
  if (family === 'ornate-stamp') return 'organic'
  return family && LANGS.includes(family as VisualLanguage) ? (family as VisualLanguage) : undefined
}

/** Concept row wins; regex family/id is fallback only. */
export function languagesOfConcept(plan: ConceptPlan): VisualLanguage[] {
  const declared = (plan.visualConcept.languages ?? []).filter((item): item is VisualLanguage =>
    LANGS.includes(item as VisualLanguage),
  )
  if (declared.length) return declared
  const fallback = inferLanguage(plan)
  return fallback ? [fallback] : []
}

export function visualLanguageOfConcept(plan: ConceptPlan): VisualLanguage | undefined {
  return languagesOfConcept(plan)[0]
}

export function avoidOf(plan: ConceptPlan): string[] {
  return plan.visualConcept.avoid ?? []
}

export function lexiconOf(plan: ConceptPlan): string[] {
  return plan.visualConcept.motifLexicon ?? []
}

function atomSearchBlob(atom: MotifMetaHost & { id?: string; sheetId?: string }): string {
  const meta = resolveMotifDesign(atom)
  return `${atom.id ?? ''} ${atom.sheetId ?? ''} ${atom.sourceName} ${meta.subfamily ?? ''} ${(meta.styleTags ?? []).join(' ')} ${atom.tags.join(' ')} ${meta.family ?? ''}`.toLowerCase()
}

export function atomLexiconHits(atom: MotifMetaHost & { id?: string; sheetId?: string }, lexicon: string[]): string[] {
  if (!lexicon.length) return []
  const blob = atomSearchBlob(atom)
  return lexicon.filter((token) => token && blob.includes(token.toLowerCase()))
}

export function atomLexiconHit(atom: MotifMetaHost & { id?: string; sheetId?: string }, lexicon: string[]): boolean {
  return atomLexiconHits(atom, lexicon).length > 0
}

export function unusedLexiconHits(
  atom: MotifMetaHost & { id?: string; sheetId?: string },
  lexicon: string[],
  used: Iterable<string>,
): string[] {
  const seen = new Set(used)
  return atomLexiconHits(atom, lexicon).filter((token) => !seen.has(token))
}

export function poolHasUnusedLexicon(
  atoms: Array<MotifMetaHost & { id?: string; sheetId?: string }>,
  lexicon: string[],
  used: Iterable<string>,
): boolean {
  if (!lexicon.length) return true
  return atoms.some((atom) => unusedLexiconHits(atom, lexicon, used).length > 0)
}

export function earliestUnusedLexiconIndex(
  atom: MotifMetaHost & { id?: string; sheetId?: string },
  lexicon: string[],
  used: Iterable<string>,
): number {
  const unused = unusedLexiconHits(atom, lexicon, used)
  if (!unused.length) return lexicon.length + 1
  return Math.min(...unused.map((token) => lexicon.indexOf(token)))
}

export function atomAvoided(atom: MotifMetaHost & { id?: string; sheetId?: string }, avoid: string[]): boolean {
  if (!avoid.length) return false
  const blob = atomSearchBlob(atom)
  const meta = resolveMotifDesign(atom)
  const role = meta.role
  for (const token of avoid) {
    if (token === 'generic-ticks' && /ticks|corner-mark/.test(blob) && !/oval|capsule|ring/.test(blob)) return true
    if (
      token === 'sharp-corner' &&
      (role === 'corner' || /corner-mark|corner-l|corner-r/.test(blob)) &&
      !/oval|organic|olive|leaf/.test(blob)
    ) {
      return true
    }
    if (token === 'ornate-seal' && (/\bseal\b/.test(blob) || /islamic/.test(blob))) return true
    if (token === 'heavy-frame' && (role === 'frame' || role === 'field-fill') && (meta.visualWeight ?? 0) >= 0.28) return true
    if (token === 'botanical' && (meta.family === 'botanical' || meta.family === 'harvest' || /olive|leaf|botanic/.test(blob))) {
      return true
    }
    if (token === 'generic-corners' && role === 'corner' && !atomLexiconHit(atom, ['crest', 'ribbon', 'cartouche', 'olive'])) {
      return true
    }
  }
  return false
}

export function preferredRolesForLanguage(language?: VisualLanguage): MotifRole[] {
  if (language === 'oval') return ['stamp', 'accent']
  if (language === 'botanical') return ['corner', 'accent', 'band']
  if (language === 'heraldic') return ['stamp', 'corner', 'frame']
  if (language === 'quiet-line') return ['corner', 'accent', 'frame']
  if (language === 'linear') return ['band', 'divider', 'accent']
  if (language === 'art-deco') return ['frame', 'corner', 'stamp']
  return []
}

export function atomVisualLanguages(atom: MotifMetaHost & { id?: string; sheetId?: string }): VisualLanguage[] {
  const meta = resolveMotifDesign(atom)
  const blob = `${atom.id ?? ''} ${atom.sheetId ?? ''} ${atom.sourceName} ${meta.subfamily ?? ''} ${(meta.styleTags ?? []).join(' ')} ${atom.tags.join(' ')} ${meta.family ?? ''}`.toLowerCase()
  const out = new Set<VisualLanguage>()
  if (/oval|capsule|ring|soft-oval/.test(blob)) out.add('oval')
  if (/olive|leaf|stem|botanic|harvest/.test(blob)) out.add('botanical')
  if (/crest|ribbon|cartouche|herald|double-line/.test(blob)) out.add('heraldic')
  if (/hairline|quiet|ticks|rule|paper-grain|corner-mark/.test(blob) || meta.family === 'quiet-line') out.add('quiet-line')
  if (/artdeco|art[-_]?deco|geometric-deco/.test(blob)) out.add('art-deco')
  if (/grid|tech|glyph|lattice|pattern16/.test(blob) || meta.family === 'linear-tech') out.add('linear')
  if (/organic|grain|vintage/.test(blob)) out.add('organic')
  if (/geometric/.test(blob)) out.add('geometric')
  if (meta.family === 'botanical' || meta.family === 'harvest') out.add('botanical')
  if (meta.family === 'heraldic') out.add('heraldic')
  return [...out]
}

function languageAlign(got: VisualLanguage[], wanted?: VisualLanguage): number {
  if (!wanted) return 70
  if (got.includes(wanted)) return 100
  if (wanted === 'oval' && got.includes('quiet-line') && !got.includes('oval')) return 28
  if (wanted === 'quiet-line' && (got.includes('oval') || got.includes('linear'))) return 62
  if (wanted === 'botanical' && got.includes('quiet-line')) return 48
  if (wanted === 'heraldic' && got.includes('art-deco')) return 55
  if (wanted === 'art-deco' && got.includes('heraldic')) return 55
  if (!got.length) return 50
  return 34
}

export function conceptFidelityOf(slots: SlotLike[], plan: ConceptPlan): number {
  const wanted = languagesOfConcept(plan)
  const lexicon = lexiconOf(plan)
  const avoid = avoidOf(plan)
  if (!wanted.length && !lexicon.length) return 70
  if (!slots.length) return 62
  const primary = wanted[0]
  const scores = slots.map((s) => {
    const got = atomVisualLanguages(s.atom)
    let align = languageAlign(got, primary)
    if (wanted.slice(1).some((lang) => got.includes(lang))) align = Math.min(100, align + 6)
    return align
  })
  const mean = scores.reduce((n, v) => n + v, 0) / scores.length
  const anyExact = scores.some((s) => s >= 96)
  const allWeak = scores.every((s) => s <= 40)
  let score = anyExact ? Math.min(100, mean + 8) : allWeak ? Math.min(mean, 36) : mean

  const hitTokens = new Set<string>()
  let avoided = 0
  for (const slot of slots) {
    for (const token of atomLexiconHits(slot.atom, lexicon)) hitTokens.add(token)
    if (atomAvoided(slot.atom, avoid)) avoided += 1
  }
  if (lexicon.length && hitTokens.size === 0) score = Math.min(score, 40)
  else if (hitTokens.size >= 2) score = Math.min(100, score + 6)
  else if (hitTokens.size === 1) score = Math.min(100, score + 3)
  if (lexicon.length >= 2 && slots.length >= 2) {
    const primaries = slots
      .map((slot) => {
        const hits = atomLexiconHits(slot.atom, lexicon)
        if (!hits.length) return ''
        return hits.reduce((best, token) => (lexicon.indexOf(token) < lexicon.indexOf(best) ? token : best))
      })
      .filter(Boolean)
    const counts = new Map<string, number>()
    for (const token of primaries) counts.set(token, (counts.get(token) ?? 0) + 1)
    const stacked = Math.max(0, ...counts.values())
    if (stacked >= 2) score = Math.min(score, 68)
  }
  if (avoided) score = Math.max(0, score - avoided * 12)

  const id = plan.visualConcept.id ?? ''
  const tags = (plan.visualConcept.tags ?? []).join(' ')
  const oneHero = /one-hero|nocturne/.test(`${id} ${tags}`)
  if (oneHero && lexicon.includes('crest')) {
    const hasCrest = slots.some((s) => atomLexiconHits(s.atom, ['crest']).length > 0)
    if (!hasCrest) score = Math.min(score, 48)
  }

  return Math.round(Math.max(0, Math.min(100, score)))
}

export function isSolidFocalMotif(atom: MotifMetaHost & { id?: string; sheetId?: string }, role: MotifRole): boolean {
  const blob = `${atom.id ?? ''} ${atom.sheetId ?? ''} ${atom.sourceName} ${atom.design?.subfamily ?? ''}`.toLowerCase()
  if (/crest|seal|cartouche|shield/.test(blob)) return true
  if (role === 'stamp' || role === 'ornament') return true
  const meta = resolveMotifDesign(atom)
  if ((meta.occupiedAreaRatio ?? 0) > 0.38 && !isDecorativeFrame(atom, role)) return true
  const markup = atom.markup ?? ''
  const fills = markup.match(/\bfill="([^"]*)"/gi) ?? []
  const colored = fills.filter((f) => !/none/i.test(f)).length
  if (colored > 0 && /crest|seal|stamp/.test(blob)) return true
  return false
}

export function isDecorativeFrame(atom: MotifMetaHost & { id?: string; sheetId?: string }, role: MotifRole): boolean {
  const blob = `${atom.id ?? ''} ${atom.sheetId ?? ''} ${atom.sourceName} ${atom.design?.subfamily ?? ''}`.toLowerCase()
  if (/hairline|quiet-rule|double-line|ticks/.test(blob)) return true
  if (role !== 'frame' && role !== 'corner') return false
  if (/crest|seal|cartouche|shield/.test(blob)) return false
  const meta = resolveMotifDesign(atom)
  return (meta.visualWeight ?? 1) <= 0.22
}

export function lockupCoverageRatio(
  slot: { x: number; y: number; w: number; h: number },
  lockup: { x: number; y: number; w: number; h: number },
): number {
  return bboxIntersectionArea(slot, lockup) / Math.max(1, lockup.w * lockup.h)
}

export function frameSurroundsLockup(
  slot: { x: number; y: number; w: number; h: number },
  lockup: { x: number; y: number; w: number; h: number },
  minInset = 1.2,
): boolean {
  return (
    slot.w > lockup.w * 1.12 &&
    slot.h > lockup.h * 1.12 &&
    slot.x + minInset <= lockup.x &&
    slot.y + minInset <= lockup.y &&
    slot.x + slot.w >= lockup.x + lockup.w + minInset &&
    slot.y + slot.h >= lockup.y + lockup.h + minInset
  )
}

export function lockupOverlapVerdict(
  slot: SlotLike,
  lockup?: { x: number; y: number; w: number; h: number },
): { verdict: LockupOverlapVerdict; coverage: number; clearance: number; solid: boolean } {
  if (!lockup || lockup.w <= 0) return { verdict: 'ok', coverage: 0, clearance: 99, solid: false }
  const coverage = lockupCoverageRatio(slot.box, lockup)
  const clearance = axisGap({ id: 'slot', ...slot.box }, { id: 'lockup', ...lockup })
  const solid = isSolidFocalMotif(slot.atom, slot.role) || (slot.role === 'frame' && /crest|seal|cartouche/.test(`${slot.atom.id ?? ''} ${slot.atom.sourceName} ${slot.atom.design?.subfamily ?? ''}`.toLowerCase()))
  const decorative = isDecorativeFrame(slot.atom, slot.role) && !solid
  const isFrame = slot.role === 'frame'
  if (!isFrame) {
    if (coverage > 0 || clearance < 0.35) return { verdict: 'reject', coverage, clearance, solid }
    return { verdict: 'ok', coverage, clearance, solid }
  }
  if (coverage <= 0 && clearance >= 0.8) return { verdict: 'ok', coverage, clearance, solid }
  if (decorative && frameSurroundsLockup(slot.box, lockup)) return { verdict: 'ok', coverage, clearance, solid }
  if (solid && (coverage > 0.05 || clearance < 0.8)) return { verdict: 'reject', coverage, clearance, solid }
  if (decorative && coverage > 0.18) return { verdict: 'reject', coverage, clearance, solid }
  if (coverage > 0 || clearance < 0.8) return { verdict: 'modify', coverage, clearance, solid }
  return { verdict: 'ok', coverage, clearance, solid }
}

export function atomMatchesLanguage(atom: MotifMetaHost & { id?: string; sheetId?: string }, language?: VisualLanguage): boolean {
  if (!language) return true
  return atomVisualLanguages(atom).includes(language)
}

export function atomMatchesAnyLanguage(
  atom: MotifMetaHost & { id?: string; sheetId?: string },
  languages?: VisualLanguage[],
): boolean {
  if (!languages?.length) return true
  const got = atomVisualLanguages(atom)
  return languages.some((language) => got.includes(language))
}
