import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export type FormaDb = DatabaseSync

export type UserRow = {
  id: string
  email: string
  password_hash: string
  name: string | null
  created_at: string
  role: string
}

export type SessionRow = {
  id: string
  user_id: string
  created_at: string
  expires_at: string
}

export type ProjectRow = {
  id: string
  user_id: string
  title: string
  payload_json: string
  updated_at: string
  created_at: string
}

export type WalletRow = {
  user_id: string
  balance: number
  updated_at: string
}

export type CreditTransactionRow = {
  id: string
  user_id: string
  kind: string
  amount: number
  balance_after: number
  ref_id: string | null
  meta_json: string | null
  created_at: string
}

export type CreditReservationRow = {
  id: string
  user_id: string
  amount: number
  status: string
  operation: string
  client_request_id: string | null
  created_at: string
  finalized_at: string | null
}

export function defaultDbPath(): string {
  return path.join(__dirname, 'data', 'forma.sqlite')
}

export function openDb(dbPath: string = defaultDbPath()): DatabaseSync {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }
  const db = new DatabaseSync(dbPath)
  try {
    db.exec('PRAGMA journal_mode = WAL')
  } catch {
    /* WAL may be unsupported (e.g. some :memory: / platform cases); skip safely */
  }
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  return db
}

export function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON projects(user_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS wallets (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      balance INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      ref_id TEXT,
      meta_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_credit_tx_user_created
      ON credit_transactions(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS credit_reservations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      operation TEXT NOT NULL,
      client_request_id TEXT,
      created_at TEXT NOT NULL,
      finalized_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_reservations_client_req
      ON credit_reservations(user_id, client_request_id)
      WHERE client_request_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_credit_reservations_user
      ON credit_reservations(user_id, created_at DESC);
  `)
}
