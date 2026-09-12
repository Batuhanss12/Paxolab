import type { SectorId, SurfaceMode } from '../designSystem/types'
import type { MarkId, MarkRecipe, ResolvedMarks } from './types'

const SAMPLE = true as const

function recipe(
  key: string,
  requiredMarks: MarkId[],
  optionalMarks: MarkId[],
  requiredTextWarnings: string[],
  placement: MarkRecipe['placement'],
  extra: Partial<Pick<MarkRecipe, 'paoMonths' | 'perfumeAssets'>> = {},
): MarkRecipe {
  return {
    key,
    requiredMarks,
    optionalMarks,
    requiredTextWarnings,
    placement,
    paoMonths: extra.paoMonths ?? '12M',
    sampleLegal: SAMPLE,
    perfumeAssets: extra.perfumeAssets ?? {},
  }
}

const PERFUME_ASSETS: MarkRecipe['perfumeAssets'] = {
  flammable: 'ic1',
  keepaway: 'ic2',
  pao: 'ic3',
  leaflet: 'ic4',
  pap21: 'ic4',
}

const PERFUME_WARN_BOX = [
  'Harici kullanıma mahsustur.',
  'Alevden ve ısı kaynaklarından uzak tutun.',
  'Gözle temasından kaçının.',
  'Tahrişte kullanımı bırakın.',
  'Çocukların ulaşamayacağı yerde saklayın.',
]

const CREAM_WARN = [
  'Temiz cilde uygulayın.',
  'Gözle temasından kaçının.',
  'Tahrişte kullanımı bırakın.',
  'Çocuklardan uzak tutun.',
]

const FOOD_WARN = [
  'Serin ve kuru yerde saklayın.',
  'Alerjen bilgisi etikette belirtilmiştir.',
  'Açıldıktan sonra önerilen sürede tüketin.',
]

const ELEC_WARN = [
  'Elektronik atık olarak ayırın (WEEE).',
  'Lityum pili evsel atığa atmayın.',
  'Nemden koruyun. Yetkili servis dışında açmayın.',
]

const CLEAN_WARN = [
  'Çocukların ulaşamayacağı yerde saklayın.',
  'Gözle temasından kaçının.',
  'Kullandıktan sonra ellerinizi yıkayın.',
]

function perfumeBox(): MarkRecipe {
  return recipe(
    'perfume:box',
    ['pao', 'leaflet', 'flammable', 'keepaway', 'recycle', 'emark'],
    ['pap21', 'greendot'],
    PERFUME_WARN_BOX,
    { panel: 'back', minMm: 6.8, gapMm: 2.2, maxIcons: 6 },
    { paoMonths: '36M', perfumeAssets: PERFUME_ASSETS },
  )
}

function perfumeLabel(): MarkRecipe {
  return recipe(
    'perfume:label',
    ['emark', 'flammable'],
    ['pao'],
    [
      'Harici kullanım.',
      'Alevden uzak tutun.',
      'Gözle temasından kaçının.',
    ],
    { panel: 'label', minMm: 5.4, gapMm: 1.8, maxIcons: 3 },
    { paoMonths: '36M', perfumeAssets: { flammable: 'ic1', pao: 'ic3' } },
  )
}

function creamBox(): MarkRecipe {
  return recipe(
    'cream:box',
    ['pao', 'leaflet', 'recycle', 'emark'],
    ['pap21', 'greendot', 'keepaway'],
    CREAM_WARN,
    { panel: 'back', minMm: 7.0, gapMm: 2.3, maxIcons: 5 },
    { paoMonths: '12M' },
  )
}

function creamLabel(): MarkRecipe {
  return recipe(
    'cream:label',
    ['emark', 'pao'],
    ['recycle'],
    ['Gözle temasından kaçının.', 'Çocuklardan uzak tutun.'],
    { panel: 'label', minMm: 5.4, gapMm: 1.8, maxIcons: 3 },
    { paoMonths: '12M' },
  )
}

function foodBox(): MarkRecipe {
  return recipe(
    'food:box',
    ['emark', 'recycle', 'glassfork'],
    ['pap21', 'keepdry'],
    FOOD_WARN,
    { panel: 'back', minMm: 6.8, gapMm: 2.2, maxIcons: 5 },
  )
}

function foodLabel(): MarkRecipe {
  return recipe(
    'food:label',
    ['emark', 'recycle'],
    ['glassfork'],
    ['Serin ve kuru yerde saklayın.', 'Alerjen: ürün etiketine bakın.'],
    { panel: 'label', minMm: 5.2, gapMm: 1.7, maxIcons: 3 },
  )
}

function electronicsBox(): MarkRecipe {
  return recipe(
    'electronics:box',
    ['weee', 'recycle'],
    ['thiswayup', 'keepdry'],
    ELEC_WARN,
    { panel: 'back', minMm: 7.0, gapMm: 2.3, maxIcons: 4 },
  )
}

function electronicsLabel(): MarkRecipe {
  return recipe(
    'electronics:label',
    ['weee', 'recycle'],
    ['keepdry'],
    ['Elektronik atık olarak ayırın.', 'Nemden koruyun.'],
    { panel: 'label', minMm: 5.2, gapMm: 1.7, maxIcons: 3 },
  )
}

function cleaningBox(): MarkRecipe {
  return recipe(
    'cleaning:box',
    ['keepaway', 'recycle'],
    ['emark', 'leaflet'],
    CLEAN_WARN,
    { panel: 'back', minMm: 6.8, gapMm: 2.2, maxIcons: 4 },
  )
}

function genericBox(): MarkRecipe {
  return recipe(
    'generic:box',
    ['recycle', 'emark'],
    ['leaflet'],
    ['Üretici talimatlarına uyun.', 'Çocuklardan uzak tutun.'],
    { panel: 'back', minMm: 6.8, gapMm: 2.2, maxIcons: 4 },
  )
}

export function resolveMarkRecipe(sector: SectorId, surface: SurfaceMode): MarkRecipe {
  if (sector === 'perfume') return surface === 'label' ? perfumeLabel() : perfumeBox()
  if (sector === 'cream' || sector === 'serum') return surface === 'label' ? creamLabel() : creamBox()
  if (sector === 'food') return surface === 'label' ? foodLabel() : foodBox()
  if (sector === 'electronics') return surface === 'label' ? electronicsLabel() : electronicsBox()
  if (sector === 'cleaning') return surface === 'label' ? cleaningBox() : cleaningBox()
  return surface === 'label'
    ? recipe(
        'generic:label',
        ['emark'],
        ['recycle'],
        ['Üretici talimatlarına uyun.'],
        { panel: 'label', minMm: 5.2, gapMm: 1.7, maxIcons: 2 },
      )
    : genericBox()
}

function fitStrip(ids: MarkId[], max: number, faceMm: number, minMm: number, gapMm: number): MarkId[] {
  const unique: MarkId[] = []
  for (const id of ids) {
    if (!unique.includes(id)) unique.push(id)
  }
  const budget = Math.max(1, Math.floor((faceMm + gapMm) / (minMm + gapMm)))
  return unique.slice(0, Math.min(max, budget))
}

export function resolveMarks(
  sector: SectorId,
  surface: SurfaceMode,
  faceWidthMm: number,
  faceHeightMm: number,
): ResolvedMarks {
  const recipe = resolveMarkRecipe(sector, surface)
  const shortFace = Math.min(faceWidthMm, faceHeightMm)
  const tinyLabel = surface === 'label' && (faceWidthMm < 42 || faceHeightMm < 48)
  const required = tinyLabel ? recipe.requiredMarks.slice(0, 2) : recipe.requiredMarks
  const optional = tinyLabel ? [] : recipe.optionalMarks
  const strip = fitStrip(
    [...required, ...optional],
    recipe.placement.maxIcons,
    Math.max(28, faceWidthMm - 10),
    recipe.placement.minMm,
    recipe.placement.gapMm,
  )
  const labelStrip = fitStrip(
    surface === 'label' ? strip : required.slice(0, 3),
    surface === 'label' ? recipe.placement.maxIcons : 3,
    Math.max(22, shortFace),
    recipe.placement.minMm,
    recipe.placement.gapMm,
  )
  return {
    recipe,
    strip,
    labelStrip,
    warnings: recipe.requiredTextWarnings.join(' '),
    sampleLegal: SAMPLE,
  }
}

export function perfumeAssetsAllowed(sector: SectorId): boolean {
  return sector === 'perfume'
}
