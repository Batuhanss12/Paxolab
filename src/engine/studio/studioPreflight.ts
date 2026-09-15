/**
 * Studio preflight — replaces the legacy lockup-geometry checks with ledger-based ones.
 * The base report keeps every layout-agnostic item (dieline, barcode honesty, locale, structure…).
 */
import type { PreflightItem, PreflightReport } from '../../types'
import type { StudioReport } from './types'

const REPLACED = new Set(['collision', 'type-fit', 'text-overflow', 'asset-family'])

/** Minimum legible type on press: 1.2 mm ≈ 3.4 pt for legal, hard floor 0.9 mm. */
export const STUDIO_MIN_TEXT_MM = 1.2
export const STUDIO_FLOOR_TEXT_MM = 0.9

export function applyStudioPreflight(base: PreflightReport, report: StudioReport): PreflightReport {
  const kept = base.items.filter((i) => !REPLACED.has(i.id) && i.id !== 'export')
  const collisions = report.collisions.length > 0
  const oob = report.outOfBounds.length > 0
  const min = report.minTextMm
  const typeStatus: PreflightItem['status'] = min <= 0 ? 'warn' : min < STUDIO_FLOOR_TEXT_MM ? 'fail' : min < STUDIO_MIN_TEXT_MM ? 'warn' : 'pass'
  const studioItems: PreflightItem[] = [
    {
      id: 'collision',
      label: 'Çarpışma',
      detail: collisions ? `Studio ledger: ${report.collisions.slice(0, 4).join(', ')}${report.collisions.length > 4 ? ` +${report.collisions.length - 4}` : ''}` : `Studio ledger — ${report.panels.reduce((n, p) => n + p.placed.length, 0)} kutu, örtüşme yok`,
      status: collisions ? 'fail' : 'pass',
    },
    {
      id: 'type-fit',
      label: 'Tipografi sığdı',
      detail: min > 0 ? `En küçük metin ${min.toFixed(2)} mm · min ${STUDIO_MIN_TEXT_MM} mm` : 'Metin yok',
      status: typeStatus,
    },
    {
      id: 'text-overflow',
      label: 'Metin taşma',
      detail: oob ? `Panel dışı: ${report.outOfBounds.slice(0, 3).join(', ')}` : 'Tüm elemanlar panel içinde',
      status: oob ? 'fail' : 'pass',
    },
    {
      id: 'asset-family',
      label: 'Asset family',
      detail: `studio · ${report.direction.archetype} · ${report.direction.background}`,
      status: 'pass',
    },
    {
      id: 'studio-direction',
      label: 'Stüdyo yönü',
      detail: `${report.direction.archetype} · ${report.direction.temperament} · ${report.anatomy.length} anatomi parçası`,
      status: 'pass',
    },
  ]
  const items = [...kept, ...studioItems]
  const exportOk = !items.some((i) => i.status === 'fail')
  items.push({
    id: 'export',
    label: 'Dışa aktarma',
    detail: exportOk ? 'SVG üretilebilir (studio)' : 'Engel var — dışa aktarma yeşil değil',
    status: exportOk ? 'pass' : 'fail',
  })
  // proof / bleed items depend on exportOk in the base report; refresh their status
  const refreshed = items.map((i) =>
    (i.id === 'proof' || i.id === 'bleed') && i.status !== 'pass' && exportOk && /PDF\/X-4/.test(i.detail) ? { ...i, status: 'pass' as const } : i,
  )
  return {
    items: refreshed,
    blocking: refreshed.some((i) => i.status === 'fail'),
    exportOk,
    collisions,
  }
}
