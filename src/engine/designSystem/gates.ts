import type { DesignSpec, Palette, PreflightItem } from '../../types'
import { isFormaSampleEan, isInventedRegisteredGtin } from '../barcode'
import { PERFUME_VIEWBOXES } from '../marks/perfumeAssets'
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
  spec: Pick<DesignSpec, 'brief' | 'copy' | 'kind' | 'palette' | 'structureId'> & {
    artwork?: DesignSpec['artwork']
  },
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
  const layers = spec.artwork?.layers ?? []
  const faceArt =
    layers.find((l) => l.panelId === 'label' || l.panelId === 'front' || l.panelId === 'trayFront')?.markup ?? ''
  const backArt = layers.find((l) => l.panelId === 'back' || l.panelId === 'trayBack')?.markup ?? ''
  const sideArt = layers.filter((l) => /left|right/i.test(l.panelId)).map((l) => l.markup).join('\n')
  const labelBackArt = layers.find((l) => l.panelId === 'labelBack' || l.panelId === 'warnLabel')?.markup ?? ''

  const boxLegalOnFace = /COMPOSITION|FLAMMABLE · CAUTION|DIRECTIONS · CAUTION|CONTENTS \/ SPEC/.test(faceArt)
  const seriesOnLabel = spec.kind === 'label' && /Nº 0[12]/.test(faceArt)
  const wrapMissingSeam = system.wrapSeam && !/>SEAM</.test(faceArt) && !faceArt.includes('SEAM')
  const labelMissingBack = spec.kind === 'label' && !labelBackArt
  const faceBarcode = /data-mark="barcode"/.test(faceArt)
  const labelSpine = spec.kind === 'label' && /rotate\(-90\)/.test(faceArt)
  const boxHasSeam = spec.kind !== 'label' && system.grammar === 'box' && faceArt.includes('SEAM')
  const boxMissingBack =
    spec.kind !== 'label' &&
    system.grammar === 'box' &&
    !!faceArt &&
    !/COMPOSITION|INCI|INGREDIENTS|CONTENTS|SPECIFICATION|DIRECTIONS/.test(backArt)
  const boxMissingSpine =
    spec.kind !== 'label' &&
    system.grammar === 'box' &&
    /tuck-end/.test(spec.structureId) &&
    !!sideArt &&
    !/rotate\(-90\)/.test(sideArt)

  const surfaceFail =
    labelTuck ||
    boxLegalOnFace ||
    seriesOnLabel ||
    wrapMissingSeam ||
    labelMissingBack ||
    faceBarcode ||
    labelSpine ||
    boxHasSeam ||
    boxMissingBack ||
    boxMissingSpine
  const labelOk = spec.kind !== 'label' || (system.grammar === 'label' && !/tuck-end/.test(spec.structureId))
  items.push(
    item(
      'ds-label',
      spec.kind === 'label' ? 'Etiket yolu' : 'Kutu yolu',
      surfaceFail
        ? wrapMissingSeam
          ? 'Wrap SEAM yok'
          : labelMissingBack
            ? 'Arka etiket yok'
            : faceBarcode
              ? 'Barkod ön yüzde'
              : boxHasSeam
              ? 'Kutu yüzünde SEAM'
              : boxMissingBack
                ? 'Kutu sırtı legal yığın yok'
                : boxMissingSpine
                  ? 'Kutu omurga yok'
                  : boxLegalOnFace || seriesOnLabel
                    ? 'Etiket kutu kromu taşıyor'
                    : 'Etiket tuck-end grameri kullanıyor'
        : system.wrapSeam
          ? 'Wrap · ön tasarım · SEAM · arka kullanım'
          : spec.kind === 'label'
            ? 'Ön tasarım · arka kullanım / barkod'
            : 'Ön hero · omurga · sırt yığın',
      surfaceFail ? 'fail' : labelOk ? 'pass' : 'warn',
    ),
  )

  const blob = `${spec.copy.tagline} ${spec.copy.ingredients} ${spec.copy.warnings} ${system.category}`
  const perfumeCream =
    system.sector === 'perfume' &&
    /FACE CREAM|CONCENTRATE SERUM|Gece boyunca|Tek damla|Niacinamide|Hyaluronate|yüz krem/i.test(blob)
  const genericLockup = /^(parfüm|parfum|perfume|krem|serum)$/i.test(spec.copy.product.trim())
  const foodOnPerfume = system.sector === 'perfume' && /EXTRA VIRGIN|NET WEIGHT|Alerjen: gluten/i.test(faceArt)
  const edpOnFood = system.sector === 'food' && /EAU DE PARFUM|Alcohol Denat/i.test(faceArt)
  const paoOnElec = system.sector === 'electronics' && (/12M|36M|PAO|EAU DE PARFUM/i.test(faceArt) || /12M|36M/.test(`${spec.copy.volume}`))
  const ghsOnClean = system.sector === 'cleaning' && /#fb0102|2004\.78|GHS/i.test(faceArt)
  const voiceFail = perfumeCream || genericLockup || foodOnPerfume || edpOnFood || paoOnElec || ghsOnClean
  items.push(
    item(
      'ds-voice',
      'Sektör sesi',
      voiceFail
        ? genericLockup
          ? 'Lockup sektör adı taşıyor (Parfüm/Krem)'
          : perfumeCream || foodOnPerfume || edpOnFood
            ? 'Ön yüz yanlış sektör kopyası'
            : paoOnElec
              ? 'Elektronik PAO / parfüm kopyası'
              : 'Temizlik GHS uydurması'
        : `${system.sector} · ${system.category || 'nötr'}`,
      voiceFail ? 'fail' : 'pass',
    ),
  )

  const recipe = system.markRecipe
  const perfumeOnly = new Set(['flammable', 'pao'])
  const foreignPerfume =
    (system.sector === 'food' || system.sector === 'electronics') &&
    recipe.requiredMarks.some((m) => perfumeOnly.has(m) && (m === 'flammable' || (m === 'pao' && system.sector === 'food')))
  const art = spec.artwork?.layers.map((l) => `${l.panelId}\n${l.markup}`).join('\n') ?? ''
  const vbLeak = PERFUME_VIEWBOXES.some((vb) => art.includes(vb))
  const sectorLeak = system.sector !== 'perfume' && vbLeak
  const labelFaceLeak =
    spec.kind === 'label' &&
    (spec.artwork?.layers ?? []).some(
      (l) => l.panelId !== 'warnLabel' && l.panelId !== 'labelBack' && PERFUME_VIEWBOXES.some((vb) => l.markup.includes(vb)),
    )
  const marksFail = foreignPerfume || sectorLeak || labelFaceLeak
  items.push(
    item(
      'ds-marks',
      'İşaret matrisi',
      marksFail
        ? sectorLeak || labelFaceLeak
          ? 'PARFUM İCON yasak yüzde / sektörde'
          : 'Gıda/elektronik parfüm işaret seti taşıyor'
        : `${recipe.key} · ${recipe.requiredMarks.join(' / ') || 'metin'} · PAO ${recipe.paoMonths}`,
      marksFail ? 'fail' : 'pass',
    ),
  )

  const inventedGtin = isInventedRegisteredGtin(spec.copy.barcode, spec.brief.barcodeDefaulted)
  items.push(
    item(
      'ds-barcode-honesty',
      'Barkod dürüstlüğü',
      inventedGtin
        ? 'Motor tescilli görünen GTIN uydurdu'
        : isFormaSampleEan(spec.copy.barcode)
          ? 'Örnek 200… — GS1 değil'
          : spec.copy.barcode
            ? 'Kullanıcı barkodu'
            : 'Yok',
      inventedGtin ? 'fail' : 'pass',
    ),
  )

  items.push(
    item(
      'ds-sample-legal',
      'Örnek legal',
      system.markRecipe.sampleLegal
        ? 'Örnek / düzenlenebilir — sertifika veya tescilli INCI değil'
        : 'Kaynaklı legal',
      system.markRecipe.sampleLegal ? 'warn' : 'pass',
    ),
  )

  return items
}
