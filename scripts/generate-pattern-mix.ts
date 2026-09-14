/**
 * Phase 12 — 1 design per FORMA sector, each with a different ART-PATTERN-DESİGN id.
 * Output: C:\Users\Admin\Desktop\FORMA-Pattern-Karisim-Seti\
 * Usage: npx vite-node scripts/generate-pattern-mix.ts
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import {
  ART_PATTERN_ASSET_DIR,
  ART_PATTERN_SOURCE_DIR,
  FORBIDDEN_SOURCE_NAME,
  assignMixPatterns,
  ingestArtPatternLibrary,
  type MixSlot,
} from '../src/engine/artwork/artPatternLibrary'
import { renderArtworkDoc, renderFrontSvg } from '../src/engine/artwork/renderArtwork'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { scoreVisualCraft } from '../src/engine/brain/DesignScore'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { JOBS, briefFrom } from './catalog-jobs'

const OUT_ROOT = 'C:\\Users\\Admin\\Desktop\\FORMA-Pattern-Karisim-Seti'
const MIX_SEED = 12

const MIX_JOBS: {
  filePrefix: string
  jobSlug: string
  slot: MixSlot
}[] = [
  {
    filePrefix: '01-parfum-tuck-luxury',
    jobSlug: '01-parfum-tuck-luxury',
    slot: { sectorKey: 'parfum', preferTags: ['artdeco', 'classic'] },
  },
  {
    filePrefix: '02-krem-wrap-modern',
    jobSlug: '06-krem-wrap-modern',
    slot: { sectorKey: 'krem', preferTags: ['classic', 'misc'] },
  },
  {
    filePrefix: '03-serum-tuck-minimal',
    jobSlug: '04-serum-tuck-minimal',
    slot: { sectorKey: 'serum', preferTags: ['misc', 'playful'] },
  },
  {
    filePrefix: '04-gida-tuck-luxury',
    jobSlug: '08-zeytinyagi-tuck-luxury',
    slot: { sectorKey: 'gida', preferTags: ['vintage', 'eco', 'classic'] },
  },
  {
    filePrefix: '05-elektronik-tuck-modern',
    jobSlug: '14-kulaklik-tuck-modern',
    slot: { sectorKey: 'elektronik', preferTags: ['geometric', 'artdeco'] },
  },
  {
    filePrefix: '06-temizlik-tuck-minimal',
    jobSlug: '20-temizlik-tuck-minimal',
    slot: { sectorKey: 'temizlik', preferTags: ['misc'] },
  },
  {
    filePrefix: '07-kozmetik-tuck-luxury',
    jobSlug: '17-evrensel-kozmetik-tuck',
    slot: { sectorKey: 'kozmetik', preferTags: ['classic', 'misc'] },
  },
]

async function main() {
  if (ART_PATTERN_SOURCE_DIR.includes(FORBIDDEN_SOURCE_NAME)) {
    throw new Error(`Refusing ${FORBIDDEN_SOURCE_NAME}`)
  }

  const entries = ingestArtPatternLibrary(ART_PATTERN_SOURCE_DIR, ART_PATTERN_ASSET_DIR)
  const assignments = assignMixPatterns(
    entries,
    MIX_JOBS.map((j) => j.slot),
    MIX_SEED,
  )
  if (assignments.length < 6) {
    throw new Error(`Need ≥6 usable patterns for mix, got ${assignments.length}`)
  }

  const usedBy = new Map<string, string>()
  const engine = new FormaLocalEngine()
  await fs.mkdir(OUT_ROOT, { recursive: true })

  const ozet: string[] = [
    'FORMA Phase 12 — ART-PATTERN-DESİGN mix (1 per sector)',
    `source: ${ART_PATTERN_SOURCE_DIR}`,
    `assets: ${ART_PATTERN_ASSET_DIR}`,
    `seed: ${MIX_SEED}`,
    '',
  ]

  for (let i = 0; i < assignments.length; i++) {
    const mix = MIX_JOBS[i]
    const assigned = assignments[i]
    const job = JOBS.find((j) => j.slug === mix.jobSlug)
    if (!job) throw new Error(`missing catalog job ${mix.jobSlug}`)

    resetArtMemory()
    const spec = engine.generate({
      brief: briefFrom(job),
      overridePatch: {
        variationIndex: 0,
        heroFamily: job.heroFamily,
        artPatternId: assigned.entry.id,
      },
    })
    const plan = spec.designPlan
    if (!plan) throw new Error(`${job.slug} missing plan`)

    const frontSvg = renderFrontSvg(spec.dieline, spec.artwork, spec.palette)
    const fullSvg = renderArtworkDoc(spec.dieline, spec.artwork, `${mix.filePrefix} — pattern mix`)
    const craft = scoreVisualCraft(spec, plan)
    const frontPath = path.join(OUT_ROOT, `${mix.filePrefix}-front.svg`)
    const fullPath = path.join(OUT_ROOT, `${mix.filePrefix}-full.svg`)
    await fs.writeFile(frontPath, frontSvg, 'utf8')
    await fs.writeFile(fullPath, fullSvg, 'utf8')

    usedBy.set(assigned.entry.id, mix.filePrefix)
    const line = [
      mix.filePrefix,
      `pattern:${assigned.entry.id}`,
      `place:${assigned.entry.placementHint}`,
      `hero:${plan.heroGraphic.family}`,
      `style:${plan.style}`,
      `craft:${craft.visualCraft}`,
      `export:${spec.preflight.exportOk ? 'OK' : 'BLOCK'}`,
    ].join(' | ')
    ozet.push(line)
    console.log(line)

    if (/data-hero="seal"/.test(frontSvg)) {
      throw new Error(`${mix.filePrefix} shipped data-hero=seal`)
    }
  }

  ozet.push('')
  ozet.push('icecek: skipped (no dedicated beverage catalog row; cay stays food)')
  ozet.push(`Stil-Referans: not read (source is ART-PATTERN-DESİGN only)`)

  const manifest = [
    '# FORMA Phase 12 — ART-PATTERN-DESİGN library',
    `source: ${ART_PATTERN_SOURCE_DIR}`,
    `assets: ${ART_PATTERN_ASSET_DIR}`,
    `ingested: ${entries.length}`,
    '',
    'SOURCE_FILE\tID\tTAGS\tPLACEMENT\tUSED_BY\tSKIP',
  ]
  for (const e of entries) {
    manifest.push(
      [
        e.sourceName,
        e.id,
        e.tags.join(','),
        e.placementHint,
        usedBy.get(e.id) ?? '',
        e.skipReason ?? '',
      ].join('\t'),
    )
  }

  await fs.writeFile(path.join(OUT_ROOT, 'OZET.txt'), `\uFEFF${ozet.join('\n')}\n`, 'utf8')
  await fs.writeFile(path.join(OUT_ROOT, 'MANIFEST-library.txt'), `\uFEFF${manifest.join('\n')}\n`, 'utf8')
  console.log(`wrote ${OUT_ROOT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
