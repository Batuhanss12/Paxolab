/**
 * Visual concept layer — the product's idea, not a layout recipe.
 * Style/sector/sub-product → concept (family, budget, strategy bias).
 * Does not paint SVG. Composition + motif match consume this block.
 */
import type { StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
import { resolveSubProduct } from './vocabularyTable'
import { moodPrior } from './moodPriors'
import type { DesignPlan, HeroFamily, MotifFamilyId, VisualConceptBlock } from './DesignPlan'

type ConceptRow = VisualConceptBlock

const CONCEPTS: Record<string, ConceptRow> = {
  'perfume:luxury': {
    id: 'nocturne-crest',
    label: 'NOCTURNE CREST',
    family: 'heraldic',
    supportFamily: 'geometric-deco',
    decorationBudget: 0.28,
    strategyBias: ['framed-content', 'hero-with-support', 'balanced-corners', 'minimal-accent'],
    tags: ['night', 'foil-signal', 'one-hero', 'heraldic'],
  },
  'perfume:classic': {
    id: 'heraldic-crest',
    label: 'HERALDIC CREST',
    family: 'heraldic',
    supportFamily: 'mineral-frame',
    decorationBudget: 0.34,
    strategyBias: ['framed-content', 'balanced-corners', 'hero-with-support'],
    tags: ['crest', 'double-line', 'heritage'],
  },
  'perfume:eco': {
    id: 'botanical-night',
    label: 'BOTANICAL NIGHT',
    family: 'botanical',
    supportFamily: 'quiet-line',
    decorationBudget: 0.32,
    strategyBias: ['asymmetric-editorial', 'minimal-accent', 'hero-with-support'],
    tags: ['leaf', 'quiet-gold'],
  },
  'cream:luxury': {
    id: 'soft-oval',
    label: 'SOFT OVAL',
    family: 'quiet-line',
    supportFamily: 'heraldic',
    decorationBudget: 0.24,
    strategyBias: ['minimal-accent', 'framed-content', 'hero-with-support'],
    tags: ['cream', 'oval', 'air'],
  },
  'serum:luxury': {
    id: 'drop-concentrate',
    label: 'DROP CONCENTRATE',
    family: 'quiet-line',
    supportFamily: 'linear-tech',
    decorationBudget: 0.22,
    strategyBias: ['minimal-accent', 'asymmetric-editorial', 'hero-with-support'],
    tags: ['serum', 'drop'],
  },
  'food:oil:luxury': {
    id: 'earthen-premium',
    label: 'EARTHEN PREMIUM',
    family: 'botanical',
    supportFamily: 'harvest',
    decorationBudget: 0.42,
    strategyBias: ['asymmetric-editorial', 'hero-with-support', 'framed-content', 'minimal-accent'],
    tags: ['botanical', 'olive', 'restrained-frame', 'editorial', 'warm-mineral', 'harvest'],
  },
  'food:oil:classic': {
    id: 'grove-press',
    label: 'GROVE PRESS',
    family: 'harvest',
    supportFamily: 'botanical',
    decorationBudget: 0.4,
    strategyBias: ['hero-with-support', 'asymmetric-editorial', 'top-bottom-balance'],
    tags: ['wreath', 'press', 'olive'],
  },
  'food:oil:eco': {
    id: 'grove-kraft',
    label: 'GROVE KRAFT',
    family: 'botanical',
    supportFamily: 'harvest',
    decorationBudget: 0.38,
    strategyBias: ['asymmetric-editorial', 'minimal-accent', 'hero-with-support'],
    tags: ['leaf', 'kraft', 'grain'],
  },
  'food:luxury': {
    id: 'harvest-press',
    label: 'HARVEST PRESS',
    family: 'harvest',
    supportFamily: 'botanical',
    decorationBudget: 0.4,
    strategyBias: ['hero-with-support', 'asymmetric-editorial', 'framed-content'],
    tags: ['wreath', 'press', 'net', 'harvest'],
  },
  'food:eco': {
    id: 'harvest-kraft',
    label: 'HARVEST KRAFT',
    family: 'harvest',
    supportFamily: 'botanical',
    decorationBudget: 0.38,
    strategyBias: ['asymmetric-editorial', 'hero-with-support', 'minimal-accent'],
    tags: ['grain', 'leaf', 'press'],
  },
  'electronics:luxury': {
    id: 'signal-plaque',
    label: 'SIGNAL PLAQUE',
    family: 'linear-tech',
    supportFamily: 'quiet-line',
    decorationBudget: 0.2,
    strategyBias: ['minimal-accent', 'hero-with-support', 'asymmetric-editorial'],
    tags: ['plaque', 'spec', 'precision'],
  },
  'electronics:modern': {
    id: 'tech-glyph',
    label: 'TECH GLYPH',
    family: 'linear-tech',
    supportFamily: 'quiet-line',
    decorationBudget: 0.22,
    strategyBias: ['asymmetric-editorial', 'top-bottom-balance', 'minimal-accent'],
    tags: ['grid', 'index', 'slate'],
  },
  'eco:any': {
    id: 'kraft-botanical',
    label: 'KRAFT BOTANICAL',
    family: 'botanical',
    supportFamily: 'harvest',
    decorationBudget: 0.36,
    strategyBias: ['asymmetric-editorial', 'minimal-accent', 'hero-with-support'],
    tags: ['grain', 'leaf', 'warm'],
  },
  'playful:any': {
    id: 'capsule-field',
    label: 'CAPSULE FIELD',
    family: 'ornate-stamp',
    supportFamily: 'harvest',
    decorationBudget: 0.48,
    strategyBias: ['pattern-field', 'top-bottom-balance', 'balanced-corners'],
    tags: ['badge', 'capsule', 'controlled'],
  },
  'modern:any': {
    id: 'index-stripe',
    label: 'INDEX STRIPE',
    family: 'linear-tech',
    supportFamily: 'quiet-line',
    decorationBudget: 0.26,
    strategyBias: ['asymmetric-editorial', 'top-bottom-balance', 'minimal-accent'],
    tags: ['stripe', 'lattice', 'left'],
  },
  'minimal:any': {
    id: 'air-paper',
    label: 'AIR PAPER',
    family: 'quiet-line',
    decorationBudget: 0.18,
    strategyBias: ['minimal-accent', 'asymmetric-editorial', 'hero-with-support'],
    tags: ['paper', 'rule', 'quiet'],
  },
  'classic:any': {
    id: 'heraldic-cartouche',
    label: 'HERALDIC CARTOUCHE',
    family: 'heraldic',
    supportFamily: 'mineral-frame',
    decorationBudget: 0.36,
    strategyBias: ['framed-content', 'balanced-corners', 'hero-with-support'],
    tags: ['cartouche', 'ornament'],
  },
  'luxury:any': {
    id: 'restrained-foil',
    label: 'RESTRAINED FOIL',
    family: 'geometric-deco',
    supportFamily: 'heraldic',
    decorationBudget: 0.3,
    strategyBias: ['framed-content', 'minimal-accent', 'hero-with-support'],
    tags: ['foil', 'air', 'one-hero'],
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

export function visualConceptFor(
  style: StyleType,
  sector: SectorId,
  hero: HeroFamily,
  subProduct?: string,
): VisualConceptBlock {
  const sub = subProduct ? resolveSubProduct(sector, `${subProduct} ${sector}`) : undefined
  const keyed =
    (sub ? CONCEPTS[`${sector}:${sub}:${style}`] : undefined) ??
    CONCEPTS[`${sector}:${style}`] ??
    CONCEPTS[`${style}:any`] ??
    CONCEPTS['minimal:any']
  return withHero(keyed, hero)
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
