/**
 * Storage index — re-exports for clean imports.
 */
export {
  deleteProject,
  getActiveProjectId,
  listProjects,
  loadLegacySession,
  loadProject,
  saveProject,
  setActiveProjectId,
  toPersistedSession,
  type PersistedSession,
  type ProjectMeta,
} from './projectStorage'
export { idbAvailable, idbGetMemory, idbPutMemory } from './indexedDb'
