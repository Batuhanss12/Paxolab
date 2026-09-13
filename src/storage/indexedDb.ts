/**
 * IndexedDB client — promise-based wrapper for large project data.
 * Falls back gracefully when IndexedDB is unavailable (SSR, old browsers).
 * Used for: full design specs, artwork layers, multiple project slots.
 * localStorage stays for small metadata; IndexedDB handles the heavy payload.
 */

const DB_NAME = 'forma'
const DB_VERSION = 1
const STORE_PROJECTS = 'projects'
const STORE_DESIGN_MEMORY = 'designMemory'

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => resolve(null)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_DESIGN_MEMORY)) {
        db.createObjectStore(STORE_DESIGN_MEMORY, { keyPath: 'key' })
      }
    }
  })
  return dbPromise
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return openDb().then((db) => {
    if (!db) return null
    return new Promise((resolve) => {
      const t = db.transaction(store, mode)
      const req = fn(t.objectStore(store))
      req.onerror = () => resolve(null)
      req.onsuccess = () => resolve(req.result as T)
    })
  })
}

// --- Projects store ---

export interface StoredProject {
  id: string
  title: string
  updatedAt: number
  payload: unknown
}

export async function idbPutProject(project: StoredProject): Promise<boolean> {
  const result = await tx(STORE_PROJECTS, 'readwrite', (s) => s.put(project))
  return result !== null
}

export async function idbGetProject(id: string): Promise<StoredProject | null> {
  return tx(STORE_PROJECTS, 'readonly', (s) => s.get(id) as IDBRequest<StoredProject | null>)
}

export async function idbDeleteProject(id: string): Promise<boolean> {
  const result = await tx(STORE_PROJECTS, 'readwrite', (s) => s.delete(id))
  return result !== null
}

export async function idbListProjects(): Promise<StoredProject[]> {
  const all = await tx(STORE_PROJECTS, 'readonly', (s) => s.getAll() as IDBRequest<StoredProject[]>)
  if (!all) return []
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

// --- Design memory store ---

export async function idbGetMemory(key: string): Promise<unknown | null> {
  return tx(STORE_DESIGN_MEMORY, 'readonly', (s) =>
    s.get(key) as IDBRequest<{ key: string; value: unknown } | null>,
  ).then((r) => (r as { key: string; value: unknown } | null)?.value ?? null)
}

export async function idbPutMemory(key: string, value: unknown): Promise<boolean> {
  const result = await tx(STORE_DESIGN_MEMORY, 'readwrite', (s) => s.put({ key, value }))
  return result !== null
}

/** True when IndexedDB is available in the current environment. */
export function idbAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}
