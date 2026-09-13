import type { HeroFamily, PatternFamily } from './DesignPlan'

export type ArtMemoryEntry = {
  hero: HeroFamily
  pattern: PatternFamily
}

const LIMIT = 4
let session: ArtMemoryEntry[] = []

export function lastFamilies(): string[] {
  return session.flatMap((entry) => [entry.hero, entry.pattern]).filter((id) => id !== 'none')
}

export function lastHeroes(): HeroFamily[] {
  return session.map((entry) => entry.hero).filter((id) => id !== 'none')
}

export function rememberArt(entry: ArtMemoryEntry): void {
  session = [...session, entry].slice(-LIMIT)
}

export function resetArtMemory(): void {
  session = []
}
