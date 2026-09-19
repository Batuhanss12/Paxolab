/**
 * What the shipped app actually reaches, by walking imports from its real entry points.
 *
 * The roadmap has carried "retire the kit path" for a long time on the strength of a line count.
 * Before deleting twelve thousand lines it is worth knowing which of them the product can still
 * reach: `src/engine/artwork` holds both the retired kit painters and a handful of modules the
 * studio path genuinely depends on, and the two are not separated by directory.
 *
 * This walks the static import graph from `src/main.tsx` (the SPA) and the server entry, and
 * reports every file under a root that nothing reachable imports. Static only — a file reached
 * solely through `import()` or a string key would be reported unreachable, so treat the list as
 * "candidates to verify", not "safe to delete".
 *
 * Permanent instrument. Run: `npx vite-node scripts/measure-reachability.ts [rootDir]`
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const ROOT = resolve('.')
const WATCH = process.argv[2] ?? 'src/engine/artwork'
const ENTRIES = ['src/main.tsx', 'server/app.ts', 'server/index.ts'].filter((p) => existsSync(p))

const EXTS = ['.ts', '.tsx', '.js', '.json']

/** Resolve a specifier the way the bundler does: exact, +ext, /index+ext. */
function resolveSpec(fromFile: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null
  const base = resolve(dirname(fromFile), spec)
  if (existsSync(base) && statSync(base).isFile()) return base
  for (const ext of EXTS) if (existsSync(base + ext)) return base + ext
  for (const ext of EXTS) if (existsSync(join(base, `index${ext}`))) return join(base, `index${ext}`)
  return null
}

const IMPORT = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g

const seen = new Set<string>()
const queue = ENTRIES.map((e) => resolve(e))
while (queue.length > 0) {
  const file = queue.pop()!
  if (seen.has(file)) continue
  seen.add(file)
  if (!/\.(ts|tsx)$/.test(file)) continue
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(IMPORT)) {
    const spec = m[1] ?? m[2]
    if (!spec) continue
    const next = resolveSpec(file, spec)
    if (next && !seen.has(next)) queue.push(next)
  }
}

/** Every source file under the watched root, tests excluded — tests are not the product. */
function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full)
  }
  return out
}

const all = walk(resolve(WATCH))
const reached = all.filter((f) => seen.has(f))
const orphan = all.filter((f) => !seen.has(f))
const lines = (files: string[]) => files.reduce((n, f) => n + readFileSync(f, 'utf8').split('\n').length, 0)

console.log(`giriş noktaları: ${ENTRIES.join(' · ')}`)
console.log(`ulaşılan dosya (tüm proje): ${seen.size}`)
console.log(`\n${WATCH}: ${all.length} dosya · ${lines(all)} satır`)
console.log(`  ulaşılabilir  ${String(reached.length).padStart(3)} dosya · ${String(lines(reached)).padStart(6)} satır`)
console.log(`  ulaşılamaz    ${String(orphan.length).padStart(3)} dosya · ${String(lines(orphan)).padStart(6)} satır`)

if (reached.length > 0) {
  console.log('\nulaşılabilir olanlar (kalması gerekenler):')
  for (const f of reached.sort()) console.log(`  ${relative(ROOT, f).replace(/\\/g, '/')}`)
}
console.log(`\nulaşılamayanlardan ilk 20:`)
for (const f of orphan.sort().slice(0, 20)) console.log(`  ${relative(ROOT, f).replace(/\\/g, '/')}`)
