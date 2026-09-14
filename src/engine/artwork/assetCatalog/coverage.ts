/**
 * Concept × family asset coverage. Reports incompatible winners; target is 0.
 */
import type { Panel } from '../../../types'
import { createPlan } from '../../brain'
import { emptyBrief } from '../../fields'
import { JOBS, briefFrom, type Job } from '../../../../scripts/catalog-jobs'
import { matchMotifs } from '../artMotifMatch'
import { motifFamilyOf, selectFamilyPool } from '../artMotifFamily'
import { lastCompositionSearch, selectMotifComposition } from '../compositionCandidates'
import { familyMatchLevel } from './familyMatrix'
import { resolveSector } from '../../designSystem/sector'

export type CoverageRow = {
  slug: string
  concept: string
  family: string
  matchingAsset: boolean
  compatibleAsset: boolean
  typographyOnly: boolean
  incompatibleWinner: boolean
  winnerAsset?: string
  winnerFamily?: string
  familyMatch?: string
  fallbackMode?: string
}

export type AssetCoverageReport = {
  rows: CoverageRow[]
  incompatibleWinnerCount: number
}

const PANEL: Panel = {
  id: 'front',
  role: 'body',
  x: 0,
  y: 0,
  w: 70,
  h: 140,
  polygon: [
    { x: 0, y: 0 },
    { x: 70, y: 0 },
    { x: 70, y: 140 },
    { x: 0, y: 140 },
  ],
}

const PALETTE = { bg: '#3f4a32', fg: '#f5f0e8', accent: '#c9a227', muted: '#8a7a4a', paper: '#f5f0e8' }

const COVERAGE_SLUGS = [
  '01-parfum-tuck-luxury',
  '02-kolonya-tuck-classic',
  '04-serum-tuck-minimal',
  '08-zeytinyagi-tuck-luxury',
  '09-cikolata-tray-playful',
  '14-kulaklik-tuck-modern',
]

function jobOf(slug: string): Job {
  const job = JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`missing job ${slug}`)
  return job
}

export function reportAssetCoverage(slugs: string[] = COVERAGE_SLUGS): AssetCoverageReport {
  const rows: CoverageRow[] = []
  let incompatibleWinnerCount = 0
  for (const slug of slugs) {
    const job = jobOf(slug)
    const brief = { ...emptyBrief(), ...briefFrom(job) }
    const plan = createPlan({ brief, style: job.styleType, blankCanvas: true, variationIndex: 0 })
    const family = plan.visualConcept.family
    const support = plan.visualConcept.supportFamily
    const match = matchMotifs({
      mood: job.styleType,
      sector: resolveSector(brief),
      colors: brief.colors,
      seed: 0,
      family,
      supportFamily: support,
      conceptId: plan.visualConcept.id,
    })
    const pool = selectFamilyPool(match.atoms, family, support, plan.visualConcept.id)
    const picked = selectMotifComposition({
      panel: PANEL,
      palette: PALETTE,
      atoms: match.atoms,
      plan,
      opts: { style: job.styleType, seed: 0, sector: resolveSector(brief) },
    })
    const debug = lastCompositionSearch()
    const winnerAtom = picked.slots[0]?.atom
    const winnerFamily = winnerAtom ? motifFamilyOf(winnerAtom) : undefined
    const matchLevel = winnerFamily ? familyMatchLevel(winnerFamily, family, support) : 'NONE'
    const incompatibleWinner = Boolean(winnerAtom && family && matchLevel === 'NONE')
    if (incompatibleWinner) incompatibleWinnerCount += 1
    rows.push({
      slug,
      concept: plan.visualConcept.label ?? plan.visualConcept.id,
      family: family ?? '—',
      matchingAsset: Boolean(family && pool.level === 'EXACT'),
      compatibleAsset: Boolean(family && (pool.level === 'EXACT' || pool.level === 'COMPATIBLE')),
      typographyOnly: !picked.slots.length || pool.fallbackMode === 'typography-only' || debug?.concept?.fallbackMode === 'typography-only',
      incompatibleWinner,
      winnerAsset: winnerAtom?.id,
      winnerFamily,
      familyMatch: winnerAtom ? matchLevel : debug?.concept?.familyMatch,
      fallbackMode: debug?.concept?.fallbackMode,
    })
  }
  return { rows, incompatibleWinnerCount }
}
