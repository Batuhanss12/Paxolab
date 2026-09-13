import { apiRequest } from './client'

export type ProjectSummary = {
  id: string
  title: string
  updated_at: string
  created_at: string
}

export type Project = ProjectSummary & {
  payload: unknown
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const data = await apiRequest<{ projects: ProjectSummary[] }>('/api/projects')
  return data.projects
}

export async function getProject(id: string): Promise<Project> {
  const data = await apiRequest<{ project: Project }>(`/api/projects/${id}`)
  return data.project
}

export async function createProject(input: {
  title?: string
  payload?: unknown
}): Promise<Project> {
  const data = await apiRequest<{ project: Project }>('/api/projects', {
    method: 'POST',
    body: input,
  })
  return data.project
}

export async function upsertProject(
  id: string,
  input: { title?: string; payload?: unknown },
): Promise<Project> {
  const data = await apiRequest<{ project: Project }>(`/api/projects/${id}`, {
    method: 'PUT',
    body: input,
  })
  return data.project
}

export async function deleteProject(id: string): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/api/projects/${id}`, { method: 'DELETE' })
}
