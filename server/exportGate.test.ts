/**
 * The paywall is a server, not a politeness.
 *
 * Until now the delivery bundle was built in the browser and downloaded unconditionally: the
 * client asked the credit endpoint first, but skipping that call cost nothing, so anyone who
 * opened devtools took the print files for free. The launch audit put it first among the reasons
 * this could not open to paying customers — there was no revenue path at all.
 *
 * The bytes now come from `POST /api/credits/export`, behind `requireAuth`, and this file asserts
 * the three things that make that a gate rather than a suggestion:
 *
 *   1. a guest gets nothing;
 *   2. a design that fails preflight gets nothing, **even when it claims to pass** — a spec is
 *      JSON the caller wrote, so the server recomputes the verdict and ignores the submitted one;
 *   3. an empty balance gets nothing, and nobody is charged for a file that was not produced.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from './app.ts'
import { openDb, type FormaDb } from './db.ts'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine.ts'
import { emptyBrief } from '../src/engine/fields.ts'
import { resetArtMemory } from '../src/engine/brain/DesignMemory.ts'
import type { DesignBrief, DesignSpec } from '../src/types.ts'

function exportableSpec(): DesignSpec {
  const brief: DesignBrief = {
    ...emptyBrief(),
    brandName: 'Noctis',
    productName: 'Gece Serisi',
    sector: 'kozmetik',
    subProduct: 'parfüm',
    packagingMode: 'label',
    templateId: 'fm-cos-label-bottle',
    styleType: 'luxury',
    colors: 'siyah · altın',
    volume: '50 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 90, W: 0, H: 70 },
  }
  resetArtMemory()
  return new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
}

describe('delivery export — the gate is on the server', () => {
  let db: FormaDb
  let dbPath: string
  let app: ReturnType<typeof createApp>
  let spec: DesignSpec

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `forma-export-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`)
    db = openDb(dbPath)
    app = createApp(db)
    spec = exportableSpec()
  })

  afterEach(() => {
    db.close()
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        fs.unlinkSync(`${dbPath}${suffix}`)
      } catch {
        /* ignore */
      }
    }
  })

  async function register(email = 'export@forma.test') {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'secret123', name: 'Export' }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { token: string }
    return { Authorization: `Bearer ${body.token}`, 'Content-Type': 'application/json' }
  }

  function post(headers: Record<string, string>, body: unknown) {
    return app.request('/api/credits/export', { method: 'POST', headers, body: JSON.stringify(body) })
  }

  it('the design it is given is actually exportable, so the test means something', () => {
    expect(spec.preflight.exportOk, 'fikstür zaten export edemiyor').toBe(true)
  })

  it('a guest gets nothing', async () => {
    const res = await post({ 'Content-Type': 'application/json' }, { spec })
    expect(res.status).toBe(401)
    expect(res.headers.get('Content-Type') ?? '').not.toContain('zip')
  })

  it('a signed-in customer with credits gets a zip', async () => {
    const auth = await register()
    const res = await post(auth, { spec, designKey: spec.id })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/zip')
    expect(res.headers.get('Content-Disposition') ?? '').toMatch(/attachment; filename="noctis-grapxor\.zip"/)
    const bytes = new Uint8Array(await res.arrayBuffer())
    expect(bytes.byteLength).toBeGreaterThan(1000)
    // A store-method zip starts with the local file header signature "PK\003\004".
    expect([bytes[0], bytes[1], bytes[2], bytes[3]]).toEqual([0x50, 0x4b, 0x03, 0x04])
  })

  it('the download is charged', async () => {
    const auth = await register('charge@forma.test')
    const before = (await (await app.request('/api/credits/balance', { headers: auth })).json()) as { balance: number }
    const res = await post(auth, { spec })
    expect(res.status).toBe(200)
    const after = (await (await app.request('/api/credits/balance', { headers: auth })).json()) as { balance: number }
    expect(after.balance).toBeLessThan(before.balance)
  })

  /**
   * The point of recomputing preflight. A caller can set any field they like on the JSON they
   * send, including the one the exporter itself checks.
   */
  it('a forged pass does not open the gate', async () => {
    const auth = await register('forge@forma.test')
    const broken: DesignSpec = {
      ...spec,
      copy: { ...spec.copy, brand: '' },
      preflight: { ...spec.preflight, exportOk: true, items: [] },
    }
    const res = await post(auth, { spec: broken })
    expect(res.status).toBe(422)
    const body = (await res.json()) as { items?: unknown[] }
    expect(Array.isArray(body.items)).toBe(true)
  })

  it('a missing design is refused before anything is built', async () => {
    const auth = await register('empty@forma.test')
    expect((await post(auth, {})).status).toBe(400)
    expect((await post(auth, { spec: 'nope' })).status).toBe(400)
  })

  /**
   * The bundle used to be for printers only. A customer could not show anyone what they had made
   * without opening a vector tool, so a picture goes in beside the print files — checked for shape
   * and size, because it arrives from the browser.
   */
  describe('the shareable picture', () => {
    // 1×1 transparent PNG.
    const PNG =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

    /**
     * The *entry names*, not the bytes. Searching the whole archive for a filename finds it inside
     * OKU.txt too, which is how the first version of this test passed while proving nothing.
     */
    async function names(headers: Record<string, string>, preview?: unknown): Promise<string[]> {
      const res = await post(headers, { spec, preview })
      expect(res.status).toBe(200)
      const bytes = new Uint8Array(await res.arrayBuffer())
      const view = new DataView(bytes.buffer)
      const out: string[] = []
      for (let i = 0; i + 30 < bytes.byteLength; i += 1) {
        if (view.getUint32(i, true) !== 0x04034b50) continue
        const nameLen = view.getUint16(i + 26, true)
        out.push(new TextDecoder().decode(bytes.subarray(i + 30, i + 30 + nameLen)))
      }
      return out
    }

    it('a valid png joins the bundle', async () => {
      const auth = await register('png@forma.test')
      expect((await names(auth, PNG)).some((n) => n.endsWith('-onizleme.png'))).toBe(true)
    })

    it('no preview simply means no picture, never a failed download', async () => {
      const auth = await register('nopng@forma.test')
      expect((await names(auth)).some((n) => n.endsWith('.png'))).toBe(false)
    })

    it('anything that is not a png is dropped rather than packed', async () => {
      const bad: unknown[] = [
        'data:image/png;base64,bm90LWEtcG5n',
        'data:text/html;base64,PHNjcmlwdD4=',
        'https://example.test/x.png',
        42,
      ]
      // A fresh account each time: every call here is a real download and spends a real credit.
      for (const [index, value] of bad.entries()) {
        const auth = await register(`badpng-${index}@forma.test`)
        expect((await names(auth, value)).some((n) => n.endsWith('.png')), String(value)).toBe(false)
      }
    })
  })

  it('an empty balance is refused, and nothing is delivered', async () => {
    const auth = await register('broke@forma.test')
    let guard = 0
    // Spend down to zero through the same endpoint the customer uses.
    for (;;) {
      const res = await post(auth, { spec })
      if (res.status === 402) {
        expect(res.headers.get('Content-Type') ?? '').not.toContain('zip')
        break
      }
      expect(res.status).toBe(200)
      expect((guard += 1)).toBeLessThan(60)
    }
  })
})
