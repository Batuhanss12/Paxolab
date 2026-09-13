import type { DesignSpec, Palette, PreflightItem, PreflightReport } from '../../types'
import { isFormaSampleEan, isInventedRegisteredGtin } from '../barcode'
import { evaluateDesignGates, layoutFrontLockup, measureLockupCollision, resolveDesignSystem } from '../designSystem'
import type { DesignSystem } from '../designSystem/types'

function item(id: string, label: string, detail: string, status: PreflightItem['status']): PreflightItem {
  return { id, label, detail, status }
}

export function runPreflight(
  spec: Pick<DesignSpec, 'brief' | 'copy' | 'dieline' | 'layout' | 'overrides' | 'kind' | 'structureId'> & {
    palette?: Palette
    artwork?: DesignSpec['artwork']
    designPlan?: DesignSpec['designPlan']
  },
  system?: DesignSystem,
): PreflightReport {
  const sys = system ?? resolveDesignSystem(spec.brief, spec.structureId)
  const collision = detectCollisions(spec, sys)
  const collisions = collision.hit
  const missingBrand = !spec.copy.brand.trim()
  const missingProduct = !spec.copy.product.trim()
  const productOk = !missingProduct || !!sys.category
  const badDie = !spec.dieline.consistent || spec.dieline.issues.length > 0
  const noCut = spec.dieline.cut.length === 0
  const noCrease = spec.kind === 'packaging' && spec.dieline.crease.length === 0
  const userBarcode = !!spec.brief.barcode.trim() && !spec.brief.barcodeDefaulted && !isFormaSampleEan(spec.brief.barcode)
  const inventedGtin = isInventedRegisteredGtin(spec.copy.barcode, spec.brief.barcodeDefaulted)
  const palette = spec.palette ?? { bg: '#111', fg: '#eee', accent: '#aaa', muted: '#888', paper: '#000' }

  const gates = evaluateDesignGates(
    {
      brief: spec.brief,
      copy: spec.copy,
      kind: spec.kind,
      palette,
      structureId: spec.structureId,
      artwork: spec.artwork,
    },
    sys,
  )
  const gateFail = gates.some((g) => g.status === 'fail')
  const layers = spec.artwork?.layers ?? []
  const glueLayers = layers.filter((l) => /glue|overlap/i.test(l.panelId))
  const glueDirty = glueLayers.some((l) => /data-art="hero"/.test(l.markup))
  const front = spec.dieline.panels.find((p) => p.id === 'front' || p.id === 'label' || p.id === 'trayFront')
  const labelFace = spec.kind === 'label' || sys.grammar === 'label'
  const lockup = front ? layoutFrontLockup(front, sys, spec.copy, spec.overrides, labelFace) : null
  const typeOk = !!lockup && lockup.brandSize >= sys.type.minMm - 0.01
  const exportOk = !collisions && !badDie && !noCut && !missingBrand && !gateFail && !inventedGtin && !glueDirty
  const plan = spec.designPlan
  const proofDetail = [
    plan ? `set ${plan.variationIndex + 1}` : null,
    plan?.heroGraphic.family && plan.heroGraphic.family !== 'none' ? plan.heroGraphic.family : null,
    plan ? `crop ${plan.artDirection.crop}` : null,
    spec.overrides.printReady ? '3 mm taşma · 2 mm güvenli' : '2 mm güvenli (structure)',
  ]
    .filter(Boolean)
    .join(' · ')

  const items: PreflightItem[] = [
    item('brand', 'Marka kimliği', 'Ön yüz lockup', missingBrand ? 'fail' : 'pass'),
    item(
      'product',
      'Ürün adı',
      missingProduct ? (sys.category ? `Lockup kategori · ${sys.category}` : 'Hiyerarşi boş') : 'Hiyerarşi',
      missingProduct ? (productOk ? 'warn' : 'fail') : 'pass',
    ),
    item('size', 'Net ölçü', `${spec.layout.widthMm} × ${spec.layout.depthMm || '—'} × ${spec.layout.heightMm} mm`, spec.layout.widthMm > 0 ? 'pass' : 'fail'),
    item(
      'dieline',
      'Kesim + kat',
      noCut || noCrease || badDie ? spec.dieline.issues.join(' · ') || 'CUT/CREASE eksik' : 'CUT + CREASE tutarlı',
      noCut || badDie ? 'fail' : noCrease ? 'fail' : 'pass',
    ),
    item(
      'collision',
      'Çarpışma',
      collisions ? `Lockup bbox: ${collision.reasons.join(', ')}` : 'Glyph bbox panel / lockup içinde',
      collisions ? 'fail' : 'pass',
    ),
    item('copy', 'Metin kilidi', spec.copy.tagline, spec.copy.tagline ? 'pass' : 'warn'),
    item(
      'barcode',
      'Barkod',
      inventedGtin
        ? 'Motor tescilli görünen GTIN uydurdu — dışa aktarma kapalı'
        : userBarcode
          ? spec.brief.barcode
          : spec.copy.barcode
            ? `Örnek ${spec.copy.barcode} — GS1 değil`
            : 'Yok',
      inventedGtin ? 'fail' : userBarcode ? 'pass' : spec.copy.barcode ? 'warn' : 'na',
    ),
    ...gates,
    item(
      'glue-art',
      'Yapıştırma yüzü',
      glueDirty ? 'Yapıştırmada hero var' : glueLayers.length ? 'GLUE — hero yok' : 'Yapıştırma paneli yok',
      glueDirty ? 'fail' : glueLayers.length ? 'pass' : 'na',
    ),
    item(
      'type-fit',
      'Tipografi sığdı',
      lockup ? `${lockup.brandSize.toFixed(2)} mm display · min ${sys.type.minMm}` : 'Ön yüz yok',
      !lockup ? 'warn' : typeOk && !collisions ? 'pass' : collisions ? 'warn' : 'warn',
    ),
    item(
      'proof',
      'Stüdyo prova',
      proofDetail || 'Kesim / kat + güvenli',
      spec.overrides.printReady && exportOk ? 'pass' : 'warn',
    ),
    item('bleed', 'Taşma / güvenli', spec.overrides.printReady ? '3 mm taşma + 5 mm güvenli' : 'Henüz kilitlenmedi', spec.overrides.printReady && exportOk ? 'pass' : 'warn'),
    item('export', 'Dışa aktarma', exportOk ? 'SVG üretilebilir' : 'Engel var — dışa aktarma yeşil değil', exportOk ? 'pass' : 'fail'),
  ]

  const blocking = items.some((i) => i.status === 'fail')
  return { items, blocking, exportOk, collisions }
}

function detectCollisions(
  spec: Pick<DesignSpec, 'copy' | 'dieline' | 'overrides' | 'kind'>,
  system: DesignSystem,
) {
  const front = spec.dieline.panels.find((p) => p.id === 'front' || p.id === 'label' || p.id === 'trayFront')
  if (!front) return { hit: true, reasons: ['no-front'] }
  const labelFace = spec.kind === 'label' || system.grammar === 'label'
  return measureLockupCollision(front, system, spec.copy, spec.overrides, labelFace)
}
