/** Site & studio URL helpers. Defaults match local dual-app setup. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const STUDIO_URL =
  process.env.NEXT_PUBLIC_STUDIO_URL?.replace(/\/$/, "") ||
  "http://localhost:5173";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8787";

export const STUDIO_BILLING_URL = `${STUDIO_URL}/#billing`;

export const ROUTES_TR = [
  "/",
  "/ambalaj-tasarimi",
  "/kutu-tasarimi",
  "/etiket-tasarimi",
  "/bicki-cizimi",
  "/kozmetik-ambalaj-tasarimi",
  "/parfum-kutusu-tasarimi",
  "/nasil-calisir",
  "/ornekler",
  "/fiyatlandirma",
  "/sss",
  "/iletisim",
  "/gizlilik",
  "/kvkk",
  "/kullanim-kosullari",
] as const;

/** @deprecated Use ROUTES_TR + EN_ROUTES; kept for compatibility. */
export const ROUTES = ROUTES_TR;

export type RoutePath = (typeof ROUTES_TR)[number];

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p === "/" ? "" : p}`;
}
