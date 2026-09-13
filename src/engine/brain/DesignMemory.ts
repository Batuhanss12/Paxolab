import type { StyleType } from '../../types'
import type { HeroFamily, PatternFamily } from './DesignPlan'
import { idbGetMemory, idbPutMemory } from '../../storage'

export type ArtMemoryEntry = {
  hero: HeroFamily
  pattern: PatternFamily
}

const LIMIT = 4
const MEMORY_KEY = 'designMemory.v1'

interface PersistedMemory {
  session: ArtMemoryEntry[]
  byStyle: Partial<Record<StyleType, ArtMemoryEntry>>
}

// In-memory cache — hydrated from IndexedDB on first access.
let session: ArtMemoryEntry[] = []
const byStyle: Partial<Record<StyleType, ArtMemoryEntry>> = {}
let hydrated = false

async function hydrate(): Promise<void> {
  if (hydrated) return
  hydrated = true
  const stored = (await idbGetMemory(MEMORY_KEY)) as PersistedMemory | null
  if (stored) {
    session = stored.session ?? []
    for (const key of Object.keys(stored.byStyle ?? {}) as StyleType[]) {
      byStyle[key] = stored.byStyle[key]
    }
  }
}

async function persist(): Promise<void> {
  const data: PersistedMemory = { session, byStyle }
  await idbPutMemory(MEMORY_KEY, data)
}

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
  void persist()
}

export function resetArtMemory(): void {
  session = []
  for (const key of Object.keys(byStyle) as StyleType[]) delete byStyle[key]
  void persist()
}

/** Kick off async hydration — call once at app startup. */
export function initDesignMemory(): void {
  void hydrate()
}
