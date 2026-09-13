import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { measureLockupCollision, measureFrontDecorCollision } from '../src/engine/designSystem'
import { resolveDesignSystem } from '../src/engine/designSystem/resolve'
import { JOBS, briefFrom } from './catalog-jobs'

const engine = new FormaLocalEngine()
for (const slug of ['04-serum-tuck-minimal', '22-serum-eco-monstera', '28-serum-modern-zebra']) {
  const job = JOBS.find((j) => j.slug === slug)!
  resetArtMemory()
  const spec = engine.generate({
    brief: briefFrom(job),
    overridePatch: { variationIndex: job.variationIndex ?? 0, heroFamily: job.heroFamily },
  })
  const sys = resolveDesignSystem(spec.brief, spec.structureId)
  const front = spec.dieline.panels.find((p) => p.id === 'front' || p.id === 'label' || p.id === 'trayFront')!
  const labelFace = spec.kind === 'label' || sys.grammar === 'label'
  const lockup = measureLockupCollision(front, sys, spec.copy, spec.overrides, labelFace)
  const decor = measureFrontDecorCollision(front, sys, spec.copy, spec.overrides, labelFace, spec.brief.ingredientClaims ?? '')
  console.log(`${slug}: lockup=[${lockup.reasons.join(',')}] decor=[${decor.reasons.join(',')}]`)
  console.log(`  panel: x=${front.x} y=${front.y} w=${front.w} h=${front.h}`)
  console.log(`  volume: "${spec.copy.volume}" goldBar=${sys.goldBar} style=${sys.style}`)
}
