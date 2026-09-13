import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { runConversation } from '../src/engine/conversation'
import { emptyBrief } from '../src/engine/fields'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import type { DesignBrief } from '../src/types'

function heroes(markup: string): number {
  return (markup.match(/data-art="hero"/g) || []).length
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }): string {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label')?.markup ?? ''
}

const log: string[] = []
function step(ok: boolean, msg: string) {
  log.push(`${ok ? 'OK' : 'ERR'}  ${msg}`)
  if (!ok) console.error('ERR', msg)
  else console.log('OK ', msg)
}

resetArtMemory()
const engine = new FormaLocalEngine()

let brief: DesignBrief = emptyBrief()
let awaiting: ReturnType<typeof runConversation>['awaiting'] = null
let design: ReturnType<FormaLocalEngine['generate']> | null = null

const turns = [
  'Aurelia Noir için siyah-altın parfüm kutusu, 50 ml, 70×35×140 mm',
  'örnek',
  'örnek',
  'örnek',
]

for (const text of turns) {
  const result = runConversation({
    text,
    attachments: [],
    brief,
    awaiting,
    hasDesign: !!design,
  })
  brief = result.brief
  awaiting = result.awaiting
  step(true, `ask “${text.slice(0, 48)}” → note=${result.note} awaiting=${result.awaiting ?? '—'} gen=${result.shouldGenerate} templates=${result.showTemplates}`)
  step(!!result.replies[0], `  reply: ${(result.replies[0] ?? '').slice(0, 120)}`)
  if (result.shouldGenerate) {
    try {
      design = engine.generate({
        brief,
        prev: design ?? undefined,
        overridePatch: result.overridePatch,
        copyPatch: result.copyPatch,
      })
    } catch (err) {
      step(false, `generate threw: ${err instanceof Error ? err.message : err}`)
      break
    }
  }
}

if (!design && brief.brandName) {
  if (!brief.templateId) brief = { ...brief, templateId: 'fm-cos-tuck-edp' }
  if (!brief.packagingMode) brief = { ...brief, packagingMode: 'box' }
  try {
    design = engine.generate({ brief })
    step(true, `forced generate after ask loop (template ${brief.templateId})`)
  } catch (err) {
    step(false, `forced generate threw: ${err instanceof Error ? err.message : err}`)
  }
}

step(!/örnek/i.test(brief.brandName), `brand stayed user-owned (${brief.brandName})`)
step(brief.productName !== 'siyah-altın', `product is not palette (${brief.productName || '—'})`)
step(/Aurelia/i.test(brief.brandName), `brand contains Aurelia (${brief.brandName})`)

if (!design) {
  step(false, 'no design produced')
  process.exit(1)
}

const f = face(design)
const fails = design.preflight.items.filter((i) => i.status === 'fail')
const warns = design.preflight.items.filter((i) => i.status === 'warn')

step(!!design.designPlan?.artDirection, `plan artDirection=${design.designPlan?.artDirection.vocabulary}`)
step(!!design.designPlan?.heroGraphic.family, `hero=${design.designPlan?.heroGraphic.family} pattern=${design.designPlan?.patternSystem.family}`)
step(!!design.designPlan?.visualConcept.id, `concept=${design.designPlan?.visualConcept.id}`)
step(heroes(f) <= 1, `front heroes=${heroes(f)}`)
step(f.includes('AURELIA') || f.includes(design.copy.brand.toUpperCase()), `brand on front (${design.copy.brand})`)
step(!/data-mark="barcode"/.test(f), 'barcode not on front')
step(!fails.length, `preflight fails=${fails.map((i) => i.id).join(',') || 'none'}`)
step(!!design.critique, `critique verdict=${design.critique?.verdict} repair=${design.critique?.repaired ?? false}`)
step(design.artwork.layers.length > 0, `layers=${design.artwork.layers.map((l) => l.panelId).join(',')}`)
step(!!design.dieline.panels.find((p) => p.role === 'glue' || p.id === 'glue'), 'glue panel present')

const glue = design.artwork.layers.find((l) => l.panelId === 'glue' || l.panelId === 'overlap')
if (glue) step(glue.markup.includes('GLUE') && !/data-art="hero"/.test(glue.markup), 'glue stays GLUE, no hero')

console.log('')
console.log('BRIEF', {
  brand: brief.brandName,
  product: brief.productName,
  sector: brief.sector,
  sub: brief.subProduct,
  mode: brief.packagingMode,
  volume: brief.volume,
  dims: brief.dimensionsMm,
  template: design.templateId,
  style: brief.styleType || design.brief.styleType,
})
console.log('PLAN', design.designPlan?.summaryTr)
console.log('PREFLIGHT warn', warns.map((i) => `${i.id}:${i.detail}`).join(' · ') || 'none')
console.log('CRITIQUE', design.critique?.hints.map((h) => `${h.action}:${h.topic}`).join(' · '))

const iter = runConversation({
  text: 'daha lüks yap',
  attachments: [],
  brief: design.brief,
  awaiting: null,
  hasDesign: true,
})
step(iter.overridePatch?.directorCue === 'luxury-tighten', `iterate cue=${iter.overridePatch?.directorCue}`)
const tight = engine.generate({
  brief: design.brief,
  prev: design,
  overridePatch: iter.overridePatch,
})
const tf = face(tight)
step(tight.designPlan?.decor.restrainExtras === true, 'tighten restrainExtras')
step(!tf.includes('fill-opacity="0.9"'), 'tighten dropped diamonds')
step(tf.includes(design.copy.brand.toUpperCase()), 'tighten kept brand')

if (log.some((l) => l.startsWith('ERR'))) {
  console.error(`Flow trace failed (${log.filter((l) => l.startsWith('ERR')).length})`)
  process.exit(1)
}
console.log('Flow trace passed')
