import { validateAssetLibrary } from '../src/engine/artwork/assetCatalog/validate'

const report = validateAssetLibrary()
console.log('TOTAL ASSETS', report.totalAssets)
for (const [k, v] of Object.entries(report.counts)) {
  console.log(k, v)
}
if (report.unclassifiedIds.length) {
  console.log('UNCLASSIFIED IDS:', report.unclassifiedIds.join(', '))
}
const errors = report.issues.filter((i) => i.level === 'error')
const warnings = report.issues.filter((i) => i.level === 'warning')
for (const issue of report.issues) {
  console.log(`${issue.level.toUpperCase()} ${issue.id}: ${issue.message}`)
}
if (report.counts.UNCLASSIFIED > 0) {
  console.log('WARNING: UNCLASSIFIED > 0')
}
if (errors.length) {
  console.error(`validateAssetLibrary failed: ${errors.length} error(s), ${warnings.length} warning(s)`)
  process.exit(1)
}
console.log(`validateAssetLibrary ok (${warnings.length} warning(s))`)
