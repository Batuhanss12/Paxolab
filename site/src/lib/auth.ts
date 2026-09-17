/** Client-safe marketing-site auth helpers (localStorage + API). */

import { API_URL, STUDIO_URL } from "./site";

const STORAGE_KEY = "grapxor.site.auth.v1";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  auth_provider?: string;
};

export type AuthState = {
  token: string;
  user: AuthUser;
};

export function loadAuth(): AuthState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthState;
    if (!parsed?.token || !parsed?.user?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const AUTH_EVENT = "grapxor-auth-changed";

function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function saveAuth(state: AuthState | null): void {
  if (typeof localStorage === "undefined") return;
  if (!state) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  notifyAuthChanged();
}

export async function logout(): Promise<void> {
  const auth = loadAuth();
  if (auth?.token) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
    } catch {
      /* local clear still happens */
    }
  }
  saveAuth(null);
}

async function parseAuthResponse(res: Response): Promise<AuthState> {
  let data: unknown = null;
  const text = await res.text();
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
    throw new Error(message);
  }
  const body = data as { token?: string; user?: AuthUser };
  if (!body?.token || !body?.user?.email) {
    throw new Error("Geçersiz sunucu yanıtı.");
  }
  return { token: body.token, user: body.user };
}

export async function login(email: string, password: string): Promise<AuthState> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const state = await parseAuthResponse(res);
  saveAuth(state);
  return state;
}

export async function register(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthState> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const state = await parseAuthResponse(res);
  saveAuth(state);
  return state;
}

/**
 * Build studio URL carrying site session when logged in.
 * Pass a projectId to deep-link a specific project (studio reads ?project=).
 */
export function studioHandoffUrl(projectId?: string): string {
  const auth = loadAuth();
  if (!auth?.token) return STUDIO_URL;
  // Unicode-safe base64 (btoa only supports Latin1)
  const json = JSON.stringify(auth);
  const b64 = typeof window !== "undefined"
    ? btoa(unescape(encodeURIComponent(json)))
    : Buffer.from(json, "utf-8").toString("base64");
  const project = projectId ? `&project=${encodeURIComponent(projectId)}` : "";
  return `${STUDIO_URL}?handoff=${encodeURIComponent(b64)}${project}`;
}

export async function getCreditBalance(token: string): Promise<number | null> {
  try {
    const res = await fetch(`${API_URL}/api/credits/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { balance?: number };
    return typeof data.balance === "number" ? data.balance : null;
  } catch {
    return null;
  }
}

export function googleAuthUrl(nextPath: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const next = `${origin}${nextPath}`;
  return `${API_URL}/api/auth/google?next=${encodeURIComponent(next)}`;
}

export async function exchangeHandoff(id: string): Promise<AuthState> {
  const res = await fetch(`${API_URL}/api/auth/handoff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const state = await parseAuthResponse(res);
  saveAuth(state);
  return state;
}

export async function googleStatus(): Promise<{
  configured: boolean;
  redirectUri: string;
  origins: string[];
}> {
  const res = await fetch(`${API_URL}/api/auth/google/status`, { cache: "no-store" });
  if (!res.ok) {
    return { configured: false, redirectUri: `${API_URL}/api/auth/google/callback`, origins: [] };
  }
  return (await res.json()) as { configured: boolean; redirectUri: string; origins: string[] };
}
