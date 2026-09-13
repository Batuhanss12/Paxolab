import { apiRequest } from './client'

export type AdminUser = {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string
  balance: number
}

export type AdminStats = {
  users: number
  projects: number
  paidOrders: number
  totalCreditsGranted: number
}

export type AdminOrder = {
  id: string
  user_id: string
  pack_id: string
  credits: number
  amount_try: number
  currency: string
  status: string
  created_at: string
  updated_at: string
  paid_at: string | null
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const data = await apiRequest<{ users: AdminUser[] }>('/api/admin/users')
  return data.users
}

export async function getAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>('/api/admin/stats')
}

export async function adjustAdminCredits(input: {
  userId: string
  amount: number
  reason?: string
}): Promise<{ balance: number; amount: number }> {
  return apiRequest<{ balance: number; amount: number }>('/api/admin/credits/adjust', {
    method: 'POST',
    body: input,
  })
}

export async function listAdminOrders(limit = 50): Promise<AdminOrder[]> {
  const data = await apiRequest<{ orders: AdminOrder[] }>(
    `/api/admin/orders?limit=${limit}`,
  )
  return data.orders
}
