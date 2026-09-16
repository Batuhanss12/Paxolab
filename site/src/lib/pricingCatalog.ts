import { API_URL } from "./site";
import type { SiteContent } from "@/content/types";

export type LivePlan = {
  id: string;
  label: string;
  monthlyCredits: number;
  priceTry: number;
  displayOnly: boolean;
  description: string;
  unlimited?: boolean;
  unitPriceTry?: number | null;
};

export type LiveOperation = {
  operationId: string;
  displayName: string;
  creditCost: number;
  category: string;
  enabled: boolean;
};

export type PricingCatalog = {
  plans: LivePlan[];
  operations: LiveOperation[];
};

export type PlanCardCopy = SiteContent["pricing"]["planCards"][number];

export type DisplayPlan = {
  id: string;
  label: string;
  priceTry: number;
  monthlyCredits: number;
  unitPriceTry: number | null;
  unlimited: boolean;
  copy: PlanCardCopy;
};

const USAGE_IDS = ["initial_design", "focused_revision", "final_export"] as const;

const FALLBACK: Record<
  string,
  { priceTry: number; monthlyCredits: number; unitPriceTry: number | null; unlimited: boolean }
> = {
  baslangic: { priceTry: 699, monthlyCredits: 500, unitPriceTry: 1.4, unlimited: false },
  plus: { priceTry: 1799, monthlyCredits: 1500, unitPriceTry: 1.2, unlimited: false },
  pro: { priceTry: 3699, monthlyCredits: 3500, unitPriceTry: 1.06, unlimited: false },
  studio: { priceTry: 6999, monthlyCredits: 7500, unitPriceTry: 0.93, unlimited: false },
  agency: { priceTry: 39999, monthlyCredits: 0, unitPriceTry: 0.8, unlimited: true },
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`pricing catalog ${path} ${res.status}`);
  return (await res.json()) as T;
}

/** Live plans / operation costs. Returns null if the API is down so the page still builds. */
export async function loadPricingCatalog(): Promise<PricingCatalog | null> {
  try {
    const [plansBody, opsBody] = await Promise.all([
      getJson<{ plans: LivePlan[] }>("/api/billing/plans"),
      getJson<{ operations: LiveOperation[] }>("/api/billing/operations"),
    ]);
    return {
      plans: plansBody.plans ?? [],
      operations: (opsBody.operations ?? []).filter((op) => op.enabled),
    };
  } catch {
    return null;
  }
}

export function mergePlans(
  live: LivePlan[] | undefined,
  cards: PlanCardCopy[],
): DisplayPlan[] {
  return cards.map((copy) => {
    const row = live?.find((p) => p.id === copy.id);
    const fb = FALLBACK[copy.id];
    return {
      id: copy.id,
      label: copy.label,
      priceTry: row?.priceTry ?? fb?.priceTry ?? 0,
      monthlyCredits: row?.monthlyCredits ?? fb?.monthlyCredits ?? 0,
      unitPriceTry: row?.unitPriceTry ?? fb?.unitPriceTry ?? null,
      unlimited: row?.unlimited ?? fb?.unlimited ?? copy.id === "agency",
      copy,
    };
  });
}

export function usageFromCatalog(
  catalog: PricingCatalog | null,
  fallback: { action: string; cost: string }[],
  creditsWord: string,
): { action: string; cost: string }[] {
  if (!catalog?.operations.length) return fallback;
  const byId = new Map(catalog.operations.map((op) => [op.operationId, op]));
  const rows = USAGE_IDS.map((id) => byId.get(id)).filter(
    (op): op is LiveOperation => Boolean(op),
  );
  if (rows.length === 0) return fallback;
  return rows.map((op, i) => ({
    action: fallback[i]?.action ?? op.displayName,
    cost: `${op.creditCost} ${creditsWord}`,
  }));
}
