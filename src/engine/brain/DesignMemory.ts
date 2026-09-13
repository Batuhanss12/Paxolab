import type { StyleType } from '../../types'
import type { HeroFamily, PatternFamily } from './DesignPlan'

export type ArtMemoryEntry = {
  hero: HeroFamily
  pattern: PatternFamily
}

const LIMIT = 4
let session: ArtMemoryEntry[] = []
const byStyle: Partial<Record<StyleType, ArtMemoryEntry>> = {}

export function lastFamilies(): string[] {
  return session.flatMap((entry) => [entry.hero, entry.pattern]).filter((id) => id !== 'none')
}

export function lastHeroes(): HeroFamily[] {
  return session.map((entry) => entry.hero).filter((id) => id !== 'none')
}

export function lastForStyle(style: StyleType): ArtMemoryEntry | undefined {
  return byStyle[style]
}

export function rememberArt(style: StyleType, entry: ArtMemoryEntry): void {
  session = [...session, entry].slice(-LIMIT)
  byStyle[style] = entry
}

export function resetArtMemory(): void {
  session = []
  for (const key of Object.keys(byStyle) as StyleType[]) delete byStyle[key]
}
