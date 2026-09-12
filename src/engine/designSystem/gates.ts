import type { DesignSpec, Palette, PreflightItem } from '../../types'
import type { DesignSystem } from './types'

function item(id: string, label: string, detail: string, status: PreflightItem['status']): PreflightItem {
  return { id, label, detail, status }
}

function hexLum(hex: string): number {
  const raw = hex.replace('#', '')
  const n = parseInt(raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function isKraftLike(palette: Palette): boolean {
  return hexLum(palette.bg) > 0.45 && hexLum(palette.accent) < 0.42
}

export function evaluateDesignGates(
  spec: Pick<DesignSpec, 'brief' | 'copy' | 'kind' | 'palette' | 'structureId'>,
  system: DesignSystem,
): PreflightItem[] {
  const items: PreflightItem[] = []
  const brand = spec.copy.brand.trim()
  items.push(
    item('ds-brand', 'Ön yüz marka', brand ? 'Lockup’ta marka var' : 'Ön yüzde marka yok', brand ? 'pass' : 'fail'),
  )

  const legalEmpty =
    !spec.copy.ingredients.trim() ||
    /brief’ten gelecek|lorem/i.test(spec.copy.ingredients) ||
    !spec.copy.warnings.trim()
  items.push(
    item(
      'ds-legal',
      'Zorunlu legal',
      legalEmpty ? 'İçerik veya uyarı boş / şablon metin' : `${system.legal.map((l) => l.title).join(' → ')}`,
      legalEmpty ? 'warn' : 'pass',
    ),
  )

  const kraftLuxury = system.style === 'luxury' && isKraftLike(spec.palette)
  items.push(
    item(
      'ds-luxury',
      'Lüks ≠ kraft',
      kraftLuxury ? 'Lüks palet eco kraft gibi duruyor' : 'Lüks zemin kontrollü',
      kraftLuxury ? 'warn' : 'pass',
    ),
  )

  const labelTuck =
    (spec.kind === 'label' || system.surfaceMode === 'label') &&
    (system.grammar === 'box' || /tuck-end/.test(spec.structureId))
  const labelOk = spec.kind !== 'label' || (system.grammar === 'label' && !/tuck-end/.test(spec.structureId))
  items.push(
    item(
      'ds-label',
      'Etiket grameri',
      labelOk ? 'Tek yüz / wrap kuralı' : 'Etiket tuck-end grameri kullanıyor',
      labelOk ? 'pass' : labelTuck ? 'fail' : 'warn',
    ),
  )

  const blob = `${spec.copy.tagline} ${spec.copy.ingredients} ${spec.copy.warnings} ${system.category}`
  const perfumeCream =
    system.sector === 'perfume' &&
    /FACE CREAM|CONCENTRATE SERUM|Gece boyunca|Tek damla|Niacinamide|Hyaluronate|yüz krem/i.test(blob)
  items.push(
    item(
      'ds-voice',
      'Sektör sesi',
      perfumeCream
        ? 'Parfüm krem/serum kopyası taşıyor'
        : `${system.sector} · ${system.category || 'nötr'}`,
      perfumeCream ? 'fail' : 'pass',
    ),
  )

  return items
}
