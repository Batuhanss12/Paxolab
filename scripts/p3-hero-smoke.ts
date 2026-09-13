/**
 * Phase 3 — hero placement: plan zone on set0, wrap axis, slab side, lockup gap.
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { applyPlanToSystem } from '../src/engine/brain/applyPlan'
import { createPlan } from '../src/engine/brain/DesignDirector'
import { heroPaintScale, heroYFrac } from '../src/engine/artwork/heroes'
import { heroAxisX, resolveHeroPlacement } from '../src/engine/artwork/heroes/heroPlacement'
import { axisGap } from '../src/engine/designSystem/artBox'
import { layoutFrontLockup } from '../src/engine/designSystem/lockupLayout'
import { resolveDesignSystem } from '../src/engine/designSystem/resolve'
import { JOBS, briefFrom } from './catalog-jobs'
import type { DesignPlan } from '../src/engine/brain/DesignPlan'
import type { Panel } from '../src/types'

let fails = 0
function assert(ok: boolean, msg: string) {
  if (!ok) {
    console.error('FAIL', msg)
    fails += 1
  }
}

function job(slug: string) {
  const found = JOBS.find((j) => j.slug === slug)
  if (!found) throw new Error(`missing job ${slug}`)
  return found
}

function generate(slug: string, setIdx: number) {
  const j = job(slug)
  const engine = new FormaLocalEngine()
  return engine.generate({
    brief: briefFrom(j),
    overridePatch: { variationIndex: setIdx, heroFamily: j.heroFamily },
  })
}

function face(design: ReturnType<typeof generate>) {
  return design.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

function frontPanel(design: ReturnType<typeof generate>): Panel {
  const p = design.dieline.panels.find((n) => n.id === 'front' || n.id === 'label' || n.id === 'trayFront')
  if (!p) throw new Error('no front')
  return p
}

function heroAttrs(svg: string): { family: string; x: number; y: number } | null {
  const m = svg.match(/data-art="hero"[^>]*data-hero="([^"]+)"(?:[^>]*data-hero-x="([\d.]+)")?(?:[^>]*data-hero-y="([\d.]+)")?/)
  if (!m) return null
  return { family: m[1], x: m[2] ? Number(m[2]) : NaN, y: m[3] ? Number(m[3]) : NaN }
}

const dummyPlan = {
  composition: { heroZone: { y: 0.135, x: 0.62 }, intent: 'asymmetric' },
  heroGraphic: { scale: 0.9 },
  crop: { heroCrop: 0.9 },
  variationIndex: 0,
} as unknown as DesignPlan

assert(Math.abs(heroYFrac(dummyPlan, 0.18) - 0.135) < 1e-9, 'P3-A set0 heroYFrac ignores plan')
assert(heroYFrac(undefined, 0.18) === 0.18, 'P3-A kitY fallback')
const kitScale = heroPaintScale(dummyPlan)
assert(kitScale >= 0.75 && kitScale <= 1.15, `P3-A kit scale clamp ${kitScale}`)
assert(Math.abs(kitScale - 0.81) < 1e-9, `P3-A set0 applies scale×crop (${kitScale})`)

const wrap06 = generate('06-krem-wrap-modern', 1)
const wrapFace = face(wrap06)
const wrapHero = heroAttrs(wrapFace)
const wrapPlan = wrap06.designPlan
assert(!!wrapHero, '06 set1 missing hero')
assert(wrapPlan?.composition.heroZone.x === 0.5, `06 set1 plan X ${wrapPlan?.composition.heroZone.x}`)
assert(wrapHero != null && Math.abs(wrapHero.x - 0.5) < 0.02, `06 set1 painted X ${wrapHero?.x} (want ~0.5)`)
assert(!wrapPlan?.risks.includes('hero-omitted-lockup'), '06 set1 omitted hero')

const wrapPanel = frontPanel(wrap06)
const wrapSys = applyPlanToSystem(resolveDesignSystem(wrap06.brief, wrap06.structureId), wrapPlan!)
assert(Math.abs(heroAxisX(wrapPlan, wrapSys, wrapPanel) - 0.5) < 1e-9, 'P3-B wrap axis not 0.5')
const wrapPlace = resolveHeroPlacement({
  panel: wrapPanel,
  system: wrapSys,
  plan: wrapPlan,
  family: wrapPlan!.heroGraphic.family,
  mode: 'lib',
  copy: wrap06.copy,
  overrides: wrap06.overrides,
  ingredientClaims: wrap06.brief.ingredientClaims ?? '',
})
const wrapLayout = layoutFrontLockup(wrapPanel, wrapSys, wrap06.copy, wrap06.overrides, true)
if (wrapPlace.omitted) {
  assert(false, '06 set1 placement omitted')
} else {
  const col = { id: 'lumina', x: wrapLayout.ax - 1.8, y: wrapLayout.rect.y, w: Math.max(18, wrapLayout.rect.w * 0.35), h: wrapLayout.rect.h }
  assert(axisGap(wrapPlace.box, col) >= 2 || wrapPlace.box.y + wrapPlace.box.h + 2.4 <= wrapLayout.rect.y, '06 botanical intersects LUMINA column')
}

const lux = generate('01-parfum-tuck-luxury', 0)
const luxFace = face(lux)
const luxPlan = lux.designPlan
assert(!!luxPlan && luxPlan.composition.opticalCenter >= 0.36 && luxPlan.composition.opticalCenter <= 0.4, `01 luxury optical ${luxPlan?.composition.opticalCenter}`)
assert(!!luxPlan && luxPlan.composition.heroZone.y >= 0.12 && luxPlan.composition.heroZone.y <= 0.15, `01 luxury heroY ${luxPlan?.composition.heroZone.y}`)
assert(/data-art="gold-bar"|goldBar|GOLD|50\s*ML/i.test(luxFace) || /50/.test(luxFace), '01 gold/volume missing')
assert(!/Nº 01|Nº\s*01/.test(luxFace), '01 picked up banned series mark')
assert(lux.preflight.collisions === false, `01 set0 collision ${lux.preflight.items.find((i) => i.id === 'collision')?.detail}`)

const wrapLux2 = generate('05-parfum-wrap-luxury', 2)
const wrapLuxHero = heroAttrs(face(wrapLux2))
assert(!!wrapLuxHero, '05 set2 missing hero')
assert(wrapLux2.designPlan?.composition.intent === 'diagonal' || wrapLux2.designPlan?.composition.intent === 'editorial', `05 set2 intent ${wrapLux2.designPlan?.composition.intent}`)
assert(wrapLuxHero != null && Math.abs(wrapLuxHero.x - 0.5) > 0.04, `05 set2 hero X ${wrapLuxHero?.x} should be off-center`)

const eco = generate('21-krem-eco-monstera', 0)
const ecoPlan = eco.designPlan
const ecoPanel = frontPanel(eco)
const ecoSys = applyPlanToSystem(resolveDesignSystem(eco.brief, eco.structureId), ecoPlan!)
const ecoPlace = resolveHeroPlacement({
  panel: ecoPanel,
  system: ecoSys,
  plan: ecoPlan,
  family: 'monstera',
  mode: 'lib',
  copy: eco.copy,
  overrides: eco.overrides,
})
const ecoLayout = layoutFrontLockup(ecoPanel, ecoSys, eco.copy, eco.overrides, false)
assert(!ecoPlace.omitted, '21 monstera omitted')
assert(ecoLayout.rect.y - (ecoPlace.box.y + ecoPlace.box.h) >= 2.4 - 0.05, `21 gap ${ecoLayout.rect.y - (ecoPlace.box.y + ecoPlace.box.h)}`)
assert(eco.preflight.collisions === false, `21 collision ${eco.preflight.items.find((i) => i.id === 'collision')?.detail}`)

const elec0 = generate('14-kulaklik-tuck-modern', 0)
const elec1 = generate('14-kulaklik-tuck-modern', 1)
const elec0Face = face(elec0)
const elec1Face = face(elec1)
const elecPanel = frontPanel(elec0)
const leftRe = new RegExp(`<rect x="${elecPanel.x}"[^>]*width="2\\.4"`)
const rightRe = new RegExp(`<rect x="${elecPanel.x + elecPanel.w - 2.4}"[^>]*width="2\\.4"`)
assert(elec0.designPlan?.composition.intent === 'grid', `14 set0 intent ${elec0.designPlan?.composition.intent}`)
assert(elec1.designPlan?.composition.intent === 'asymmetric', `14 set1 intent ${elec1.designPlan?.composition.intent}`)
assert(leftRe.test(elec0Face), '14 set0 missing left tech slab')
assert(rightRe.test(elec1Face), '14 set1 missing right tech slab')

const prior = ['01-parfum-tuck-luxury', '04-serum-tuck-minimal', '08-zeytinyagi-tuck-luxury', '06-krem-wrap-modern']
for (const slug of prior) {
  for (const setIdx of [0, 1] as const) {
    const d = generate(slug, setIdx)
    assert(d.preflight.collisions === false, `${slug} set${setIdx} Phase1 collision: ${d.preflight.items.find((i) => i.id === 'collision')?.detail}`)
  }
}

if (fails) {
  console.error(`P3 hero smoke failed (${fails})`)
  process.exit(1)
}
console.log('P3 hero placement smoke passed')
console.log(`  06 wrap set1 x=${wrapHero?.x} y=${wrapHero?.y} family=${wrapHero?.family}`)
console.log(`  01 luxury optical=${luxPlan?.composition.opticalCenter} heroY=${luxPlan?.composition.heroZone.y}`)
console.log(`  05 wrap set2 x=${wrapLuxHero?.x} intent=${wrapLux2.designPlan?.composition.intent}`)
console.log(`  21 monstera gap=${(ecoLayout.rect.y - (ecoPlace.box.y + ecoPlace.box.h)).toFixed(2)}`)
