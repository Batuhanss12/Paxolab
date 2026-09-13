# Paxolab Phase 6 — Platform Foundation

## What was built

Local backend foundation for FORMA (Vite+React design studio):

| Area | Details |
|------|---------|
| API | Hono + `@hono/node-server`, default port **8787** |
| DB | SQLite via Node built-in **`node:sqlite` (`DatabaseSync`)** → `server/data/forma.sqlite` |
| Auth | Register / login / logout / me; Bearer sessions; `crypto.scrypt` password hashes |
| Projects | List / get / create / upsert (PUT) / delete — studio session JSON in `payload_json` |
| Frontend | `src/api/*`, Turkish `AuthPanel`, Landing + Workspace wiring |
| Sync | Guest = localStorage only; logged-in = debounced cloud PUT; on login load latest server project or push local |
| Proxy | Vite `/api` → `http://localhost:8787` |

### Windows / no native build tools

- **Requires Node ≥ 22.5 (user: Node 24).** Uses built-in `node:sqlite` — **no `better-sqlite3`, no Visual Studio C++ / node-gyp**.
- `npm install` works on Windows without native compile.
- WAL pragma is applied when supported; skipped safely otherwise.
- Same schema, routes, and API behavior as the earlier `better-sqlite3` Phase 6.

### Tables

- `users` — id, email (unique), password_hash, name, created_at, role (`user`)
- `sessions` — id (token), user_id, created_at, expires_at
- `projects` — id, user_id, title, payload_json, updated_at, created_at

### Routes

- `POST /api/auth/register` `{email,password,name?}` → `{user,token}`
- `POST /api/auth/login` → `{user,token}`
- `POST /api/auth/logout` (auth)
- `GET /api/auth/me` (auth)
- `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/:id` (auth)
- `GET /api/health`

## How to run

```bash
cd /workspace/paxolab-src
npm install
npm run server    # terminal 1 — API :8787
npm run dev       # terminal 2 — Vite :5173
# or: npm run dev:all
```

Optional env (see `.env.example`): `FORMA_API_PORT=8787`.

## Tests

```bash
npm test            # existing engine tests (server excluded from Vite transform)
npm run test:server # register→login→create→get→me (+ validation)
```

## NOT included (later phases)

- Stripe / iyzico / payments
- Credits / billing / wallets
- Cloud hosting / multi-tenant SaaS
- Email verification / OAuth / password reset
- Real-time collaboration
- Git commit / push (out of scope for this deliverable)

## Files touched (high level)

- `server/` — db, auth, app, index, tests (`node:sqlite` / `DatabaseSync`)
- `src/api/` — client, auth, projects
- `src/components/AuthPanel.tsx`
- `src/projectStore.ts`, `App.tsx`, Landing/Workspace
- `package.json` (removed `better-sqlite3` + `@types/better-sqlite3`), `vite.config.ts`, `vitest.server.config.ts`
- `.gitignore` (`server/data/`), `.env.example`, `README.md`
