import type { DesignSpec, PreflightItem, PreflightReport } from '../../types'

function item(id: string, label: string, detail: string, status: PreflightItem['status']): PreflightItem {
  return { id, label, detail, status }
}

export function runPreflight(spec: Pick<DesignSpec, 'brief' | 'copy' | 'dieline' | 'layout' | 'overrides' | 'kind'>): PreflightReport {
  const collisions = detectCollisions(spec)
  const missingBrand = !spec.copy.brand.trim()
  const missingProduct = !spec.copy.product.trim()
  const badDie = !spec.dieline.consistent || spec.dieline.issues.length > 0
  const noCut = spec.dieline.cut.length === 0
  const noCrease = spec.kind === 'packaging' && spec.dieline.crease.length === 0
  const userBarcode = !!spec.brief.barcode.trim()
  const exportOk = !collisions && !badDie && !noCut && !missingBrand

  const items: PreflightItem[] = [
    item('brand', 'Marka kimliği', 'Ön yüz lockup', missingBrand ? 'fail' : 'pass'),
    item('product', 'Ürün adı', 'Hiyerarşi', missingProduct ? 'fail' : 'pass'),
    item('size', 'Net ölçü', `${spec.layout.widthMm} × ${spec.layout.depthMm || '—'} × ${spec.layout.heightMm} mm`, spec.layout.widthMm > 0 ? 'pass' : 'fail'),
    item(
      'dieline',
      'Kesim + kat',
      noCut || noCrease || badDie ? spec.dieline.issues.join(' · ') || 'CUT/CREASE eksik' : 'CUT + CREASE tutarlı',
      noCut || badDie ? 'fail' : noCrease ? 'fail' : 'pass',
    ),
    item('collision', 'Çarpışma', collisions ? 'Metin panel sınırını aşıyor' : 'Panel içi güvenli', collisions ? 'fail' : 'pass'),
    item('copy', 'Metin kilidi', spec.copy.tagline, spec.copy.tagline ? 'pass' : 'warn'),
    item(
      'barcode',
      'Barkod',
      userBarcode ? spec.brief.barcode : 'Kullanıcı vermedi — uydurulmadı',
      userBarcode ? 'pass' : 'na',
    ),
    item('bleed', 'Taşma / güvenli', spec.overrides.printReady ? '3 mm taşma + 5 mm güvenli' : 'Henüz kilitlenmedi', spec.overrides.printReady && exportOk ? 'pass' : 'warn'),
    item('export', 'Dışa aktarma', exportOk ? 'SVG üretilebilir' : 'Engel var — dışa aktarma yeşil değil', exportOk ? 'pass' : 'fail'),
  ]

  const blocking = items.some((i) => i.status === 'fail')
  return { items, blocking, exportOk, collisions }
}

function detectCollisions(spec: Pick<DesignSpec, 'copy' | 'dieline' | 'artwork'> | Pick<DesignSpec, 'copy' | 'dieline'>): boolean {
  const front = spec.dieline.panels.find((p) => p.id === 'front' || p.id === 'label' || p.id === 'trayFront')
  if (!front) return true
  const brand = spec.copy.brand.length * 0.55
  return brand > front.w * 0.92
}
