import type { DesignBrief } from '../../types'
import type { SectorId, SurfaceMode } from '../designSystem/types'
import type { MarkId, MarkRecipe, ResolvedMarks } from './types'
import { STRIP_TINY_MM, opticalStrip } from './stripLayout'

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
    ['flammable', 'keepaway', 'pao', 'leaflet'],
    [],
    PERFUME_WARN_BOX,
    { panel: 'back', minMm: 6.8, gapMm: 2.2, maxIcons: 4 },
    { paoMonths: '36M', perfumeAssets: PERFUME_ASSETS },
  )
}

function perfumeLabel(): MarkRecipe {
  return recipe(
    'perfume:label',
    [],
    [],
    PERFUME_WARN_BOX,
    { panel: 'label', minMm: 5.4, gapMm: 1.8, maxIcons: 0 },
    { paoMonths: '36M', perfumeAssets: {} },
  )
}

function creamBox(): MarkRecipe {
  return recipe(
    'cream:box',
    [],
    [],
    CREAM_WARN,
    { panel: 'back', minMm: 7.0, gapMm: 2.3, maxIcons: 0 },
    { paoMonths: '12M' },
  )
}

function creamLabel(): MarkRecipe {
  return recipe(
    'cream:label',
    [],
    [],
    CREAM_WARN,
    { panel: 'label', minMm: 5.4, gapMm: 1.8, maxIcons: 0 },
    { paoMonths: '12M' },
  )
}

function foodBox(): MarkRecipe {
  return recipe(
    'food:box',
    ['recycle', 'glassfork'],
    ['keepdry'],
    FOOD_WARN,
    { panel: 'back', minMm: 6.8, gapMm: 2.2, maxIcons: 3 },
  )
}

function foodLabel(): MarkRecipe {
  return recipe(
    'food:label',
    [],
    [],
    FOOD_WARN,
    { panel: 'label', minMm: 5.2, gapMm: 1.7, maxIcons: 0 },
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
    [],
    [],
    ELEC_WARN,
    { panel: 'label', minMm: 5.2, gapMm: 1.7, maxIcons: 0 },
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

export function paoMonthsFromBrief(brief: DesignBrief | undefined, fallback: string): string {
  if (brief?.paoMonths?.trim()) return normalizePao(brief.paoMonths)
  const blob = `${brief?.copyOverrides ?? ''} ${brief?.productName ?? ''} ${brief?.subProduct ?? ''} ${brief?.volume ?? ''}`
  const hit =
    blob.match(/\bpao\s*[:\-]?\s*(\d{1,2})\b/i) ||
    blob.match(/\b(\d{1,2})\s*ay\b/i) ||
    blob.match(/\b(\d{1,2})M\b/)
  return hit ? normalizePao(hit[1]) : fallback
}

function normalizePao(raw: string): string {
  const n = raw.replace(/[^\d]/g, '')
  if (!n) return '12M'
  return `${Math.min(36, Math.max(3, Number(n)))}M`
}

export function resolveMarkRecipe(sector: SectorId, surface: SurfaceMode, brief?: DesignBrief): MarkRecipe {
  const base =
    sector === 'perfume'
      ? surface === 'label'
        ? perfumeLabel()
        : perfumeBox()
      : sector === 'cream' || sector === 'serum'
        ? surface === 'label'
          ? creamLabel()
          : creamBox()
        : sector === 'food'
          ? surface === 'label'
            ? foodLabel()
            : foodBox()
          : sector === 'electronics'
            ? surface === 'label'
              ? electronicsLabel()
              : electronicsBox()
            : sector === 'cleaning'
              ? cleaningBox()
              : surface === 'label'
                ? recipe(
                    'generic:label',
                    [],
                    [],
                    ['Üretici talimatlarına uyun.', 'Çocuklardan uzak tutun.'],
                    { panel: 'label', minMm: 5.2, gapMm: 1.7, maxIcons: 0 },
                  )
                : genericBox()
  return { ...base, paoMonths: paoMonthsFromBrief(brief, base.paoMonths) }
}

export function resolveMarks(
  sector: SectorId,
  surface: SurfaceMode,
  faceWidthMm: number,
  faceHeightMm: number,
  brief?: DesignBrief,
): ResolvedMarks {
  const recipe = resolveMarkRecipe(sector, surface, brief)
  const tinyFace = surface === 'label' || faceWidthMm < STRIP_TINY_MM || faceHeightMm < 28
  const required = tinyFace ? [] : recipe.requiredMarks
  const optional = tinyFace ? [] : recipe.optionalMarks
  const band = Math.max(0, faceWidthMm - 10)
  const strip = opticalStrip([...required, ...optional], band, recipe).ids
  const labelStrip: MarkId[] = []
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

/** Extra transparent warning sticker — perfume box icons only, never on the main label face. */
export function resolveStickerMarks(
  sector: SectorId,
  widthMm: number,
  heightMm: number,
  brief?: DesignBrief,
): ResolvedMarks {
  if (sector !== 'perfume') {
    const recipe = resolveMarkRecipe(sector, 'label', brief)
    return { recipe, strip: [], labelStrip: [], warnings: recipe.requiredTextWarnings.join(' '), sampleLegal: SAMPLE }
  }
  const recipe = resolveMarkRecipe('perfume', 'box', brief)
  const strip = widthMm < STRIP_TINY_MM ? [] : recipe.requiredMarks.slice(0, recipe.placement.maxIcons)
  return {
    recipe,
    strip,
    labelStrip: [],
    warnings: recipe.requiredTextWarnings.join(' '),
    sampleLegal: SAMPLE,
  }
}
