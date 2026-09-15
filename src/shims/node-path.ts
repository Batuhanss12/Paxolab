function normalize(p: string): string {
  return p.replace(/\\/g, '/')
}

export function join(...parts: string[]): string {
  const raw = parts.map(normalize).filter((p) => p.length > 0).join('/')
  return raw.replace(/\/{2,}/g, '/')
}

export function dirname(p: string): string {
  const n = normalize(p).replace(/\/+$/, '')
  const i = n.lastIndexOf('/')
  if (i < 0) return '.'
  if (i === 0) return '/'
  return n.slice(0, i)
}

export function basename(p: string): string {
  const n = normalize(p).replace(/\/+$/, '')
  const i = n.lastIndexOf('/')
  return i >= 0 ? n.slice(i + 1) : n
}

export function resolve(...parts: string[]): string {
  const segs: string[] = []
  for (const part of parts) {
    const n = normalize(part)
    if (!n) continue
    if (n.startsWith('/')) segs.length = 0
    for (const seg of n.split('/')) {
      if (!seg || seg === '.') continue
      if (seg === '..') segs.pop()
      else segs.push(seg)
    }
  }
  return `/${segs.join('/')}`
}

export const sep = '/'

const path = { join, dirname, basename, resolve, sep }
export default path
