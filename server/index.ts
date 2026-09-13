import { serve } from '@hono/node-server'
import { createApp } from './app.ts'
import { openDb } from './db.ts'

const port = Number(process.env.FORMA_API_PORT ?? process.env.PORT ?? 8787)
const db = openDb()
const app = createApp(db)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`FORMA API listening on http://localhost:${info.port}`)
})
