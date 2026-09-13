import { apiRequest } from './client'

export type HealthResponse = {
  ok: boolean
  service: string
  db?: 'ok' | 'error'
  time?: string
}

export async function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/api/health', { auth: false })
}
