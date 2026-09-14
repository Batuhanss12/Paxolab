import type { AppState } from './appState'
import type { DesignSpec } from './types'
import { documentFromArtwork } from './engine/document'
import { getToken } from './api/client'
import { createProject, getProject, listProjects, upsertProject } from './api/projects'

const KEY = 'forma.project.v1'
const CLOUD_ID_KEY = 'forma.cloudProjectId.v1'

export type PersistedSession = Pick<
  AppState,
  'phase' | 'messages' | 'brief' | 'awaiting' | 'design' | 'designHistory' | 'designFuture' | 'tab' | 'inputsOpen'
>

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
    designHistory: state.designHistory.slice(-5),
    designFuture: state.designFuture.slice(0, 5),
    tab: state.tab,
    inputsOpen: state.inputsOpen,
  }
}

export function loadSession(): Partial<AppState> | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null') as {
      version?: number
      state?: PersistedSession
    } | null
    if (parsed?.version !== 1 || !parsed.state) return null
    return sessionFromPersisted(parsed.state)
  } catch {
    return null
  }
}

export function saveSession(state: AppState): void {
  if (typeof localStorage === 'undefined') return
  const persisted = toPersistedSession(state)
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, state: persisted }))
  } catch {
    localStorage.removeItem(KEY)
  }
}

export function clearSession(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY)
}

export function getCloudProjectId(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(CLOUD_ID_KEY)
}

export function setCloudProjectId(id: string | null): void {
  if (typeof localStorage === 'undefined') return
  if (!id) localStorage.removeItem(CLOUD_ID_KEY)
  else localStorage.setItem(CLOUD_ID_KEY, id)
}

function projectTitle(state: AppState): string {
  const brand = state.brief.brandName?.trim()
  const product = state.brief.productName?.trim()
  if (brand && product) return `${brand} · ${product}`
  if (brand) return brand
  if (state.design?.copy?.brand) return String(state.design.copy.brand)
  return 'Grapxor projesi'
}

export function buildCloudPayload(state: AppState): { version: number; state: PersistedSession } {
  return { version: 1, state: toPersistedSession(state) }
}

/** Debounced cloud upsert when logged in. No-op for guests / API down. */
export async function syncSessionToCloud(state: AppState): Promise<string | null> {
  if (!getToken()) return null
  const payload = buildCloudPayload(state)
  const title = projectTitle(state)
  try {
    const existingId = getCloudProjectId()
    if (existingId) {
      const project = await upsertProject(existingId, { title, payload })
      setCloudProjectId(project.id)
      return project.id
    }
    const project = await createProject({ title, payload })
    setCloudProjectId(project.id)
    return project.id
  } catch (err) {
    console.warn('[FORMA] cloud sync skipped:', err instanceof Error ? err.message : err)
    return null
  }
}

export type CloudHydrateResult =
  | { kind: 'loaded'; state: Partial<AppState>; note: string }
  | { kind: 'pushed'; note: string }
  | { kind: 'none'; note: string }

/**
 * After login: if server has projects, load most recent into session (replace local).
 * If none, push the current local session up.
 */
export async function hydrateFromCloudAfterLogin(
  localState: AppState,
): Promise<CloudHydrateResult> {
  if (!getToken()) return { kind: 'none', note: 'Misafir modu — yalnızca yerel kayıt.' }
  try {
    const projects = await listProjects()
    if (projects.length > 0) {
      const latest = projects[0]
      const full = await getProject(latest.id)
      setCloudProjectId(full.id)
      const payload = full.payload as { version?: number; state?: PersistedSession } | null
      if (payload?.version === 1 && payload.state) {
        const note = `Buluttan yüklendi: ${latest.title}`
        console.info('[FORMA]', note)
        return { kind: 'loaded', state: sessionFromPersisted(payload.state), note }
      }
    }
    const id = await syncSessionToCloud(localState)
    if (id) {
      const note = 'Yerel oturum buluta yüklendi.'
      console.info('[FORMA]', note)
      return { kind: 'pushed', note }
    }
    return { kind: 'none', note: 'Bulut senkronu yapılamadı.' }
  } catch (err) {
    const note = err instanceof Error ? err.message : 'Bulut senkronu başarısız.'
    console.warn('[FORMA]', note)
    return { kind: 'none', note }
  }
}

/** Load a specific cloud project into session state. */
export async function loadCloudProjectById(id: string): Promise<CloudHydrateResult> {
  if (!getToken()) return { kind: 'none', note: 'Giriş gerekli.' }
  try {
    const full = await getProject(id)
    setCloudProjectId(full.id)
    const payload = full.payload as { version?: number; state?: PersistedSession } | null
    if (payload?.version === 1 && payload.state) {
      const note = `Proje yüklendi: ${full.title}`
      return { kind: 'loaded', state: sessionFromPersisted(payload.state), note }
    }
    return { kind: 'none', note: 'Proje yüklenemedi (geçersiz içerik).' }
  } catch (err) {
    const note = err instanceof Error ? err.message : 'Proje yüklenemedi.'
    return { kind: 'none', note }
  }
}
