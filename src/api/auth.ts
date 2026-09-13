import { apiRequest, saveAuth, type AuthState, type AuthUser } from './client'

type AuthResponse = { user: AuthUser; token: string }

export async function register(input: {
  email: string
  password: string
  name?: string
}): Promise<AuthState> {
  const data = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: input,
    auth: false,
  })
  const state = { user: data.user, token: data.token }
  saveAuth(state)
  return state
}

export async function login(input: { email: string; password: string }): Promise<AuthState> {
  const data = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: input,
    auth: false,
  })
  const state = { user: data.user, token: data.token }
  saveAuth(state)
  return state
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
  } catch {
    /* local clear still happens */
  }
  saveAuth(null)
}

export async function me(): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>('/api/auth/me')
  return data.user
}
