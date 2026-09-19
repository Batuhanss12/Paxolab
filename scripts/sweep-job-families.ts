/**
 * Every catalogue job against every family, in both repertoires.
 *
 * The gap this closes: `measure-repertoires` sweeps 216 synthetic briefs but lets each one pick
 * its own family, and `referenceRepertoire.test.ts` pins all the families but only on five sample
 * surfaces. Neither crosses the two. A customer who pins a family the offer showed them, on a
 * product shape that family is bad at, was landing in a hole nothing measured — found by accident
 * when a new panel guard ran on a job the existing sweeps happened not to use.
 *
 * Measured the first time it ran: 324 pairings, **7 dirty and all 7 export-blocked** — four in the
 * studio repertoire, three in the reference one. A blocked design is one the customer can choose
 * from the strip and then cannot download.
 *
 * Permanent instrument. Run: `npx vite-node scripts/sweep-job-families.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { familyRepertoire, REFERENCE_FAMILIES, STUDIO_FAMILIES } from '../src/engine/studio/family'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'
import type { StudioFamily } from '../src/engine/studio/types'
import type { DesignBrief } from '../src/types'

const FAMILIES = Object.keys(STUDIO_FAMILIES) as StudioFamily[]

let pairs = 0
let dirty = 0
let blocked = 0
const crafts: number[] = []
const hits: string[] = []

for (const job of STUDIO_GALLERY_JOBS) {
  for (const family of FAMILIES) {
    const brief: DesignBrief = {
      ...emptyBrief(),
      brandName: job.brand,
      productName: job.product,
      sector: job.sector,
      subProduct: job.subProduct,
      packagingMode: job.packagingMode,
      templateId: job.templateId,
      styleType: job.styleType,
      colors: job.colors,
      volume: job.volume,
      dimensionsMm: job.dimensionsMm,
      barcode: '8690000000017',
      studioRepertoire: familyRepertoire(family) ?? 'studio',
      studioFamily: family,
      studioFamilyLocked: true,
    }
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } })
    pairs += 1
    crafts.push(spec.craftScore?.visualCraft ?? 0)
    const bad = [...(spec.studio?.collisions ?? []), ...(spec.studio?.outOfBounds ?? [])]
    if (bad.length > 0) {
      dirty += 1
      hits.push(`${job.slug.padEnd(21)} ${String(family).padEnd(12)} ${String(spec.studio?.direction.archetype).padEnd(15)} ${bad.join(' · ')}`)
    }
    if (!spec.preflight.exportOk) blocked += 1
  }
}

console.log(`galeri işi × aile: ${pairs} (${STUDIO_GALLERY_JOBS.length} iş × ${FAMILIES.length} aile, referans ${REFERENCE_FAMILIES.length})`)
console.log(`kirli ${dirty} · engelli ${blocked} · craft ort ${(crafts.reduce((a, b) => a + b, 0) / crafts.length).toFixed(1)} (min ${Math.min(...crafts)})`)
for (const h of hits) console.log(`  ${h}`)
if (dirty === 0) console.log('  — temiz —')
