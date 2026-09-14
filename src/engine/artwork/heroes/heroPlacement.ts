/**
 * P3 — Hero placement: axis contract, plan zone, clearance vs lockup/volume.
 * Painters consume the resolved placement; preflight re-checks the same numbers.
 */
import type { DesignOverrides, Panel } from '../../../types'
import type { DesignPlan, HeroFamily } from '../../brain/DesignPlan'
import { axisGap, type ArtBox } from '../../designSystem/artBox'
import {
  collectFrontDecorBoxes,
  collectLockupGlyphBoxes,
  layoutFrontLockup,
  type CollisionReport,
  type LockupCopy,
} from '../../designSystem/lockupLayout'
import type { DecorFamily, DesignSystem } from '../../designSystem/types'
import { heroPaintScale, heroYFrac, kitHeroFamily } from './heroScale'

export type HeroPaintKind = 'glyph' | 'plaque' | 'slab-left' | 'slab-right' | 'slab-top'

export type HeroPlacement = {
  family: HeroFamily
  xFrac: number
  yFrac: number
  scale: number
  omitted: boolean
  reason?: string
  kind: HeroPaintKind
  box: ArtBox
}

export type HeroPlacementInput = {
  panel: Panel
  system: DesignSystem
  plan?: DesignPlan
  family: HeroFamily
  mode: 'kit' | 'lib'
  copy?: LockupCopy
  overrides?: Pick<DesignOverrides, 'titleScale'>
  ingredientClaims?: string
}

export function kitDefaultY(decor: DecorFamily): number {
  if (decor === 'crest') return 0.148
  if (decor === 'cartouche') return 0.16
  if (decor === 'leaf') return 0.17
  if (decor === 'badge') return 0.18
  if (decor === 'olive' || decor === 'harvest') return 0.165
  if (decor === 'drop') return 0.14
  if (decor === 'oval') return 0.18
  return 0.148
}

export function slabKind(xFrac: number, intent?: DesignPlan['composition']['intent']): HeroPaintKind {
  if (intent === 'grid' && xFrac >= 0.4 && xFrac <= 0.6) return 'slab-left'
  if (xFrac < 0.4) return 'slab-left'
  if (xFrac > 0.6) return 'slab-right'
  return 'slab-top'
}

/** P3-B: hero ↔ lockup axis. Wrap stays top-center except diagonal/editorial X. */
export function heroAxisX(plan: DesignPlan | undefined, system: DesignSystem, _panel: Panel): number {
  const intent = plan?.composition.intent ?? 'symmetric'
  const zoneX = plan?.composition.heroZone.x
  const wrap = system.wrapSeam

  if (wrap) {
    if (intent === 'diagonal') return zoneX ?? 0.58
    if (intent === 'editorial') return zoneX ?? 0.68
    return 0.5
  }

  if (intent === 'asymmetric' || intent === 'offset' || intent === 'diagonal' || intent === 'editorial') {
    return zoneX ?? (intent === 'editorial' ? 0.68 : intent === 'diagonal' ? 0.58 : intent === 'offset' ? 0.32 : 0.62)
  }

  if (intent === 'grid') return zoneX ?? 0.5
  if (zoneX != null && zoneX >= 0.45 && zoneX <= 0.55) return zoneX
  return 0.5
}

export function heroApproxBox(
  panel: Panel,
  kind: HeroPaintKind,
  xFrac: number,
  yFrac: number,
  scale: number,
  family: HeroFamily,
): ArtBox {
  const { x, y, w, h } = panel
  if (kind === 'slab-left') return { id: 'hero', x, y, w: 2.4, h }
  if (kind === 'slab-right') return { id: 'hero', x: x + w - 2.4, y, w: 2.4, h }
  if (kind === 'slab-top') return { id: 'hero', x, y: y + h * yFrac, w, h: 2 }
  if (kind === 'plaque') {
    const pw = w * 0.72 * Math.min(1, scale)
    const ph = h * 0.22 * Math.min(1, scale)
    return { id: 'hero', x: x + w * xFrac - pw / 2, y: y + h * yFrac - ph / 2, w: pw, h: ph }
  }
  const cx = x + w * xFrac
  const cy = y + h * yFrac
  const r = glyphRadius(panel, family, scale)
  const tall = family === 'botanical' || family === 'monstera' || family === 'palm' || family === 'harvest' || family === 'line-scene'
  const hh = r * (tall ? 2.2 : 2)
  const ww = r * 2.2
  return { id: 'hero', x: cx - ww / 2, y: cy - hh / 2, w: ww, h: hh }
}

function glyphRadius(panel: Panel, family: HeroFamily, scale: number): number {
  const m = Math.min(panel.w, panel.h)
  if (family === 'crest') return m * 0.082 * scale
  if (family === 'seal') return Math.min(8.4, panel.w * 0.16) * scale
  if (family === 'emblem') return m * 0.09 * scale
  if (family === 'oval' || family === 'organic-wave') return Math.min(7.2, panel.w * 0.14) * scale
  if (family === 'none') return 0
  return m * 0.095 * scale
}

function paintKind(
  system: DesignSystem,
  plan: DesignPlan | undefined,
  mode: 'kit' | 'lib',
  xFrac: number,
): HeroPaintKind {
  if (mode === 'kit' && system.decor === 'grid' && system.style === 'luxury') return 'plaque'
  if (mode === 'kit' && system.decor === 'grid') return slabKind(xFrac, plan?.composition.intent)
  return 'glyph'
}

function baseHeroScale(plan: DesignPlan | undefined, system: DesignSystem, mode: 'kit' | 'lib'): number {
  const minimal = system.style === 'minimal' ? 0.5 : 1
  if (mode === 'kit') return heroPaintScale(plan) * minimal
  const label = system.grammar === 'label' ? 0.82 : 1
  return ((plan?.heroGraphic.scale ?? 1) * (plan?.crop.heroCrop ?? 1)) * label * minimal
}

function startY(plan: DesignPlan | undefined, system: DesignSystem): number {
  let yFrac = heroYFrac(plan, kitDefaultY(system.decor))
  if (system.grammar === 'label') yFrac = Math.min(0.12, yFrac)
  if (system.wrapSeam) yFrac = Math.min(yFrac, 0.11)
  return yFrac
}

type Obstacle = { box: ArtBox; gap: number }

function obstaclesFor(
  panel: Panel,
  system: DesignSystem,
  copy: LockupCopy,
  overrides: Pick<DesignOverrides, 'titleScale'>,
  ingredientClaims: string,
): Obstacle[] {
  const labelFace = system.grammar === 'label'
  const layout = layoutFrontLockup(panel, system, copy, overrides, labelFace)
  const out: Obstacle[] = [{ box: { id: 'lockup', x: layout.rect.x, y: layout.rect.y, w: layout.rect.w, h: layout.rect.h }, gap: 2.4 }]
  for (const box of collectLockupGlyphBoxes(layout, system, copy)) {
    out.push({ box, gap: 2 })
  }
  for (const box of collectFrontDecorBoxes(panel, system, copy, overrides, labelFace, ingredientClaims)) {
    out.push({ box, gap: labelFace ? 1.2 : 1.6 })
  }
  return out
}

function hitsObstacles(hero: ArtBox, obstacles: Obstacle[]): string | undefined {
  for (const item of obstacles) {
    if (axisGap(hero, item.box) < item.gap) return item.box.id
  }
  return undefined
}

export function resolveHeroPlacement(input: HeroPlacementInput): HeroPlacement {
  const { panel, system, plan, family, mode } = input
  const xFrac = heroAxisX(plan, system, panel)
  const kind = paintKind(system, plan, mode, xFrac)
  let yFrac = startY(plan, system)
  let scale = baseHeroScale(plan, system, mode)
  const empty = { id: 'hero', x: 0, y: 0, w: 0, h: 0 }

  if (family === 'none') {
    return { family, xFrac, yFrac, scale, omitted: true, kind, box: empty }
  }

  const structural = kind.startsWith('slab-')
  const obstacles =
    input.copy != null
      ? obstaclesFor(panel, system, input.copy, input.overrides ?? { titleScale: 1 }, input.ingredientClaims ?? '')
      : []

  const boxAt = (s: number, y: number) => heroApproxBox(panel, kind, xFrac, y, s, family)

  if (structural || obstacles.length === 0) {
    return { family, xFrac, yFrac, scale, omitted: false, kind, box: boxAt(scale, yFrac) }
  }

  const floor = panel.h < 90 ? 0.52 : Math.min(scale, 0.75)
  let hit = hitsObstacles(boxAt(scale, yFrac), obstacles)
  while (hit && scale > floor + 0.001) {
    scale = Math.max(floor, scale * 0.88)
    hit = hitsObstacles(boxAt(scale, yFrac), obstacles)
  }
  while (hit && yFrac > 0.06) {
    yFrac = Math.max(0.06, yFrac - 0.02)
    hit = hitsObstacles(boxAt(scale, yFrac), obstacles)
  }
  if (hit) {
    return { family, xFrac, yFrac, scale, omitted: true, reason: 'hero-omitted-lockup', kind, box: empty }
  }
  return { family, xFrac, yFrac, scale, omitted: false, kind, box: boxAt(scale, yFrac) }
}

export function measureHeroCollision(
  panel: Panel,
  system: DesignSystem,
  copy: LockupCopy,
  overrides: Pick<DesignOverrides, 'titleScale'>,
  _labelFace: boolean,
  ingredientClaims: string,
  plan: DesignPlan | undefined,
): CollisionReport {
  const kitFamily = kitHeroFamily(system.decor)
  const family = plan?.heroGraphic.family && plan.heroGraphic.family !== 'none' ? plan.heroGraphic.family : kitFamily
  if (!plan || family === 'none') return { hit: false, reasons: [] }
  const useLib = family !== kitFamily
  const place = resolveHeroPlacement({
    panel,
    system,
    plan,
    family,
    mode: useLib || kitFamily === 'none' ? 'lib' : 'kit',
    copy,
    overrides,
    ingredientClaims,
  })
  if (place.omitted) return { hit: false, reasons: [] }
  const labelFace = system.grammar === 'label'
  const layout = layoutFrontLockup(panel, system, copy, overrides, labelFace)
  const checks: Obstacle[] = [
    { box: { id: 'lockup', x: layout.rect.x, y: layout.rect.y, w: layout.rect.w, h: layout.rect.h }, gap: 2.4 },
    ...collectLockupGlyphBoxes(layout, system, copy).map((box) => ({ box, gap: 2 })),
    ...collectFrontDecorBoxes(panel, system, copy, overrides, labelFace, ingredientClaims).map((box) => ({
      box,
      gap: labelFace ? 1.2 : 1.6,
    })),
  ]
  const reasons: string[] = []
  if (place.kind.startsWith('slab-')) return { hit: false, reasons }
  for (const item of checks) {
    if (axisGap(place.box, item.box) < item.gap) reasons.push(`hero-${item.box.id}`)
  }
  return { hit: reasons.length > 0, reasons }
}
