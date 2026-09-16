import { apiRequest } from './client'

export type CreditPack = {
  id: string
  credits: number
  priceTry: number
  label: string
  currency: 'TRY' | string
}

export type PlanMeta = {
  id: string
  label: string
  monthlyCredits: number
  priceTry: number
  displayOnly: boolean
  description: string
}

export type CheckoutResponse = {
  orderId: string
  paymentPageUrl: string
  token: string | null
  mode: 'mock' | 'iyzico'
}

export type MockCompleteResponse = {
  ok: boolean
  orderId: string
  status: string
  balance: number
  creditsGranted: number
  alreadyPaid: boolean
  mode: 'mock'
}

// Phase 10 types

export type BucketSummary = {
  included: number
  purchased: number
  bonus: number
  total: number
}

export type CreditsBreakdown = {
  balance: number
  currency: string
  buckets: BucketSummary
  subscription: {
    planId: string
    status: string
    currentPeriodEnd: string | null
    nextRenewalAt: string | null
  } | null
}

export type SubscriptionInfo = {
  id: string
  planId: string
  planLabel: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string | null
  nextRenewalAt: string | null
  cancelledAt: string | null
  monthlyCredits: number
}

export type UsageEntry = {
  id: string
  sessionId: string
  projectId: string
  operationId: string
  creditCost: number
  status: string
  feedbackText: string | null
  classifiedOperation: string | null
  createdAt: string
  completedAt: string | null
}

export type LedgerEntry = {
  id: string
  kind: string
  amount: number
  balanceAfter: number
  refId: string | null
  meta: unknown
  createdAt: string
}

export type PlanConfig = {
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

export async function listPacks(): Promise<CreditPack[]> {
  const data = await apiRequest<{ packs: CreditPack[] }>('/api/billing/packs', { auth: false })
  return data.packs
}

export async function listPlans(): Promise<PlanMeta[]> {
  const data = await apiRequest<{ plans: PlanMeta[] }>('/api/billing/plans', { auth: false })
  return data.plans
}

export async function checkout(packId: string): Promise<CheckoutResponse> {
  return apiRequest<CheckoutResponse>('/api/billing/checkout', {
    method: 'POST',
    body: { packId },
  })
}

export async function mockComplete(orderId: string): Promise<MockCompleteResponse> {
  return apiRequest<MockCompleteResponse>('/api/billing/mock/complete', {
    method: 'POST',
    body: { orderId },
  })
}

export type PaymentOrderSummary = {
  id: string
  pack_id: string
  credits: number
  amount_try: number
  currency: string
  status: string
  created_at: string
  updated_at: string
  paid_at: string | null
}

export async function listMyOrders(limit = 20): Promise<PaymentOrderSummary[]> {
  const data = await apiRequest<{ orders: PaymentOrderSummary[] }>(
    `/api/billing/orders?limit=${limit}`,
  )
  return data.orders
}

// Phase 10 endpoints

export async function getCreditsBreakdown(): Promise<CreditsBreakdown> {
  return apiRequest<CreditsBreakdown>('/api/billing/credits')
}

export async function getSubscription(): Promise<{ subscription: SubscriptionInfo | null }> {
  return apiRequest<{ subscription: SubscriptionInfo | null }>('/api/billing/subscription')
}

export async function subscribe(planId: string): Promise<{ subscription: SubscriptionInfo }> {
  return apiRequest<{ subscription: SubscriptionInfo }>('/api/billing/subscribe', {
    method: 'POST',
    body: { planId },
  })
}

export async function cancelSubscription(): Promise<{ subscription: SubscriptionInfo }> {
  return apiRequest<{ subscription: SubscriptionInfo }>('/api/billing/cancel', {
    method: 'POST',
  })
}

export async function getUsage(limit = 50): Promise<UsageEntry[]> {
  const data = await apiRequest<{ usage: UsageEntry[] }>(`/api/billing/usage?limit=${limit}`)
  return data.usage
}

export async function getLedger(limit = 100): Promise<LedgerEntry[]> {
  const data = await apiRequest<{ ledger: LedgerEntry[] }>(`/api/billing/ledger?limit=${limit}`)
  return data.ledger
}

export async function listConfiguredPlans(): Promise<PlanConfig[]> {
  // Public plan listing (from billing/plans)
  return listPlans().then((plans) =>
    plans.map((p) => ({
      id: p.id,
      label: p.label,
      monthlyPrice: p.priceTry,
      currency: 'TRY',
      monthlyCredits: p.monthlyCredits,
      maxProjects: null,
      maxActiveSessions: null,
      rolloverPolicy: 'none',
      rolloverMax: 0,
      topupEligible: true,
      enabled: !p.displayOnly,
      displayOrder: 0,
      description: p.description,
    })),
  )
}
