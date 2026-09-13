import type { BackgroundTreatment } from './DesignPlan'

export type RecipeSlot = 'preferred' | 'alt'

export type StudioRecipe = {
  hero: RecipeSlot
  pattern: RecipeSlot
  crop: 'tight' | 'open'
  chrome: 'full' | 'quiet'
  background?: BackgroundTreatment
  heroY: number
  scale: number
  opticalCenter?: number
  lockup?: 'center' | 'left'
  typeScale?: number
  trackingScale?: number
  primitive: boolean
}

/** Six faces after set 0. Set 0 stays the kit. Index 1 = first recipe. */
const RECIPES: StudioRecipe[] = [
  { hero: 'alt', pattern: 'alt', crop: 'tight', chrome: 'full', heroY: 0.12, scale: 1.05, lockup: 'center', typeScale: 1.06, trackingScale: 0.92, primitive: true },
  { hero: 'preferred', pattern: 'alt', crop: 'open', chrome: 'quiet', background: 'vignette', heroY: 0.11, scale: 0.86, opticalCenter: 0.38, lockup: 'left', typeScale: 0.94, trackingScale: 1.12, primitive: true },
  { hero: 'alt', pattern: 'preferred', crop: 'open', chrome: 'quiet', heroY: 0.13, scale: 0.98, opticalCenter: 0.43, lockup: 'center', typeScale: 1.1, trackingScale: 0.86, primitive: true },
  { hero: 'alt', pattern: 'alt', crop: 'open', chrome: 'quiet', background: 'vignette', heroY: 0.1, scale: 0.82, opticalCenter: 0.36, lockup: 'left', typeScale: 0.9, trackingScale: 1.18, primitive: true },
  { hero: 'preferred', pattern: 'preferred', crop: 'open', chrome: 'quiet', background: 'vignette', heroY: 0.165, scale: 0.78, opticalCenter: 0.44, lockup: 'center', typeScale: 0.96, trackingScale: 1.05, primitive: false },
  { hero: 'alt', pattern: 'preferred', crop: 'tight', chrome: 'full', heroY: 0.14, scale: 1.1, lockup: 'left', typeScale: 1.04, trackingScale: 0.95, primitive: true },
]

export function studioRecipe(index: number): StudioRecipe | null {
  if (index <= 0) return null
  return RECIPES[(index - 1) % RECIPES.length]
}

export function pickAllowed<T>(allowed: T[], which: RecipeSlot, index = 0): T {
  const preferred = allowed[0]
  if (which === 'preferred' || allowed.length < 2) return preferred
  const altIdx = 1 + (index % Math.max(1, allowed.length - 1))
  return allowed[altIdx] ?? allowed.find((item) => item !== preferred) ?? preferred
}
