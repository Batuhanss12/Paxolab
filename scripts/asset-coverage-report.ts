import { reportAssetCoverage } from '../src/engine/artwork/assetCatalog/coverage'

const report = reportAssetCoverage()
console.log('CONCEPT / FAMILY COVERAGE')
console.log('INCOMPATIBLE WINNER COUNT', report.incompatibleWinnerCount)
for (const row of report.rows) {
  console.log(
    [
      row.slug,
      `concept:${row.concept}`,
      `family:${row.family}`,
      row.matchingAsset ? 'MATCH' : row.compatibleAsset ? 'COMPAT' : 'NO-ASSET',
      row.typographyOnly ? 'typography-only' : `winner:${row.winnerAsset ?? '—'}`,
      `winnerFamily:${row.winnerFamily ?? '—'}`,
      `match:${row.familyMatch ?? '—'}`,
      row.incompatibleWinner ? 'INCOMPATIBLE_WINNER' : 'ok',
    ].join(' | '),
  )
}
if (report.incompatibleWinnerCount !== 0) {
  console.error('INCOMPATIBLE WINNER COUNT must be 0')
  process.exit(1)
}
