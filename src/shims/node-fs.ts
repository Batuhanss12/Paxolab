import './buffer-global'
import { lookupBrowserAsset } from './browserAssets'

export function existsSync(p: string): boolean {
  return lookupBrowserAsset(String(p)) !== undefined
}

export function readFileSync(p: string, encoding?: string): string {
  const hit = lookupBrowserAsset(String(p))
  if (hit === undefined) {
    const err = new Error(`ENOENT: no such file ${p}`) as Error & { code: string }
    err.code = 'ENOENT'
    throw err
  }
  void encoding
  return hit
}

export function mkdirSync(_p?: string, _opts?: unknown): void {}
export function writeFileSync(_p?: string, _data?: unknown, _opts?: unknown): void {}
export function rmSync(_p?: string, _opts?: unknown): void {}

export function readdirSync(_dir: string, opts?: { withFileTypes?: boolean }): unknown[] {
  if (opts?.withFileTypes) return []
  return []
}
