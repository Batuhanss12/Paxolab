export function fileURLToPath(url: string | URL): string {
  const s = String(url)
  try {
    return decodeURIComponent(new URL(s).pathname)
  } catch {
    return s.replace(/^file:\/\//, '')
  }
}
