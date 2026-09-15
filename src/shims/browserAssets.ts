/**
 * Client-only asset table. Keep this small: family files + catalog JSON.
 * Full pattern-library / motif-bank SVGs stay on disk for Node tests and scripts.
 */
const family = import.meta.glob('../../assets/motif-families/**/*.{svg,json}', {
  query: '?raw',
  eager: true,
  import: 'default',
}) as Record<string, string>

const libraryJson = import.meta.glob('../../assets/art-pattern-library/library.json', {
  query: '?raw',
  eager: true,
  import: 'default',
}) as Record<string, string>

const bankJson = import.meta.glob('../../assets/motif-bank/bank.json', {
  query: '?raw',
  eager: true,
  import: 'default',
}) as Record<string, string>

const table = new Map<string, string>()

function ingest(mods: Record<string, string>) {
  for (const [key, value] of Object.entries(mods)) {
    const n = key.replace(/\\/g, '/')
    const idx = n.indexOf('/assets/')
    const rel = idx >= 0 ? n.slice(idx + 1) : n.replace(/^\.\.\//g, '')
    table.set(rel, value)
    table.set(`/${rel}`, value)
  }
}

ingest(family)
ingest(libraryJson)
ingest(bankJson)

export function lookupBrowserAsset(p: string): string | undefined {
  const n = p.replace(/\\/g, '/')
  const hit = table.get(n) ?? table.get(n.replace(/^\//, ''))
  if (hit !== undefined) return hit
  const idx = n.indexOf('/assets/')
  if (idx >= 0) return table.get(n.slice(idx + 1))
  const assets = n.match(/assets\/.+$/)
  return assets ? table.get(assets[0]) : undefined
}
