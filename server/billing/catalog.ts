/** Hardcoded credit packs + plan metadata (Phase 8). No recurring billing yet. */

export type CreditPack = {
  id: string
  credits: number
  priceTry: number
  label: string
  currency: 'TRY'
}

export type PlanMeta = {
  id: string
  label: string
  monthlyCredits: number
  priceTry: number
  /** Display-only until Phase 9 */
  displayOnly: boolean
  description: string
}

export const CREDIT_PACKS: readonly CreditPack[] = [
  {
    id: 'pack_50',
    credits: 50,
    priceTry: 99.0,
    label: '50 Kredi',
    currency: 'TRY',
  },
  {
    id: 'pack_150',
    credits: 150,
    priceTry: 249.0,
    label: '150 Kredi',
    currency: 'TRY',
  },
  {
    id: 'pack_400',
    credits: 400,
    priceTry: 599.0,
    label: '400 Kredi',
    currency: 'TRY',
  },
] as const

/** @deprecated Public `/api/billing/plans` reads Phase 10 `subscription_plans`. Kept for older fixtures. */
export const PLANS: readonly PlanMeta[] = [
  {
    id: 'free',
    label: 'Free',
    monthlyCredits: 50,
    priceTry: 0,
    displayOnly: true,
    description: 'Kayıtta 50 başlangıç kredisi (zaten mevcut).',
  },
  {
    id: 'pro',
    label: 'Pro',
    monthlyCredits: 200,
    priceTry: 399,
    displayOnly: true,
    description: 'Aylık 200 kredi — Phase 9’da faturalama.',
  },
] as const

export function getPack(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === packId)
}
