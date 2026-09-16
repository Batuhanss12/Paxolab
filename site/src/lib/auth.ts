/** Client-safe marketing-site auth helpers (localStorage + API). */

import { API_URL, STUDIO_URL } from "./site";

const STORAGE_KEY = "grapxor.site.auth.v1";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
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

export function saveAuth(state: AuthState | null): void {
  if (typeof localStorage === "undefined") return;
  if (!state) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
 * Use only when the user already has site auth.
 */
export function studioHandoffUrl(_pathOrStudioRoot?: string): string {
  const auth = loadAuth();
  if (!auth?.token) return STUDIO_URL;
  // Unicode-safe base64 (btoa only supports Latin1)
  const json = JSON.stringify(auth);
  const b64 = typeof window !== "undefined"
    ? btoa(unescape(encodeURIComponent(json)))
    : Buffer.from(json, "utf-8").toString("base64");
  return `${STUDIO_URL}?handoff=${encodeURIComponent(b64)}`;
}
