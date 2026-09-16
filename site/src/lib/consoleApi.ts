import { API_URL } from "./site";
import { loadAuth } from "./auth";

export class ConsoleApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function consoleRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const auth = loadAuth();
  if (!auth?.token) throw new ConsoleApiError(401, "Oturum gerekli.");
  const headers: Record<string, string> = { Authorization: `Bearer ${auth.token}` };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  if (!res.ok) {
    const message =
      data && typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : `İstek başarısız (${res.status})`;
    throw new ConsoleApiError(res.status, message);
  }
  return data as T;
}

export type OrgSummary = {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "member";
  memberCount: number;
  seatLimit: number;
  planId: string | null;
  planLabel: string | null;
  unlimited: boolean;
  createdAt: string;
};

export type OrgMember = {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

export type OrgInvite = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  token: string;
};

export type OrgDetail = {
  organization: OrgSummary;
  members: OrgMember[];
  invites: OrgInvite[];
  billing: { ownerUserId: string; balance: number; unlimited: boolean };
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  auth_provider?: string;
  balance: number;
};

export type AdminStats = {
  users: number;
  projects: number;
  paidOrders: number;
  totalCreditsGranted: number;
  organizations?: number;
};

export type AdminBillingOverview = {
  users: number;
  activeSubscriptions: number;
  creditsConsumed: number;
  creditsPurchased: number;
  topupRevenue: number;
  subscriptionRevenue: number;
  failedOperations: number;
};

export type AdminPlan = {
  id: string;
  label: string;
  monthlyPrice: number;
  monthlyCredits: number;
  currency: string;
  enabled: boolean;
  unlimited?: boolean;
};

export type AdminOperation = {
  operationId: string;
  displayName: string;
  category: string;
  creditCost: number;
  enabled: boolean;
};
