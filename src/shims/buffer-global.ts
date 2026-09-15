function utf8Bytes(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

function utf8ToB64(s: string): string {
  const bytes = utf8Bytes(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

type BufferLike = {
  byteLength(s: string): number
  from(data: string | Uint8Array, enc?: string): { length: number; toString(enc?: string): string }
}

const BufferShim: BufferLike = {
  byteLength(s: string) {
    return utf8Bytes(String(s)).length
  },
  from(data: string | Uint8Array, _enc?: string) {
    const str = typeof data === 'string' ? data : new TextDecoder().decode(data)
    return {
      length: utf8Bytes(str).length,
      toString(enc?: string) {
        if (enc === 'base64') return utf8ToB64(str)
        return str
      },
    }
  },
}

const root = globalThis as unknown as { Buffer?: BufferLike }
if (typeof root.Buffer === 'undefined') root.Buffer = BufferShim
