/**
 * Offer distance — are the eight candidates eight designs, or one design in eight textures?
 *
 * Reads the fingerprint the engine now stamps on every offer row (production decision, not the
 * chat's inspect path) over the 18 golden briefs, and prints per-axis variety and the pairwise
 * composition distance. The audit's three-brief sample found ornament, temperament and layout
 * variant identical across all eight; this is the same measurement over the frozen table, so the
 * Phase 3 target ("every pair ≥ 2 composition axes apart") has a baseline.
 *
 * Permanent instrument. Run: `npx vite-node scripts/measure-offer-distance.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { COMPOSITION_AXES, FINGERPRINT_AXES, distinctPerAxis, pairwiseSummary, type Fingerprint } from '../src/engine/studio/fingerprint'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'

const totals = { jobs: 0, candidates: 0, pairs: 0, identical: 0, notDistinct: 0, minSum: 0, meanSum: 0 }
const axisSum: Record<string, number> = {}
for (const axis of FINGERPRINT_AXES) axisSum[axis] = 0

console.log('iş                       n  ' + FINGERPRINT_AXES.map((a) => a.slice(0, 4)).join(' ') + '   min  ort  aynı  ayrışmayan')
for (const job of STUDIO_GALLERY_JOBS) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({
    brief: {
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
    },
    overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
  })
  const rows = (spec.studio?.offer?.candidates ?? []).map((c) => c.fingerprint).filter((f): f is Fingerprint => !!f)
  if (!rows.length) {
    console.log(`${job.slug.padEnd(24)} — teklif satırlarında parmak izi yok`)
    continue
  }
  const per = distinctPerAxis(rows)
  const s = pairwiseSummary(rows, COMPOSITION_AXES)
  totals.jobs += 1
  totals.candidates += rows.length
  totals.pairs += s.pairs
  totals.identical += s.identical
  totals.notDistinct += s.notDistinct
  totals.minSum += s.min
  totals.meanSum += s.mean
  for (const axis of FINGERPRINT_AXES) axisSum[axis] += per[axis]
  console.log(
    `${job.slug.padEnd(24)} ${String(rows.length).padStart(2)}  ${FINGERPRINT_AXES.map((a) => String(per[a]).padStart(4)).join(' ')}   ${String(s.min).padStart(3)} ${s.mean.toFixed(2).padStart(5)}  ${String(s.identical).padStart(4)}  ${String(s.notDistinct).padStart(4)}/${s.pairs}`,
  )
}

console.log('\nortalama eksen çeşitliliği (8 adayda kaç farklı değer):')
for (const axis of FINGERPRINT_AXES) console.log(`  ${axis.padEnd(12)} ${(axisSum[axis] / Math.max(1, totals.jobs)).toFixed(1)}`)
console.log(`\nkompozisyon mesafesi (${COMPOSITION_AXES.join('+')}): min ort ${(totals.minSum / Math.max(1, totals.jobs)).toFixed(2)} · ort ${(totals.meanSum / Math.max(1, totals.jobs)).toFixed(2)}`)
console.log(`birebir aynı çift: ${totals.identical}/${totals.pairs} · ayrışmayan (<2 eksen): ${totals.notDistinct}/${totals.pairs}`)
