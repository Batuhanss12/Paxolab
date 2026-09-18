/*
 * The asset hook has to be registered before the engine is *linked*, not merely before it runs.
 *
 * ESM resolves and loads a module's whole dependency graph before any of its bodies execute, so a
 * plain `import './rawAssets.ts'` at the top of this file is too late: `app.ts` pulls in the design
 * engine during linking, and the engine's `.svg?raw` import fails there. The hook registers when
 * this module's body runs, which is after that.
 *
 * So everything that reaches the engine is imported dynamically, below, once the hook is in place.
 * The isolated check passed for exactly the wrong reason — a dynamic import in a test harness is
 * not the same as a static one in the entry point.
 */
import './rawAssets.ts'
import fs from 'node:fs'
import path from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { safeLog } from './security.ts'

// Loaded after `rawAssets.ts` has registered its hook — see the note above.
const { createApp } = await import('./app.ts')
const { openDb } = await import('./db.ts')

const port = Number(process.env.FORMA_API_PORT ?? process.env.PORT ?? 8787)
const db = openDb()
const app = createApp(db)

/*
 * Serve the built studio from the API's own origin.
 *
 * The studio calls the API with relative paths (`fetch('/api/…')`), which in development works
 * because the Vite dev server proxies `/api` to this process. Nothing was providing that in
 * production: the built studio is a folder of static files, so `/api/…` would resolve against
 * whatever origin happened to serve them. Deployed to a CDN or a separate static host, every call
 * would 404 — and not until deploy day, because the whole flow works locally.
 *
 * Serving `dist/` here removes the question. Studio and API share an origin by construction, no
 * reverse proxy has to be configured correctly for the product to function, and the same-origin
 * requests need no CORS entry. The marketing site stays its own deployment: it needs SSR and SEO,
 * which a canvas application does not.
 *
 * Absent `dist/` — the ordinary development case, where Vite serves the studio on :5173 — this does
 * nothing at all. It is registered after `createApp`, so `/api/*` always matches first.
 */
const studioDir = path.resolve(process.env.FORMA_STUDIO_DIST ?? 'dist')
const studioIndex = path.join(studioDir, 'index.html')
const servesStudio = fs.existsSync(studioIndex)

if (servesStudio) {
  const relativeRoot = path.relative(process.cwd(), studioDir) || '.'
  app.use('/*', serveStatic({ root: relativeRoot }))
  // Client-side routes have no file on disk; hand them the shell rather than a 404. API paths are
  // excluded so a mistyped endpoint still answers as an API, not as HTML.
  app.get('*', (c) => {
    if (c.req.path.startsWith('/api/')) return c.notFound()
    return c.html(fs.readFileSync(studioIndex, 'utf8'))
  })
}

serve({ fetch: app.fetch, port }, (info) => {
  safeLog(`FORMA API listening on http://localhost:${info.port}`)
  safeLog(servesStudio ? `studio served from ${studioDir}` : 'studio not built — Vite serves it in dev')
})
