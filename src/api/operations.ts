import { apiRequest } from './client'

export type OperationCategory = 'discovery' | 'creation' | 'revision' | 'refinement' | 'export'

export type OperationDef = {
  operationId: string
  displayName: string
  description: string
  creditCost: number
  category: OperationCategory
  enabled: boolean
  refundable: boolean
  requiresConfirmation: boolean
  freeTierAllowed: boolean
}

export type QuoteResponse = {
  operationId: string
  displayName: string
  description: string
  creditCost: number
  category: OperationCategory
  refundable: boolean
  requiresConfirmation: boolean
  classified: {
    operationId: string
    confidence: number
    rationale: string
    matchedKeywords: string[]
  } | null
}

export type ClassifyResponse = {
  operationId: string
  confidence: number
  rationale: string
  matchedKeywords: string[]
  legacyOperation: 'generate' | 'revise'
}

export type CatalogReserveResponse = {
  reservationId: string
  amount: number
  balance: number
  operationId: string
  costVersionId: string | null
  idempotent: boolean
}

export async function listOperations(): Promise<OperationDef[]> {
  const data = await apiRequest<{ operations: OperationDef[] }>('/api/billing/operations', { auth: false })
  return data.operations
}

export async function quoteOperation(input: {
  operation?: string
  feedback?: string
  hasPriorDesign?: boolean
}): Promise<QuoteResponse> {
  return apiRequest<QuoteResponse>('/api/design/operations/quote', {
    method: 'POST',
    body: input,
  })
}

export async function classifyFeedback(input: {
  feedback: string
  hasPriorDesign?: boolean
}): Promise<ClassifyResponse> {
  return apiRequest<ClassifyResponse>('/api/design/operations/classify', {
    method: 'POST',
    body: input,
  })
}

export async function reserveCatalogOperation(input: {
  operation: string
  clientRequestId?: string
  projectId?: string
  sessionId?: string
  feedbackText?: string
}): Promise<CatalogReserveResponse> {
  return apiRequest<CatalogReserveResponse>('/api/design/operations/reserve', {
    method: 'POST',
    body: input,
  })
}
