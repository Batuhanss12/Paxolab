import { apiRequest } from './client'

export type CreditBalance = {
  balance: number
  currency: 'credits' | string
}

export type CreditOperation = 'generate' | 'revise'

export type ReserveResponse = {
  reservationId: string
  amount: number
  balance: number
  operation: CreditOperation
  idempotent?: boolean
}

export type FinalizeResponse = {
  reservationId: string
  status: 'committed' | 'refunded'
  balance: number
}

export type CreditTransaction = {
  id: string
  kind: string
  amount: number
  balance_after: number
  ref_id: string | null
  meta: unknown
  created_at: string
}

export async function getBalance(): Promise<CreditBalance> {
  return apiRequest<CreditBalance>('/api/credits/balance')
}

export async function listTransactions(limit = 50): Promise<CreditTransaction[]> {
  const data = await apiRequest<{ transactions: CreditTransaction[] }>(
    `/api/credits/transactions?limit=${limit}`,
  )
  return data.transactions
}

export async function reserveCredits(input: {
  operation: CreditOperation
  clientRequestId?: string
}): Promise<ReserveResponse> {
  return apiRequest<ReserveResponse>('/api/credits/reserve', {
    method: 'POST',
    body: input,
  })
}

export async function commitReservation(reservationId: string): Promise<FinalizeResponse> {
  return apiRequest<FinalizeResponse>('/api/credits/commit', {
    method: 'POST',
    body: { reservationId },
  })
}

export async function refundReservation(
  reservationId: string,
  reason?: string,
): Promise<FinalizeResponse> {
  return apiRequest<FinalizeResponse>('/api/credits/refund', {
    method: 'POST',
    body: { reservationId, reason },
  })
}
