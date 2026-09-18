import { ApiError, apiRequest, loadAuth } from './client'

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

export type DownloadQuote = {
  cost: number
  covered: boolean
  entitlements: number
  balance: number
}

/** What the next download will cost — asked *before* the customer commits to it. */
export async function fetchDownloadQuote(): Promise<DownloadQuote> {
  return apiRequest<DownloadQuote>('/api/credits/download/quote')
}

export async function chargeDownload(designKey: string): Promise<{ charged: number; balance: number; covered: boolean }> {
  return apiRequest('/api/credits/download', { method: 'POST', body: { designKey } })
}

export type CreditCosts = { generate: number; revise: number; download: number }

/** Prices, so a control can show what it will cost before it is pressed. */
export async function fetchCreditCosts(): Promise<CreditCosts> {
  return apiRequest<CreditCosts>('/api/credits/costs')
}

/**
 * The delivery bundle, fetched from the server.
 *
 * The client used to build this itself and call `chargeDownload` beforehand out of politeness —
 * skipping that call cost nothing, so the print files were free to anyone with devtools. The
 * bytes now come from `POST /api/credits/export`, which recomputes preflight, builds the ZIP and
 * debits the credit in that order. The exporter is no longer in the browser bundle.
 */
export async function fetchDeliveryZip(
  spec: unknown,
  designKey: string,
  /** A `data:image/png;base64,…` of the front face, so the bundle carries a picture too. */
  preview?: string | null,
): Promise<{ blob: Blob; filename: string }> {
  const token = loadAuth()?.token
  if (!token) throw new ApiError(401, 'İndirmek için giriş yapman gerekiyor.')

  let res: Response
  try {
    res = await fetch('/api/credits/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ spec, designKey, preview: preview ?? undefined }),
    })
  } catch {
    throw new ApiError(0, 'API erişilemiyor (sunucu kapalı olabilir).')
  }

  if (!res.ok) {
    let message = `İstek başarısız (${res.status})`
    try {
      const data = (await res.json()) as { error?: unknown; items?: { label?: unknown; detail?: unknown }[] }
      if (typeof data.error === 'string') message = data.error
      // A blocked export names the check that stopped it, so the note can say what to fix.
      if (Array.isArray(data.items) && data.items.length) {
        const first = data.items[0]
        if (first && typeof first.label === 'string') message = `${message} (${first.label})`
      }
    } catch {
      /* a non-JSON error body still gets the status message above */
    }
    throw new ApiError(res.status, message)
  }

  const disposition = res.headers.get('Content-Disposition') ?? ''
  const named = /filename="([^"]+)"/.exec(disposition)?.[1]
  return { blob: await res.blob(), filename: named || 'grapxor.zip' }
}
