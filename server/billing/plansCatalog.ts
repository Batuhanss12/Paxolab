/** Public monthly plans + operation costs. Synced into SQLite on boot. */

export const INITIAL_DESIGN_COST = 117
export const REVISION_COST = 3
export const EXPORT_COST = 1

/** Signup grant: one first design + one revision. */
export const STARTING_CREDIT_GRANT = INITIAL_DESIGN_COST + REVISION_COST

export const OPERATION_COSTS: Record<string, number> = {
  brief_generation: 1,
  design_exploration: INITIAL_DESIGN_COST,
  initial_design: INITIAL_DESIGN_COST,
  alternative_design: REVISION_COST,
  new_direction: REVISION_COST,
  micro_revision: REVISION_COST,
  focused_revision: REVISION_COST,
  structural_revision: REVISION_COST,
  creative_revision: REVISION_COST,
  full_art_direction_revision: REVISION_COST,
  typography_refinement: REVISION_COST,
  color_refinement: REVISION_COST,
  composition_refinement: REVISION_COST,
  asset_refinement: REVISION_COST,
  final_refinement: REVISION_COST,
  final_export: EXPORT_COST,
}

export type PlanSeed = {
  id: string
  label: string
  monthlyPrice: number
  monthlyCredits: number
  unitPriceTry: number
  unlimited: boolean
  maxProjects: number | null
  maxActiveSessions: number | null
  rolloverPolicy: 'none' | 'partial' | 'full'
  rolloverMax: number
  displayOrder: number
  description: string
}

export const SUBSCRIPTION_PLANS: readonly PlanSeed[] = [
  {
    id: 'baslangic',
    label: 'Başlangıç',
    monthlyPrice: 699,
    monthlyCredits: 500,
    unitPriceTry: 1.4,
    unlimited: false,
    maxProjects: 8,
    maxActiveSessions: 2,
    rolloverPolicy: 'partial',
    rolloverMax: 100,
    displayOrder: 0,
    description: 'Aylık 500 kredi. İlk tasarım 117, revizyon 3.',
  },
  {
    id: 'plus',
    label: 'Plus',
    monthlyPrice: 1799,
    monthlyCredits: 1500,
    unitPriceTry: 1.2,
    unlimited: false,
    maxProjects: 20,
    maxActiveSessions: 4,
    rolloverPolicy: 'partial',
    rolloverMax: 300,
    displayOrder: 1,
    description: 'Aylık 1.500 kredi. En sık seçilen plan.',
  },
  {
    id: 'pro',
    label: 'Pro',
    monthlyPrice: 3699,
    monthlyCredits: 3500,
    unitPriceTry: 1.06,
    unlimited: false,
    maxProjects: 60,
    maxActiveSessions: 10,
    rolloverPolicy: 'partial',
    rolloverMax: 700,
    displayOrder: 2,
    description: 'Aylık 3.500 kredi. En iyi birim fiyat / hacim dengesi.',
  },
  {
    id: 'studio',
    label: 'Studio',
    monthlyPrice: 6999,
    monthlyCredits: 7500,
    unitPriceTry: 0.93,
    unlimited: false,
    maxProjects: 200,
    maxActiveSessions: 25,
    rolloverPolicy: 'full',
    rolloverMax: 7500,
    displayOrder: 3,
    description: 'Aylık 7.500 kredi, tam rollover.',
  },
  {
    id: 'agency',
    label: 'Agency',
    monthlyPrice: 39999,
    monthlyCredits: 0,
    unitPriceTry: 0.8,
    unlimited: true,
    maxProjects: null,
    maxActiveSessions: 50,
    rolloverPolicy: 'full',
    rolloverMax: 0,
    displayOrder: 4,
    description: 'Sınırsız tasarım. Ajans ölçeği, aylık ödeme.',
  },
] as const
