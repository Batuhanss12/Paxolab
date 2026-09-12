import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import type { DesignBrief } from '../src/types'

const engine = new FormaLocalEngine()

function brief(partial: Partial<DesignBrief>): DesignBrief {
  return {
    brandName: 'Aurelia',
    productName: 'Noir',
    sector: 'parfüm',
    subProduct: 'edp',
    packagingMode: 'box',
    templateId: '',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    styleType: 'luxury',
    colors: 'siyah altın',
    volume: '50 ml',
    barcode: '',
    logo: '',
    references: '',
    copyOverrides: '',
    ...partial,
  }
}

const runs = [
  ['perfume-luxury', brief({})],
  ['perfume-modern', brief({ styleType: 'modern' })],
  ['food', brief({ brandName: 'Terra Grove', productName: 'Zeytinyağı', sector: 'gıda', subProduct: 'yağ', volume: '500 ml' })],
  ['electronics', brief({ brandName: 'Nox', productName: 'Kulaklık', sector: 'elektronik', subProduct: 'kulaklık', styleType: 'modern' })],
  ['label', brief({ packagingMode: 'label', productName: 'Wrap', dimensionsMm: { L: 80, W: 0, H: 40 } })],
] as const

for (const [name, b] of runs) {
  const spec = engine.generate({ brief: b })
  const art = spec.artwork.layers.map((l) => l.markup).join('\n')
  const hasIc1 = art.includes('2004.78')
  const hasIc3 = art.includes('986.01')
  const hasWeee = /WEEE|weee|9\.85 10\.15/.test(art)
  const hasGlass = art.includes('7.15 2.4')
  const hasSeam = art.includes('SEAM')
  const clip = art.includes('clip-path')
  console.log(
    [
      name,
      spec.artwork.systemKey,
      `ic1=${hasIc1}`,
      `ic3=${hasIc3}`,
      `weeeish=${hasWeee}`,
      `glass=${hasGlass}`,
      `seam=${hasSeam}`,
      `clip=${clip}`,
      spec.preflight.exportOk ? 'exportOK' : 'exportBLOCK',
    ].join(' | '),
  )
  if (name.startsWith('perfume') && !hasIc1) throw new Error(`${name} missing IC1`)
  if (name === 'food' && (hasIc1 || hasIc3)) throw new Error('food wore perfume assets')
  if (name === 'electronics' && (hasIc1 || hasIc3)) throw new Error('electronics wore perfume assets')
  if (name === 'label' && spec.kind !== 'label') throw new Error('label kind wrong')
}

console.log('F1-MASTER generate smoke passed')
