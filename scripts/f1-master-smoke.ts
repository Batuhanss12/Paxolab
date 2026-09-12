import { resolveDesignSystem } from '../src/engine/designSystem/resolve'
import { resolveMarks } from '../src/engine/marks/MarkMatrix'
import type { DesignBrief } from '../src/types'

function brief(partial: Partial<DesignBrief>): DesignBrief {
  return {
    brandName: 'Test',
    productName: 'Item',
    sector: '',
    subProduct: '',
    packagingMode: 'box',
    templateId: '',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    styleType: 'luxury',
    colors: '',
    volume: '50 ml',
    barcode: '',
    logo: '',
    references: '',
    copyOverrides: '',
    ...partial,
  }
}

const cases = [
  brief({ brandName: 'Aurelia', productName: 'Noir', sector: 'parfüm', subProduct: 'edp', styleType: 'luxury' }),
  brief({ brandName: 'Aurelia', productName: 'Noir', sector: 'parfüm', subProduct: 'edp', styleType: 'modern' }),
  brief({ brandName: 'Terra Grove', productName: 'Zeytinyağı', sector: 'gıda', subProduct: 'yağ', volume: '500 ml' }),
  brief({ brandName: 'Nox', productName: 'Kulaklık', sector: 'elektronik', subProduct: 'kulaklık', styleType: 'modern' }),
  brief({
    brandName: 'Aurelia',
    productName: 'Noir',
    sector: 'parfüm',
    packagingMode: 'label',
    templateId: 'fm-cos-label-bottle',
    dimensionsMm: { L: 80, W: 0, H: 40 },
  }),
]

let fail = 0
for (const b of cases) {
  const sys = resolveDesignSystem(b, b.packagingMode === 'label' ? 'wrap-label' : 'tuck-end-box')
  const marks = resolveMarks(sys.sector, sys.surfaceMode, 70, 140)
  const perfumeIcons = marks.strip.some((id) => ['flammable', 'pao'].includes(id))
  const foodBad = sys.sector === 'food' && marks.strip.some((id) => id === 'flammable' || id === 'pao')
  const elecBad = sys.sector === 'electronics' && marks.strip.some((id) => id === 'flammable' || id === 'pao')
  const labelOk = sys.grammar === 'label' && sys.lockup.startsWith('label')
  const ok = !foodBad && !elecBad && (sys.sector !== 'perfume' || perfumeIcons) && (sys.grammar !== 'label' || labelOk)
  if (!ok) fail += 1
  console.log(
    [ok ? 'OK' : 'FAIL', sys.key, marks.recipe.key, marks.strip.join(','), sys.lockup].join(' | '),
  )
}

if (fail) {
  console.error(`smoke failed: ${fail}`)
  process.exit(1)
}
console.log('F1-MASTER matrix smoke passed')
