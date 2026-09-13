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

// --- Generative recipe engine ---
// For indices beyond the hardcoded set, generate recipes algorithmically
// by combining parameter axes. This allows unlimited variation without
// manually authoring each combination.

const HERO_SLOTS: RecipeSlot[] = ['preferred', 'alt']
const PATTERN_SLOTS: RecipeSlot[] = ['preferred', 'alt']
const CROPS: ('tight' | 'open')[] = ['tight', 'open']
const CHROMES: ('full' | 'quiet')[] = ['full', 'quiet']
const BACKGROUNDS: (BackgroundTreatment | undefined)[] = [undefined, 'vignette', 'quiet-paper']
const LOCKUPS: ('center' | 'left')[] = ['center', 'left']

/** Deterministic pseudo-random based on index — stable across runs. */
function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/** Generate a recipe from the parameter space using a deterministic seed. */
export function generateRecipe(index: number): StudioRecipe {
  const seed = index * 7 + 13
  const hero = HERO_SLOTS[Math.floor(hash(seed) * HERO_SLOTS.length)]
  const pattern = PATTERN_SLOTS[Math.floor(hash(seed + 1) * PATTERN_SLOTS.length)]
  const crop = CROPS[Math.floor(hash(seed + 2) * CROPS.length)]
  const chrome = CHROMES[Math.floor(hash(seed + 3) * CHROMES.length)]
  const background = BACKGROUNDS[Math.floor(hash(seed + 4) * BACKGROUNDS.length)]
  const lockup = LOCKUPS[Math.floor(hash(seed + 5) * LOCKUPS.length)]
  const heroY = 0.1 + hash(seed + 6) * 0.08
  const scale = 0.78 + hash(seed + 7) * 0.35
  const opticalCenter = 0.36 + hash(seed + 8) * 0.1
  const typeScale = 0.9 + hash(seed + 9) * 0.22
  const trackingScale = 0.86 + hash(seed + 10) * 0.34
  const primitive = hash(seed + 11) > 0.25
  return {
    hero,
    pattern,
    crop,
    chrome,
    background,
    heroY,
    scale,
    opticalCenter,
    lockup,
    typeScale,
    trackingScale,
    primitive,
  }
}

export function studioRecipe(index: number): StudioRecipe | null {
  if (index <= 0) return null
  if (index <= RECIPES.length) return RECIPES[index - 1]
  // Beyond hardcoded set: generate algorithmically
  return generateRecipe(index)
}

export function pickAllowed<T>(allowed: T[], which: RecipeSlot, index = 0): T {
  const preferred = allowed[0]
  if (which === 'preferred' || allowed.length < 2) return preferred
  const altIdx = 1 + (index % Math.max(1, allowed.length - 1))
  return allowed[altIdx] ?? allowed.find((item) => item !== preferred) ?? preferred
}
