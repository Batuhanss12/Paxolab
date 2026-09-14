import { applyProgress, runBoxCert, writeBoxCertArtifacts } from '../src/engine/dieline/cert/runBoxCert'

const FIXED_THIS_PASS = ['fm-gift-hex-box', 'fm-gift-tri-box']
const result = runBoxCert({ fixedIds: FIXED_THIS_PASS })
applyProgress(result, [
  'Forxa aux tuck is now a 13-panel net: L×W lids + dust + tucks (tuckEndBox.ts). Native perfume tuck unchanged.',
  'Fold graph: crease hits polygon edges (star nets); rigid base/lid allowed as two components.',
  'PERF is a separate DielineModel layer — SVG data-type=perf, DXF PERF, PDF magenta dash. Not merged into CUT.',
])
const dir = writeBoxCertArtifacts(result)

const fails = result.templates.filter((t) => t.p0.length)
console.log(`N=${result.inventoryCount} samples=${result.sampleCount} P0=${result.p0} P1=${result.p1} P2=${result.p2}`)
console.log(`VERDICT ${result.verdict}`)
console.log(`wrote ${dir}`)
if (fails.length) {
  for (const f of fails) {
    console.log(`P0 ${f.templateId}`)
    for (const x of f.p0) console.log(`  ${x.code} ${x.message}${x.sample ? ` [${x.sample}]` : ''}`)
  }
  process.exit(1)
}
console.log('forma-box-cert exit 0')
