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
  primitive: boolean
}

/** Six faces after set 0. Set 0 stays the kit. Index 1 = first recipe. */
const RECIPES: StudioRecipe[] = [
  { hero: 'alt', pattern: 'alt', crop: 'tight', chrome: 'full', heroY: 0.12, scale: 1.05, primitive: true },
  { hero: 'preferred', pattern: 'alt', crop: 'open', chrome: 'quiet', background: 'vignette', heroY: 0.11, scale: 0.86, opticalCenter: 0.38, primitive: true },
  { hero: 'alt', pattern: 'preferred', crop: 'open', chrome: 'quiet', heroY: 0.13, scale: 0.98, opticalCenter: 0.43, primitive: true },
  { hero: 'alt', pattern: 'alt', crop: 'open', chrome: 'quiet', background: 'vignette', heroY: 0.1, scale: 0.82, opticalCenter: 0.36, primitive: true },
  { hero: 'preferred', pattern: 'preferred', crop: 'open', chrome: 'quiet', background: 'vignette', heroY: 0.165, scale: 0.78, opticalCenter: 0.44, primitive: false },
  { hero: 'alt', pattern: 'preferred', crop: 'tight', chrome: 'full', heroY: 0.14, scale: 1.1, primitive: true },
]

export function studioRecipe(index: number): StudioRecipe | null {
  if (index <= 0) return null
  return RECIPES[(index - 1) % RECIPES.length]
}

export function pickAllowed<T>(allowed: T[], which: RecipeSlot): T {
  const preferred = allowed[0]
  if (which === 'preferred' || allowed.length < 2) return preferred
  return allowed.find((item) => item !== preferred) ?? preferred
}
