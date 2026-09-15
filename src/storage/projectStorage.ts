/**
 * Project storage — multi-project CRUD with IndexedDB + localStorage fallback.
 * Replaces single-session localStorage with named project slots.
 * Cloud sync stays in projectStore.ts; this layer handles local persistence.
 */
import type { AppState } from '../appState'
import type { DesignSpec } from '../types'
import { documentFromArtwork } from '../engine/document'
import { idbAvailable, idbDeleteProject, idbGetProject, idbListProjects, idbPutProject, type StoredProject } from './indexedDb'

const ACTIVE_KEY = 'forma.activeProjectId.v1'
const LS_PREFIX = 'forma.project.'

export type PersistedSession = Pick<
  AppState,
  'phase' | 'messages' | 'brief' | 'awaiting' | 'design' | 'designHistory' | 'designFuture' | 'tab' | 'inputsOpen'
> &
  Partial<Pick<AppState, 'conversation'>>

export interface ProjectMeta {
  id: string
  title: string
  updatedAt: number
}

function withDocument(design: DesignSpec | null): DesignSpec | null {
  if (!design || design.document) return design
  return {
    ...design,
    document: documentFromArtwork(
      design.id,
      `${design.copy.brand} · ${design.copy.product}`,
      design.dieline,
      design.artwork,
      design.generatedAt,
    ),
  }
}

function sessionFromPersisted(state: PersistedSession): Partial<AppState> {
  return {
    ...state,
    design: withDocument(state.design),
    designHistory: (state.designHistory ?? []).map((design) => withDocument(design) as DesignSpec),
    designFuture: (state.designFuture ?? []).map((design) => withDocument(design) as DesignSpec),
  }
}

export function toPersistedSession(state: AppState): PersistedSession {
  return {
    phase: state.phase,
    messages: state.messages.slice(-100),
    brief: state.brief,
    awaiting: state.awaiting,
    design: state.design,
    designHistory: state.designHistory.slice(-10),
    designFuture: state.designFuture.slice(0, 10),
    tab: state.tab,
    inputsOpen: state.inputsOpen,
    conversation: state.conversation,
  }
}

function projectTitle(state: AppState): string {
  const brand = state.brief.brandName?.trim()
  const product = state.brief.productName?.trim()
  if (brand && product) return `${brand} · ${product}`
  if (brand) return brand
  if (state.design?.copy?.brand) return String(state.design.copy.brand)
  return 'FORMA projesi'
}

function genId(): string {
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// --- Active project ID ---

export function getActiveProjectId(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(ACTIVE_KEY)
}

export function setActiveProjectId(id: string | null): void {
  if (typeof localStorage === 'undefined') return
  if (!id) localStorage.removeItem(ACTIVE_KEY)
  else localStorage.setItem(ACTIVE_KEY, id)
}

// --- Save ---

export async function saveProject(state: AppState, id?: string): Promise<string> {
  const projectId = id ?? getActiveProjectId() ?? genId()
  const payload = { version: 1, state: toPersistedSession(state) }
  const title = projectTitle(state)
  const stored: StoredProject = {
    id: projectId,
    title,
    updatedAt: Date.now(),
    payload,
  }
  if (idbAvailable()) {
    await idbPutProject(stored)
  } else {
    // localStorage fallback for older browsers
    try {
      localStorage.setItem(`${LS_PREFIX}${projectId}`, JSON.stringify(stored))
    } catch {
      // quota exceeded — silently fail
    }
  }
  setActiveProjectId(projectId)
  return projectId
}

// --- Load ---

export async function loadProject(id: string): Promise<Partial<AppState> | null> {
  let stored: StoredProject | null = null
  if (idbAvailable()) {
    stored = await idbGetProject(id)
  } else {
    try {
      stored = JSON.parse(localStorage.getItem(`${LS_PREFIX}${id}`) ?? 'null') as StoredProject | null
    } catch {
      stored = null
    }
  }
  if (!stored) return null
  const payload = stored.payload as { version?: number; state?: PersistedSession } | null
  if (payload?.version !== 1 || !payload.state) return null
  setActiveProjectId(id)
  return sessionFromPersisted(payload.state)
}

// --- List ---

export async function listProjects(): Promise<ProjectMeta[]> {
  if (idbAvailable()) {
    const all = await idbListProjects()
    return all.map((p) => ({ id: p.id, title: p.title, updatedAt: p.updatedAt }))
  }
  // localStorage fallback
  const metas: ProjectMeta[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(LS_PREFIX)) continue
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? 'null') as StoredProject | null
      if (stored) metas.push({ id: stored.id, title: stored.title, updatedAt: stored.updatedAt })
    } catch {
      /* skip corrupt entries */
    }
  }
  return metas.sort((a, b) => b.updatedAt - a.updatedAt)
}

// --- Delete ---

export async function deleteProject(id: string): Promise<boolean> {
  if (idbAvailable()) {
    return idbDeleteProject(id)
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(`${LS_PREFIX}${id}`)
    return true
  }
  return false
}

// --- Legacy single-session compat (for migration) ---

const LEGACY_KEY = 'forma.project.v1'

export function loadLegacySession(): Partial<AppState> | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? 'null') as {
      version?: number
      state?: PersistedSession
    } | null
    if (parsed?.version !== 1 || !parsed.state) return null
    return sessionFromPersisted(parsed.state)
  } catch {
    return null
  }
}

export function clearLegacySession(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(LEGACY_KEY)
}
