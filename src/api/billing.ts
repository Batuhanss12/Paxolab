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
