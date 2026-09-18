/**
 * Delivery files, built on the server.
 *
 * The studio's engine runs in the browser, which is right for previews — a design appears in
 * milliseconds without a round trip. It was also the entire paywall: `downloadZip` built the
 * bundle locally and called the credit endpoint out of politeness, so anyone who opened devtools
 * could take the print files without signing in or spending anything. The audit put it first
 * among the reasons this could not open to paying customers.
 *
 * So the bytes the customer pays for are produced here, behind `requireAuth`, and the client no
 * longer carries the exporter at all.
 *
 * Two rules this module exists to enforce:
 *
 *   1. **The client's own verdict is never trusted.** `buildUserExportFiles` refuses a spec whose
 *      `preflight.exportOk` is false, and a spec arrives as JSON the caller wrote. Preflight is
 *      recomputed here from the brief, the dieline and the artwork, and the recomputed report
 *      replaces whatever was sent.
 *   2. **Nothing is charged for bytes that do not exist.** The bundle is built first; the credit
 *      is taken only once there is a file to hand over.
 */
import { runPreflight } from '../src/engine/production/preflight.ts'
import { buildOutlinedExportFiles } from '../src/engine/production/exportDoc.ts'
import { zipStore } from '../src/engine/production/zipStore.ts'
import type { DesignSpec } from '../src/types.ts'

export type ExportBundle = { name: string; bytes: Uint8Array }

export class ExportBlocked extends Error {
  readonly items: { id: string; label: string; detail: string }[]
  constructor(items: { id: string; label: string; detail: string }[]) {
    super('Tasarım baskı kontrolünden geçmedi.')
    this.name = 'ExportBlocked'
    this.items = items
  }
}

/** The filename the customer sees. Brand-derived, ascii-safe, never empty. */
export function exportSlug(spec: DesignSpec): string {
  const raw = (spec.copy?.brand || 'grapxor').toLocaleLowerCase('tr')
  const ascii = raw
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return ascii || 'grapxor'
}

/**
 * The customer's own picture of their design.
 *
 * Everything in the bundle until now was for a printer: knife lines, a dieline, outlined SVGs. A
 * customer could not send a client, a supplier or a colleague a look at what they had made without
 * opening a vector tool first. A PNG costs nothing and answers that.
 *
 * It arrives from the browser, which is where the canvas is — the print files are still built here
 * and are the only thing the credit buys. This is a picture, so it is checked for shape and size
 * and otherwise taken at face value: a customer who forges their own preview has forged a preview.
 */
const MAX_PREVIEW_BYTES = 3 * 1024 * 1024

function previewBytes(dataUrl: unknown): Uint8Array | null {
  if (typeof dataUrl !== 'string') return null
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim())
  if (!match) return null
  let bytes: Uint8Array
  try {
    bytes = Uint8Array.from(Buffer.from(match[1], 'base64'))
  } catch {
    return null
  }
  if (!bytes.byteLength || bytes.byteLength > MAX_PREVIEW_BYTES) return null
  // PNG magic: 89 50 4E 47. A base64 blob that decodes to anything else does not go in the zip.
  const magic = [0x89, 0x50, 0x4e, 0x47]
  if (magic.some((byte, i) => bytes[i] !== byte)) return null
  return bytes
}

/**
 * Re-run preflight and build the ZIP. Throws `ExportBlocked` when the design does not pass.
 *
 * The recomputed report is written back onto the spec because `buildUserExportFiles` reads
 * `spec.preflight` — this is the single place where the server's verdict replaces the client's.
 */
export async function buildDeliveryZip(spec: DesignSpec, preview?: unknown): Promise<ExportBundle> {
  const verdict = runPreflight(spec)
  const checked: DesignSpec = { ...spec, preflight: verdict }
  if (!verdict.exportOk) {
    throw new ExportBlocked(
      verdict.items
        .filter((item) => item.status === 'fail')
        .map((item) => ({ id: item.id, label: item.label, detail: item.detail })),
    )
  }
  const files = await buildOutlinedExportFiles(checked)
  if (!files?.length) throw new ExportBlocked([{ id: 'export', label: 'Dışa aktarma', detail: 'Paket üretilemedi.' }])
  const slug = exportSlug(checked)
  const png = previewBytes(preview)
  if (png) {
    files.push({ name: `${slug}-onizleme.png`, data: png })
    // The readme lists what is in the bundle, so the line goes in with the file and not before it.
    const readme = files.find((file) => file.name === 'OKU.txt')
    if (readme && typeof readme.data === 'string') {
      readme.data = readme.data.replace(
        '  *-artwork.svg   baskı yüzü, bıçak değil',
        ['  *-artwork.svg   baskı yüzü, bıçak değil', '  *-onizleme.png  tasarımın resmi — paylaşmak için, baskı için değil'].join('\n'),
      )
    }
  }
  // `zipStore` answers a Blob because it was written for the browser; Node has had one since 18.
  const blob = zipStore(files)
  return { name: `${slug}-grapxor.zip`, bytes: new Uint8Array(await blob.arrayBuffer()) }
}
