/**
 * Where the other two apps live.
 *
 * Three processes, three origins in development: the marketing site (Next), the studio (this app)
 * and the API. Only the site's address has to be *named* from here — the API is reached with
 * relative paths so that it is always same-origin, which is what lets the studio be served straight
 * off the API process in production without a reverse proxy to get right.
 *
 * Centralised because it was not: a "Kredi yükleyin" link went out with `http://localhost:3000`
 * written into the component. That works on every machine except a customer's.
 */
const FALLBACK_SITE = 'http://localhost:3000'

export function siteUrl(path = ''): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()
  const base = (configured || FALLBACK_SITE).replace(/\/$/, '')
  if (!path) return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/** The credits page customers are sent to when a balance will not cover an action. */
export function creditsUrl(): string {
  return siteUrl('/hesap/credits')
}
