/**
 * Phase 4 — copy locale + leftover Phase 1/2 fixture checks.
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { languageId } from '../src/engine/artwork/paletteTable'
import { scoreVisualCraft } from '../src/engine/brain/DesignScore'
import { nextMissing } from '../src/engine/conversation'
import { emptyBrief, mergeBrief } from '../src/engine/fields'
import { JOBS, briefFrom } from './catalog-jobs'

let fails = 0
function assert(ok: boolean, msg: string) {
  if (!ok) {
    console.error('FAIL', msg)
    fails += 1
  }
}

const engine = new FormaLocalEngine()

function job(slug: string) {
  const found = JOBS.find((j) => j.slug === slug)
  if (!found) throw new Error(`missing job ${slug}`)
  return found
}

function generate(slug: string, setIdx = 0, copyLocale?: 'tr' | 'en', printReady = false) {
  return engine.generate({
    brief: { ...briefFrom(job(slug)), copyLocale },
    overridePatch: { variationIndex: setIdx, heroFamily: job(slug).heroFamily, printReady },
  })
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

function mixItem(spec: { preflight: { items: { id: string; status: string; detail: string }[] } }) {
  return spec.preflight.items.find((i) => i.id === 'copy-locale-mix')
}

const recelTr = generate('12-recel-label-eco', 0, 'tr')
const recelEn = generate('12-recel-label-eco', 0, 'en')
const recelTrFace = face(recelTr)
const recelEnFace = face(recelEn)

assert(recelTr.copyLocale === 'tr', `recel tr locale ${recelTr.copyLocale}`)
assert(recelEn.copyLocale === 'en', `recel en locale ${recelEn.copyLocale}`)
assert(!recelTrFace.includes('ARTISAN FOOD'), 'tr food still ARTISAN FOOD')
assert(!recelTrFace.includes('NET WEIGHT'), 'tr food used NET WEIGHT as category')
assert(recelTrFace.includes('REÇEL') || recelTrFace.includes('GURME'), `tr food category missing: ${recelTr.designPlan?.vocabularyId}`)
assert(recelTr.copy.tagline.includes('Fırından') || /[çğıöşüÇĞİÖŞÜ]/.test(recelTr.copy.tagline), `tr tagline ${recelTr.copy.tagline}`)
assert(recelTrFace.includes('DOĞAL'), 'tr claims missing DOĞAL')
assert(!recelTrFace.includes('NATURAL'), 'tr face has EN claims')
assert(recelEnFace.includes('PRESERVE') || recelEnFace.includes('ARTISAN'), `en food category ${recelEnFace.slice(0, 200)}`)
assert(
  recelEn.copy.tagline.includes('garden') || recelEn.copy.tagline.includes('jar') || recelEn.copy.tagline.includes('From'),
  `en tagline ${recelEn.copy.tagline}`,
)
assert(recelEnFace.includes('NATURAL'), 'en claims missing NATURAL')
assert(!recelEnFace.includes('DOĞAL'), 'en face has TR claims')
assert(recelTr.copy.brand === recelEn.copy.brand, 'brand translated')
assert(recelTr.preflight.exportOk, `recel tr export ${recelTr.preflight.items.filter((i) => i.status === 'fail').map((i) => i.id).join(',')}`)
assert(recelEn.preflight.exportOk, `recel en export ${recelEn.preflight.items.filter((i) => i.status === 'fail').map((i) => i.id).join(',')}`)

const perfumeTr = generate('01-parfum-tuck-luxury', 0, 'tr')
const perfumeEn = generate('01-parfum-tuck-luxury', 0, 'en')
const perfumeTrFace = face(perfumeTr)
const perfumeEnFace = face(perfumeEn)
assert(perfumeTrFace.includes('EAU DE PARFUM'), 'perfume tr missing EDP')
assert(perfumeEnFace.includes('EAU DE PARFUM'), 'perfume en missing EDP')
assert(perfumeTr.copy.tagline.includes('yoğunluk') || /[çğıöşü]/.test(perfumeTr.copy.tagline), `perfume tr tagline ${perfumeTr.copy.tagline}`)
assert(perfumeEn.copy.tagline.includes('quiet') || perfumeEn.copy.tagline.includes('intensity'), `perfume en tagline ${perfumeEn.copy.tagline}`)
assert(mixItem(perfumeTr)?.status === 'pass', `perfume EDP+TR should be allowed: ${mixItem(perfumeTr)?.detail}`)
assert(perfumeTr.preflight.exportOk, 'perfume tr export blocked')

const cream = generate('06-krem-wrap-modern', 0, 'tr')
const creamFace = face(cream)
assert(creamFace.includes('YÜZ KREMİ'), 'cream wrap missing TR category')
assert(!creamFace.includes('FACE CREAM'), 'cream wrap still FACE CREAM + TR tagline')
assert(
  cream.copy.tagline.includes('onarır') || cream.copy.tagline.includes('Klinik') || cream.copy.tagline.includes('Gece'),
  `cream tagline ${cream.copy.tagline}`,
)
assert(/GECE KREMİ/.test(cream.copy.product.toLocaleUpperCase('tr')), `sample product not localized: ${cream.copy.product}`)
assert(/GECE KREMİ/.test(creamFace), `cream face missing GECE KREMİ: product painted as ASCII?`)
assert(mixItem(cream)?.status === 'pass', `localized sample still mix: ${mixItem(cream)?.detail}`)
assert(cream.preflight.exportOk, 'cream export blocked')
assert(creamFace.includes('data-art="ingredient-badges"'), 'wrap omitted badges instead of moving volume')

const userEn = engine.generate({
  brief: { ...briefFrom(job('06-krem-wrap-modern')), copyLocale: 'tr', productName: 'Moonlight Repair' },
})
assert(mixItem(userEn)?.status === 'warn', `user EN product should warn mix, got ${mixItem(userEn)?.status}`)
const userEnReady = engine.generate({
  brief: { ...briefFrom(job('06-krem-wrap-modern')), copyLocale: 'tr', productName: 'Moonlight Repair' },
  overridePatch: { printReady: true },
})
assert(mixItem(userEnReady)?.status === 'fail', `printReady should elevate mix, got ${mixItem(userEnReady)?.status}`)
assert(!userEnReady.preflight.exportOk, 'printReady mix still exportOk')

const printWrap = generate('06-krem-wrap-modern', 0, 'tr', true)
assert(printWrap.preflight.items.find((i) => i.id === 'ds-label')?.status === 'pass', 'printReady wrap lost seam gate')
assert(!/>SEAM</.test(face(printWrap)), 'printReady still paints SEAM word')
assert(face(printWrap).includes('data-art="seam"'), 'printReady missing seam mark')

const creamEn = generate('06-krem-wrap-modern', 0, 'en')
assert(face(creamEn).includes('FACE CREAM'), 'en cream missing FACE CREAM')
assert(
  creamEn.copy.tagline.includes('Clinical') ||
    creamEn.copy.tagline.includes('repair') ||
    creamEn.copy.tagline.includes('overnight'),
  `en cream tagline ${creamEn.copy.tagline}`,
)
assert(!face(creamEn).includes('YÜZ KREMİ'), 'en cream has TR category')

const recelBrief = briefFrom(job('12-recel-label-eco'))
assert(languageId(recelBrief) === languageId({ ...recelBrief, copyLocale: 'en' }), 'languageId changed with copyLocale')
assert(languageId(recelBrief) === 'food-harvest', `languageId ${languageId(recelBrief)}`)

const p1 = ['12-recel-label-eco', '06-krem-wrap-modern', '04-serum-tuck-minimal', '01-parfum-tuck-luxury', '20-temizlik-tuck-minimal']
for (const slug of p1) {
    for (const setIdx of [0, 1, 2] as const) {
    const d = generate(slug, setIdx, 'tr')
    const collision = d.preflight.items.find((i) => i.id === 'collision')
    assert(d.preflight.collisions === false, `${slug} set${setIdx} P1 collision: ${collision?.detail}`)
    assert(d.preflight.exportOk, `${slug} set${setIdx} exportBLOCK ${d.preflight.items.filter((i) => i.status === 'fail').map((i) => i.id).join(',')}`)
  }
}

const serum0 = generate('04-serum-tuck-minimal', 0)
const clean0 = generate('20-temizlik-tuck-minimal', 0)
const serum1 = generate('04-serum-tuck-minimal', 1)
const serum2 = generate('04-serum-tuck-minimal', 2)
const serum0Face = face(serum0)
const clean0Face = face(clean0)
assert(serum0.copy.tagline !== clean0.copy.tagline, `minimal tagline twins: ${serum0.copy.tagline}`)
assert(/fresh-accent|YÜZEY BAKIMI/.test(clean0Face), 'cleaning minimal missing sector accent/class')
assert(/SERUM|data-hero="oval"|data-art="hero"/.test(serum0Face), 'serum minimal missing class/micro hero')
assert(serum0Face !== clean0Face, 'serum/cleaning minimal identical DNA')
assert(/YÜZEY/.test(clean0.copy.product.toLocaleUpperCase('tr')), `cleaning sample product ${clean0.copy.product}`)
assert(serum0Face.includes('30 ml') && !serum0Face.includes('30 ML'), 'serum plain volume still 30 ML')
assert(serum0Face.includes('℮'), 'serum plain volume missing ℮')
assert(clean0Face.includes('750 ml') && !clean0Face.includes('750 ML'), 'cleaning plain volume still 750 ML')
assert(serum0Face.includes('data-art="ingredient-badges"'), 'serum badges omitted')
{
  const panel = serum0.dieline.panels.find((n) => n.id === 'front' || n.id === 'label')
  const group = serum0Face.match(/<g data-art="ingredient-badges"[^>]*>([\s\S]*?)<\/g>/)?.[1] ?? ''
  const rectRe = /<rect x="([\d.]+)"[^>]*width="([\d.]+)"/g
  let m: RegExpExecArray | null
  let badgeCount = 0
  while (panel && (m = rectRe.exec(group))) {
    badgeCount += 1
    const x = Number(m[1])
    const w = Number(m[2])
    assert(x >= panel.x - 0.2, `serum badge left overflow ${x} < ${panel.x}`)
    assert(x + w <= panel.x + panel.w + 0.2, `serum badge right overflow ${x + w} > ${panel.x + panel.w}`)
  }
  assert(badgeCount >= 1, 'serum badge rects missing')
}

const serumCraft0 = scoreVisualCraft(serum0, serum0.designPlan!)
const cleanCraft0 = scoreVisualCraft(clean0, clean0.designPlan!)
const perfumeCraft = scoreVisualCraft(perfumeTr, perfumeTr.designPlan!)
assert(serumCraft0.visualCraft >= 76, `serum minimal craft ${serumCraft0.visualCraft}`)
assert(cleanCraft0.visualCraft >= 76, `cleaning minimal craft ${cleanCraft0.visualCraft}`)
assert(perfumeCraft.visualCraft >= 76, `perfume luxury craft dropped ${perfumeCraft.visualCraft}`)

const serumPlan0 = serum0.designPlan!
const serumPlan1 = serum1.designPlan!
const serumPlan2 = serum2.designPlan!
assert(
  serumPlan0.patternSystem.family !== serumPlan1.patternSystem.family ||
    serumPlan0.composition.opticalCenter !== serumPlan1.composition.opticalCenter ||
    face(serum1).includes('data-pattern='),
  `serum set0/set1 no readable delta pattern=${serumPlan0.patternSystem.family}/${serumPlan1.patternSystem.family}`,
)
assert(
  serumPlan2.composition.intent !== serumPlan0.composition.intent ||
    serumPlan2.composition.lockupBand.y !== serumPlan0.composition.lockupBand.y ||
    serumPlan2.heroGraphic.family !== serumPlan0.heroGraphic.family ||
    serumPlan2.composition.opticalCenter !== serumPlan0.composition.opticalCenter,
  'serum set2 floating delta missing',
)

const labelReady = mergeBrief(emptyBrief(), {
  brandName: 'Aurelia',
  productName: 'Noir',
  sector: 'parfüm',
  packagingMode: 'label',
  volume: '50 ml',
  dimensionsMm: { L: 90, W: 0, H: 70 },
})
assert(nextMissing(labelReady) === 'templateId', `labelReady asked ${nextMissing(labelReady)}`)

if (fails) {
  console.error(`P4 locale smoke failed (${fails})`)
  process.exit(1)
}
console.log('P4 locale + P1/P2 fixture smoke passed')
console.log(`  recel tr category/tagline: REÇEL / ${recelTr.copy.tagline}`)
console.log(`  recel en category/tagline: PRESERVE / ${recelEn.copy.tagline}`)
console.log(`  cream mix=${mixItem(cream)?.status} userMix=${mixItem(userEn)?.status} printReadyMix=${mixItem(userEnReady)?.status}`)
console.log(`  craft serum=${serumCraft0.visualCraft} clean=${cleanCraft0.visualCraft} perfume=${perfumeCraft.visualCraft}`)
