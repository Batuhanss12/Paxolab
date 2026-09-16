import { apiRequest } from './client'

export type AdminUser = {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string
  balance: number
  auth_provider?: string
}

export type AdminStats = {
  users: number
  projects: number
  paidOrders: number
  totalCreditsGranted: number
  organizations?: number
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

// Phase 10 admin types

export type AdminBillingOverview = {
  users: number
  activeSubscriptions: number
  creditsIssued: number
  creditsConsumed: number
  creditsPurchased: number
  creditsRefunded: number
  topupRevenue: number
  subscriptionRevenue: number
  failedOperations: number
  creditUtilization: number
  llmCosts: {
    totalRecords: number
    totalCostUsd: number
    totalInputTokens: number
    totalOutputTokens: number
  }
}

export type AdminUserCredits = {
  user: { id: string; email: string; name: string | null; role: string; created_at: string }
  balance: number
  buckets: { included: number; purchased: number; bonus: number; total: number }
  subscription: { planId: string; status: string; currentPeriodEnd: string | null } | null
}

export type AdminLedgerEntry = {
  id: string
  kind: string
  amount: number
  balanceAfter: number
  refId: string | null
  meta: unknown
  createdAt: string
}

export type AdminPlan = {
  id: string
  label: string
  monthlyPrice: number
  currency: string
  monthlyCredits: number
  maxProjects: number | null
  maxActiveSessions: number | null
  rolloverPolicy: string
  rolloverMax: number
  topupEligible: boolean
  enabled: boolean
  displayOrder: number
  description: string | null
}

export type AdminOperation = {
  operationId: string
  displayName: string
  description: string
  creditCost: number
  category: string
  enabled: boolean
  refundable: boolean
  requiresConfirmation: boolean
  freeTierAllowed: boolean
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

// Phase 10 admin endpoints

export async function getBillingOverview(): Promise<AdminBillingOverview> {
  return apiRequest<AdminBillingOverview>('/api/admin/billing/overview')
}

export async function getAdminUserCredits(userId: string): Promise<AdminUserCredits> {
  return apiRequest<AdminUserCredits>(`/api/admin/users/${userId}/credits`)
}

export async function getAdminUserLedger(
  userId: string,
  limit = 200,
): Promise<AdminLedgerEntry[]> {
  const data = await apiRequest<{ ledger: AdminLedgerEntry[] }>(
    `/api/admin/users/${userId}/ledger?limit=${limit}`,
  )
  return data.ledger
}

export async function listAdminPlans(): Promise<AdminPlan[]> {
  const data = await apiRequest<{ plans: AdminPlan[] }>('/api/admin/plans')
  return data.plans
}

export async function upsertAdminPlan(
  planId: string,
  patch: Partial<AdminPlan>,
): Promise<AdminPlan> {
  const data = await apiRequest<{ plan: AdminPlan }>('/api/admin/plans', {
    method: 'POST',
    body: { id: planId, ...patch },
  })
  return data.plan
}

export async function patchAdminPlan(
  planId: string,
  patch: Partial<AdminPlan>,
): Promise<AdminPlan> {
  const data = await apiRequest<{ plan: AdminPlan }>(`/api/admin/plans/${planId}`, {
    method: 'PATCH',
    body: patch,
  })
  return data.plan
}

export async function listAdminOperations(): Promise<AdminOperation[]> {
  const data = await apiRequest<{ operations: AdminOperation[] }>(
    '/api/admin/credit-operations',
  )
  return data.operations
}

export async function patchAdminOperation(
  operationId: string,
  patch: Partial<AdminOperation>,
): Promise<AdminOperation> {
  const data = await apiRequest<{ operation: AdminOperation }>(
    `/api/admin/credit-operations/${operationId}`,
    { method: 'PATCH', body: patch },
  )
  return data.operation
}

export async function patchAdminUserRole(userId: string, role: 'admin' | 'user'): Promise<{ id: string; role: string }> {
  const data = await apiRequest<{ user: { id: string; role: string } }>(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    body: { role },
  })
  return data.user
}

export type AdminOrg = {
  id: string
  name: string
  slug: string
  memberCount: number
  seatLimit: number
  planLabel: string | null
  unlimited: boolean
}

export async function listAdminOrgs(): Promise<AdminOrg[]> {
  const data = await apiRequest<{ organizations: AdminOrg[] }>('/api/admin/orgs')
  return data.organizations
}
