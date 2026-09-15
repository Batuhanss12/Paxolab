/**
 * Visual concept layer — the product's idea, not a layout recipe.
 * Style/sector/sub-product → concept (family, budget, strategy bias).
 * Languages on the row are a copy of visualLanguageFor.
 * visualConceptFor may retie a mismatched row only inside that language allow-list.
 * Does not paint SVG. Composition + motif match consume this block.
 */
import type { StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
import { resolveSubProduct } from './vocabularyTable'
import { moodPrior } from './moodPriors'
import type { DesignIntentBlock, DesignPlan, HeroFamily, MotifFamilyId, VisualConceptBlock } from './DesignPlan'
import { visualLanguageFor } from '../artwork/visualLanguage'

type ConceptRow = VisualConceptBlock

const CONCEPTS: Record<string, ConceptRow> = {
  'perfume:luxury': {
    id: 'nocturne-crest',
    label: 'NOCTURNE CREST',
    family: 'heraldic',
    supportFamily: 'geometric-deco',
    decorationBudget: 0.28,
    strategyBias: ['hero-with-support', 'minimal-accent', 'framed-content'],
    tags: ['night', 'foil-signal', 'one-hero', 'heraldic'],
    languages: ['heraldic'],
    avoid: ['dense-pattern', 'generic-ticks', 'generic-corners'],
    motifLexicon: ['crest', 'ribbon', 'cartouche'],
  },
  'perfume:classic': {
    id: 'heraldic-crest',
    label: 'HERALDIC CREST',
    family: 'heraldic',
    supportFamily: 'mineral-frame',
    decorationBudget: 0.34,
    strategyBias: ['hero-with-support', 'framed-content', 'balanced-corners'],
    tags: ['crest', 'double-line', 'heritage'],
    languages: ['heraldic'],
    avoid: ['dense-pattern', 'generic-ticks'],
    motifLexicon: ['crest', 'double-line', 'ribbon'],
  },
  'perfume:eco': {
    id: 'botanical-night',
    label: 'BOTANICAL NIGHT',
    family: 'botanical',
    supportFamily: 'quiet-line',
    decorationBudget: 0.32,
    strategyBias: ['asymmetric-editorial', 'minimal-accent', 'hero-with-support'],
    tags: ['leaf', 'quiet-gold'],
    languages: ['botanical', 'quiet-line'],
    avoid: ['heavy-frame', 'ornate-seal'],
    motifLexicon: ['leaf', 'olive-branch'],
  },
  'cream:luxury': {
    id: 'soft-oval',
    label: 'SOFT OVAL',
    family: 'quiet-line',
    supportFamily: 'heraldic',
    decorationBudget: 0.24,
    strategyBias: ['hero-with-support', 'minimal-accent', 'asymmetric-editorial'],
    tags: ['cream', 'oval', 'air'],
    languages: ['oval', 'quiet-line'],
    avoid: ['heavy-frame', 'sharp-corner', 'generic-ticks', 'dense-pattern'],
    motifLexicon: ['soft-oval', 'oval', 'ring', 'capsule'],
  },
  'serum:luxury': {
    id: 'drop-concentrate',
    label: 'DROP CONCENTRATE',
    family: 'quiet-line',
    supportFamily: 'linear-tech',
    decorationBudget: 0.22,
    strategyBias: ['minimal-accent', 'asymmetric-editorial', 'hero-with-support'],
    tags: ['serum', 'drop'],
    languages: ['quiet-line', 'oval'],
    avoid: ['heavy-frame', 'ornate-seal'],
    motifLexicon: ['capsule', 'hairline', 'drop'],
  },
  'food:oil:luxury': {
    id: 'earthen-premium',
    label: 'EARTHEN PREMIUM',
    family: 'botanical',
    supportFamily: 'harvest',
    decorationBudget: 0.42,
    strategyBias: ['asymmetric-editorial', 'hero-with-support', 'minimal-accent'],
    tags: ['botanical', 'olive', 'restrained-frame', 'editorial', 'warm-mineral', 'harvest'],
    languages: ['botanical', 'organic'],
    avoid: ['heavy-frame', 'ornate-seal', 'dense-pattern'],
    motifLexicon: ['olive-branch', 'botanical-corner', 'botanical-accent'],
  },
  'food:oil:classic': {
    id: 'grove-press',
    label: 'GROVE PRESS',
    family: 'harvest',
    supportFamily: 'botanical',
    decorationBudget: 0.4,
    strategyBias: ['hero-with-support', 'asymmetric-editorial', 'top-bottom-balance'],
    tags: ['wreath', 'press', 'olive'],
    languages: ['botanical', 'organic'],
    avoid: ['heavy-frame', 'dense-pattern'],
    motifLexicon: ['wreath', 'olive', 'press'],
  },
  'food:oil:eco': {
    id: 'grove-kraft',
    label: 'GROVE KRAFT',
    family: 'botanical',
    supportFamily: 'harvest',
    decorationBudget: 0.38,
    strategyBias: ['asymmetric-editorial', 'minimal-accent', 'hero-with-support'],
    tags: ['leaf', 'kraft', 'grain'],
    languages: ['botanical', 'organic'],
    avoid: ['heavy-frame', 'ornate-seal'],
    motifLexicon: ['leaf', 'grain'],
  },
  'food:luxury': {
    id: 'harvest-press',
    label: 'HARVEST PRESS',
    family: 'harvest',
    supportFamily: 'botanical',
    decorationBudget: 0.4,
    strategyBias: ['hero-with-support', 'asymmetric-editorial', 'framed-content'],
    tags: ['wreath', 'press', 'net', 'harvest'],
    languages: ['botanical', 'organic'],
    avoid: ['ornate-seal', 'dense-pattern'],
    motifLexicon: ['wreath', 'harvest', 'olive'],
  },
  'food:eco': {
    id: 'harvest-kraft',
    label: 'HARVEST KRAFT',
    family: 'harvest',
    supportFamily: 'botanical',
    decorationBudget: 0.38,
    strategyBias: ['asymmetric-editorial', 'hero-with-support', 'minimal-accent'],
    tags: ['grain', 'leaf', 'press'],
    languages: ['botanical', 'organic'],
    avoid: ['heavy-frame', 'ornate-seal'],
    motifLexicon: ['grain', 'leaf', 'press'],
  },
  'electronics:luxury': {
    id: 'signal-plaque',
    label: 'SIGNAL PLAQUE',
    family: 'linear-tech',
    supportFamily: 'quiet-line',
    decorationBudget: 0.2,
    strategyBias: ['minimal-accent', 'hero-with-support', 'asymmetric-editorial'],
    tags: ['plaque', 'spec', 'precision'],
    languages: ['linear', 'geometric'],
    avoid: ['heavy-frame', 'ornate-seal', 'botanical', 'generic-corners'],
    motifLexicon: ['plaque', 'grid', 'glyph'],
  },
  'electronics:modern': {
    id: 'tech-glyph',
    label: 'TECH GLYPH',
    family: 'linear-tech',
    supportFamily: 'quiet-line',
    decorationBudget: 0.22,
    strategyBias: ['asymmetric-editorial', 'top-bottom-balance', 'minimal-accent'],
    tags: ['grid', 'index', 'slate'],
    languages: ['linear', 'geometric'],
    avoid: ['heavy-frame', 'ornate-seal', 'botanical', 'generic-corners'],
    motifLexicon: ['grid', 'glyph', 'pattern16', 'stripe', 'index'],
  },
  'eco:any': {
    id: 'kraft-botanical',
    label: 'KRAFT BOTANICAL',
    family: 'botanical',
    supportFamily: 'harvest',
    decorationBudget: 0.36,
    strategyBias: ['asymmetric-editorial', 'minimal-accent', 'hero-with-support'],
    tags: ['grain', 'leaf', 'warm'],
    languages: ['botanical', 'organic'],
    avoid: ['heavy-frame', 'ornate-seal'],
    motifLexicon: ['leaf', 'grain'],
  },
  'playful:any': {
    id: 'capsule-field',
    label: 'CAPSULE FIELD',
    family: 'ornate-stamp',
    supportFamily: 'harvest',
    decorationBudget: 0.48,
    strategyBias: ['pattern-field', 'top-bottom-balance', 'balanced-corners'],
    tags: ['badge', 'capsule', 'controlled'],
    languages: ['organic', 'geometric'],
    avoid: ['heavy-frame'],
    motifLexicon: ['capsule', 'badge', 'vintage'],
  },
  'modern:any': {
    id: 'index-stripe',
    label: 'INDEX STRIPE',
    family: 'linear-tech',
    supportFamily: 'quiet-line',
    decorationBudget: 0.26,
    strategyBias: ['asymmetric-editorial', 'top-bottom-balance', 'minimal-accent'],
    tags: ['stripe', 'lattice', 'left'],
    languages: ['linear'],
    avoid: ['heavy-frame', 'ornate-seal'],
    motifLexicon: ['stripe', 'lattice', 'index'],
  },
  'minimal:any': {
    id: 'air-paper',
    label: 'AIR PAPER',
    family: 'quiet-line',
    decorationBudget: 0.18,
    strategyBias: ['minimal-accent', 'asymmetric-editorial', 'hero-with-support'],
    tags: ['paper', 'rule', 'quiet'],
    languages: ['quiet-line'],
    avoid: ['heavy-frame', 'ornate-seal', 'dense-pattern'],
    motifLexicon: ['hairline', 'quiet-rule', 'ticks'],
  },
  'classic:any': {
    id: 'heraldic-cartouche',
    label: 'HERALDIC CARTOUCHE',
    family: 'heraldic',
    supportFamily: 'mineral-frame',
    decorationBudget: 0.36,
    strategyBias: ['framed-content', 'balanced-corners', 'hero-with-support'],
    tags: ['cartouche', 'ornament'],
    languages: ['heraldic', 'art-deco'],
    avoid: ['dense-pattern', 'generic-ticks'],
    motifLexicon: ['cartouche', 'crest', 'ribbon'],
  },
  'luxury:any': {
    id: 'restrained-foil',
    label: 'RESTRAINED FOIL',
    family: 'geometric-deco',
    supportFamily: 'heraldic',
    decorationBudget: 0.3,
    strategyBias: ['framed-content', 'minimal-accent', 'hero-with-support'],
    tags: ['foil', 'air', 'one-hero'],
    languages: ['geometric', 'quiet-line'],
    avoid: ['dense-pattern', 'generic-ticks'],
    motifLexicon: ['foil', 'frame', 'hairline'],
  },
}

function clamp01(n: number): number {
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

function withHero(row: ConceptRow, hero: HeroFamily): VisualConceptBlock {
  if (hero === 'none' || (row.tags ?? []).includes(hero)) return { ...row }
  return { ...row, tags: [...(row.tags ?? []), hero] }
}

export function conceptRowById(id?: string): VisualConceptBlock | undefined {
  if (!id) return undefined
  return Object.values(CONCEPTS).find((row) => row.id === id)
}

/** Style×sector CONCEPTS row. No hero tag, no intent. Language is visualLanguageFor, not this row. */
export function conceptRowFor(style: StyleType, sector: SectorId, subProduct?: string): VisualConceptBlock {
  const sub = subProduct ? resolveSubProduct(sector, `${subProduct} ${sector}`) : undefined
  return (
    (sub ? CONCEPTS[`${sector}:${sub}:${style}`] : undefined) ??
    CONCEPTS[`${sector}:${style}`] ??
    CONCEPTS[`${style}:any`] ??
    CONCEPTS['minimal:any']
  )
}

function languageKey(langs?: readonly string[]): string {
  return [...(langs ?? [])].map((item) => item.toLowerCase()).sort().join('|')
}

function languagesMatch(row: ConceptRow, allowed: readonly string[]): boolean {
  if (!allowed.length) return true
  const got = row.languages ?? []
  if (!got.length) return true
  return languageKey(got) === languageKey(allowed)
}

/**
 * Keep the style×sector row when its languages match the allow-list.
 * On mismatch, pick another CONCEPTS row with the same languages — never a different dialect.
 * Character reaches this only via visualLanguageFor (quiet-line append). Density is unused.
 */
function conceptInLanguage(
  keyed: ConceptRow,
  allowed: readonly string[],
  style: StyleType,
  sector: SectorId,
  subProduct: string | undefined,
  intentStyle: StyleType,
): ConceptRow {
  if (languagesMatch(keyed, allowed)) return keyed
  const matches = Object.entries(CONCEPTS).filter(([, row]) => languagesMatch(row, allowed))
  if (!matches.length) return keyed
  const sub = subProduct ? resolveSubProduct(sector, `${subProduct} ${sector}`) : undefined
  const prefer = [
    sub ? `${sector}:${sub}:${intentStyle}` : '',
    `${sector}:${intentStyle}`,
    sub ? `${sector}:${sub}:${style}` : '',
    `${sector}:${style}`,
    `${intentStyle}:any`,
    `${style}:any`,
  ].filter(Boolean)
  for (const key of prefer) {
    const hit = matches.find(([k]) => k === key)
    if (hit) return hit[1]
  }
  const sectorHit = matches.find(([k]) => k === `${sector}:${intentStyle}` || k.startsWith(`${sector}:`))
  if (sectorHit) return sectorHit[1]
  return matches[0][1]
}

export function visualConceptFor(
  style: StyleType,
  sector: SectorId,
  hero: HeroFamily,
  subProduct?: string,
  intent?: DesignIntentBlock,
): VisualConceptBlock {
  const keyed = conceptRowFor(style, sector, subProduct)
  if (!intent) return withHero(keyed, hero)
  void intent.density
  void intent.negativeSpace
  const allowed = visualLanguageFor(intent, sector, subProduct)
  return withHero(conceptInLanguage(keyed, allowed, style, sector, subProduct, intent.style), hero)
}

export function decorationBudgetOf(plan: DesignPlan): number {
  if (typeof plan.visualConcept.decorationBudget === 'number') return clamp01(plan.visualConcept.decorationBudget)
  const family = plan.visualConcept.family
  if (plan.style === 'minimal' || family === 'quiet-line') return 0.18
  if (family === 'botanical' || family === 'harvest') return 0.42
  if (family === 'geometric-deco') return 0.58
  return clamp01(moodPrior(plan.style).ornament)
}

export function conceptFamilyOf(plan: DesignPlan): MotifFamilyId | undefined {
  return plan.visualConcept.family
}
