import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { scoreVisualCraft, type VisualCraftScorecard } from '../src/engine/brain/DesignScore'
import { JOBS, briefFrom } from './catalog-jobs'

const BEFORE: Record<string, { hero: string; exportOk: boolean; notes: string }> = {
  '01-parfum-tuck-luxury': { hero: 'crest', exportOk: true, notes: 'strong' },
  '02-kolonya-tuck-classic': { hero: 'crest', exportOk: true, notes: '' },
  '03-krem-tuck-luxury': { hero: 'oval', exportOk: true, notes: '' },
  '04-serum-tuck-minimal': { hero: 'none', exportOk: true, notes: 'minimal air' },
  '05-parfum-wrap-luxury': { hero: 'crest-plan-no-paint', exportOk: true, notes: 'hero missing on face' },
  '06-krem-wrap-modern': { hero: 'oval', exportOk: true, notes: '' },
  '07-serum-wrap-minimal': { hero: 'none', exportOk: true, notes: '' },
  '08-zeytinyagi-tuck-luxury': { hero: 'harvest', exportOk: true, notes: 'nutrition+claim' },
  '09-cikolata-tray-playful': { hero: 'harvest', exportOk: true, notes: 'no nutrition' },
  '10-kurabiye-tray-classic': { hero: 'harvest', exportOk: true, notes: 'no nutrition' },
  '11-bal-label-classic': { hero: 'harvest', exportOk: true, notes: 'no claim/nutrition' },
  '12-recel-label-eco': { hero: 'none', exportOk: true, notes: 'no hero/claim/nutrition' },
  '13-cay-label-eco': { hero: 'none', exportOk: true, notes: 'no hero/claim/nutrition' },
  '14-kulaklik-tuck-modern': { hero: 'tech', exportOk: true, notes: '' },
  '15-kablo-tuck-modern': { hero: 'none', exportOk: true, notes: '' },
  '16-cihaz-label-minimal': { hero: 'none', exportOk: true, notes: 'minimal' },
  '17-evrensel-kozmetik-tuck': { hero: 'oval', exportOk: true, notes: '' },
  '18-evrensel-gida-tuck': { hero: 'harvest', exportOk: true, notes: '' },
  '19-evrensel-elektronik-tuck': { hero: 'tech', exportOk: true, notes: '' },
  '20-temizlik-tuck-minimal': { hero: 'none', exportOk: true, notes: '' },
  '21-krem-eco-monstera': { hero: 'monstera', exportOk: true, notes: 'forced' },
  '22-serum-eco-monstera': { hero: 'monstera', exportOk: false, notes: 'exportBLOCK type-fit' },
  '23-krem-eco-palm': { hero: 'palm', exportOk: true, notes: 'forced' },
  '24-krem-playful-palm': { hero: 'palm', exportOk: true, notes: 'forced' },
  '25-krem-playful-wave': { hero: 'organic-wave', exportOk: true, notes: 'forced' },
  '26-serum-playful-wave': { hero: 'organic-wave', exportOk: true, notes: 'forced' },
  '27-krem-modern-zebra': { hero: 'zebra', exportOk: true, notes: 'forced' },
  '28-serum-modern-zebra': { hero: 'zebra', exportOk: false, notes: 'exportBLOCK type-fit' },
}

const engine = new FormaLocalEngine()
const keys = [
  'visualCraft',
  'composition',
  'hierarchy',
  'typography',
  'hero',
  'decoration',
  'sectorFit',
  'productFit',
  'informationDesign',
  'originality',
  'production',
] as const

const rows: {
  slug: string
  beforeHero: string
  afterHero: string
  exportOk: boolean
  leak: boolean
  nutrition: boolean
  claim: boolean
  faceHero: boolean
  craft: VisualCraftScorecard
}[] = []

for (const job of JOBS) {
  resetArtMemory()
  const spec = engine.generate({
    brief: briefFrom(job),
    overridePatch: {
      variationIndex: job.variationIndex ?? 0,
      heroFamily: job.heroFamily,
    },
  })
  const plan = spec.designPlan
  if (!plan) throw new Error(`${job.slug} missing plan`)
  const face = spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
  const back = spec.artwork.layers.find((l) => l.panelId === 'back' || l.panelId === 'labelBack' || l.panelId === 'trayBack')?.markup ?? ''
  const craft = scoreVisualCraft(spec, plan)
  rows.push({
    slug: job.slug,
    beforeHero: BEFORE[job.slug]?.hero ?? '?',
    afterHero: plan.heroGraphic.family,
    exportOk: spec.preflight.exportOk,
    leak: plan.sector === 'serum' && /data-pattern="contour"|data-pattern="ornament"/.test(face),
    nutrition: /BESİN DEĞERLERİ/.test(back),
    claim: /data-art="claim-strip"|NET/.test(face),
    faceHero: /data-art="hero"/.test(face),
    craft,
  })
  const prev = BEFORE[job.slug]
  console.log(
    [
      job.slug,
      `${prev?.hero}→${plan.heroGraphic.family}${/data-art="hero"/.test(face) ? '' : '(no-paint)'}`,
      spec.preflight.exportOk ? 'OK' : `BLOCK:${spec.preflight.items.filter((i) => i.status === 'fail').map((i) => i.id).join(',')}`,
      `craft ${craft.visualCraft}`,
    ].join(' | '),
  )
}

const n = rows.length
const means = Object.fromEntries(keys.map((key) => [key, Math.round(rows.reduce((s, r) => s + r.craft[key], 0) / n)])) as Record<(typeof keys)[number], number>

console.log('\n=== VISUAL CRAFT ===')
console.log('CURRENT (benchmark): 52')
console.log(`NEW: ${means.visualCraft}`)
console.log(`DELTA: ${means.visualCraft - 52 >= 0 ? '+' : ''}${means.visualCraft - 52}`)
console.log(JSON.stringify(means, null, 2))
console.log('exportBLOCK:', rows.filter((r) => !r.exportOk).map((r) => r.slug).join(', ') || 'none')
console.log('serum leak:', rows.filter((r) => r.leak).map((r) => r.slug).join(', ') || 'none')
console.log(
  'food nutrition:',
  rows.filter((r) => /08|09|10|11|12|13|18/.test(r.slug) && r.nutrition).map((r) => r.slug).join(', ') || 'none',
)
console.log(
  'missing face hero:',
  rows.filter((r) => !r.faceHero && !/minimal|temizlik/.test(r.slug)).map((r) => r.slug).join(', ') || 'none',
)
