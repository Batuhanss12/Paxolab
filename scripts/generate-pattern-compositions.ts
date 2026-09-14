/**
 * Phase 14 — atomize ART-PATTERN-DESİGN into a motif bank and compose faces
 * from 2–5 atoms (gallery HOLD).
 *
 * Output: C:\Users\Admin\Desktop\FORMA-Pattern-Yeni-Tasarimlar\
 */
import { promises as fs } from 'node:fs'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  ART_PATTERN_ASSET_DIR,
  ART_PATTERN_SOURCE_DIR,
  FORBIDDEN_SOURCE_NAME,
  ingestArtPatternLibrary,
  usableArtPatterns,
} from '../src/engine/artwork/artPatternLibrary'
import { atomizeArtPattern, isWeakSheet } from '../src/engine/artwork/artMotifAtomizer'
import { writeMotifBank, MOTIF_BANK_DIR, clearMotifBankCache } from '../src/engine/artwork/artMotifBank'
import { resolveMotifRecipeId } from '../src/engine/artwork/artMotifCompose'
import { renderArtworkDoc, renderFrontSvg } from '../src/engine/artwork/renderArtwork'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { JOBS, briefFrom } from './catalog-jobs'

const OUT_ROOT = 'C:\\Users\\Admin\\Desktop\\FORMA-Pattern-Yeni-Tasarimlar'
const PARTS_DIR = path.join(OUT_ROOT, '01-bilesenler')
const FACE_DIR = path.join(OUT_ROOT, '02-tasarimlar')

const JOB_CYCLE = [
  '01-parfum-tuck-luxury',
  '08-zeytinyagi-tuck-luxury',
  '04-serum-tuck-minimal',
  '14-kulaklik-tuck-modern',
  '20-temizlik-tuck-minimal',
  '06-krem-wrap-modern',
  '17-evrensel-kozmetik-tuck',
  '09-cikolata-tray-playful',
  '15-kablo-tuck-modern',
  '03-krem-tuck-luxury',
  '07-serum-wrap-minimal',
  '18-evrensel-gida-tuck',
]

function sectorOf(slug: string): string {
  const job = JOBS.find((item) => item.slug === slug)
  return job?.sectorFolder ?? slug
}

async function emptyDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
  for (const name of await fs.readdir(dir)) {
    await fs.rm(path.join(dir, name), { recursive: true, force: true })
  }
}

async function main() {
  if (ART_PATTERN_SOURCE_DIR.includes(FORBIDDEN_SOURCE_NAME)) {
    throw new Error(`Refusing ${FORBIDDEN_SOURCE_NAME}`)
  }

  const entries = usableArtPatterns(ingestArtPatternLibrary(ART_PATTERN_SOURCE_DIR, ART_PATTERN_ASSET_DIR))
  clearMotifBankCache()
  const bank = writeMotifBank(entries, MOTIF_BANK_DIR)

  await emptyDir(PARTS_DIR)
  await emptyDir(FACE_DIR)

  const engine = new FormaLocalEngine()
  const ozet: string[] = [
    'FORMA — Phase 15 blank-canvas + motif atoms (galeri HOLD dokunulmadı)',
    `kaynak: ${ART_PATTERN_SOURCE_DIR}`,
    `bank: ${MOTIF_BANK_DIR}`,
    `bileşenler: ${PARTS_DIR}`,
    '',
  ]
  const analiz: string[] = ['ID\tATOMS\tWEAK\tROLES\tMAX_ATOM_BYTES\tSHEET_BYTES']
  const sectors: Record<string, number> = {}
  let paintedFaces = 0

  let jobIndex = 0
  for (const entry of entries) {
    const raw = readFileSync(entry.assetPath, 'utf8')
    const atoms = atomizeArtPattern(entry, raw)
    const weak = isWeakSheet(entry, atoms)
    const roles = [...new Set(atoms.map((a) => a.roleGuess))].join(',')
    const maxAtom = atoms.reduce((m, a) => Math.max(m, a.bytes), 0)
    analiz.push([entry.id, atoms.length, weak ? 'yes' : 'no', roles, maxAtom, entry.bytes].join('\t'))

    const sheetDir = path.join(PARTS_DIR, entry.id)
    await fs.mkdir(sheetDir, { recursive: true })
    for (const atom of atoms) {
      const name = `${atom.id.split('__')[1] ?? atom.id}.svg`
      await fs.writeFile(path.join(sheetDir, name), atom.markup, 'utf8')
    }

    if (weak || !atoms.length || entry.id === '68') {
      ozet.push(`${entry.id} SKIP weak/empty atoms=${atoms.length}`)
      console.log(`${entry.id} skipped (weak)`)
      continue
    }

    const jobSlug = JOB_CYCLE[jobIndex % JOB_CYCLE.length]
    jobIndex += 1
    const job = JOBS.find((item) => item.slug === jobSlug)
    if (!job) throw new Error(`missing job ${jobSlug}`)
    const recipe = resolveMotifRecipeId(atoms, job.styleType, jobIndex)
    resetArtMemory()
    const spec = engine.generate({
      brief: briefFrom(job),
      overridePatch: {
        variationIndex: jobIndex % 4,
        artPatternId: entry.id,
        artPatternCompose: true,
        motifRecipeId: recipe,
        blankCanvas: true,
      },
    })
    const n = String(paintedFaces + 1).padStart(2, '0')
    const base = `${n}-${entry.id}-${jobSlug}`
    const front = renderFrontSvg(spec.dieline, spec.artwork, spec.palette)
    const full = renderArtworkDoc(spec.dieline, spec.artwork, `${base} — motif atoms`)
    await fs.writeFile(path.join(FACE_DIR, `${base}-front.svg`), front, 'utf8')
    await fs.writeFile(path.join(FACE_DIR, `${base}-full.svg`), full, 'utf8')

    const atomMarks = (front.match(/data-motif-atom="/g) || []).length
    const ops = [...front.matchAll(/data-art="art-pattern-compose"[^>]*opacity="([0-9.]+)"/g)].map((m) => Number(m[1]))
    const line = [
      base,
      `atoms:${atoms.length}`,
      `recipe:${recipe}`,
      `painted:${atomMarks}`,
      `hero:${/data-art="hero"/.test(front) ? 'YES' : 'no'}`,
      `goldBar:${/data-art="gold-bar"/.test(front) ? 'YES' : 'no'}`,
      `minOp:${ops.length ? Math.min(...ops).toFixed(2) : '-'}`,
    ].join(' | ')
    ozet.push(line)
    console.log(line)

    if (/data-hero="seal"/.test(front)) throw new Error(`${base} shipped seal`)
    if (!atomMarks) throw new Error(`${base} missing motif atoms`)
    if (atomMarks > 5) throw new Error(`${base} painted ${atomMarks} atoms`)
    if (ops.some((n) => n < 0.28)) throw new Error(`${base} opacity < 0.28`)
    const sec = sectorOf(jobSlug)
    sectors[sec] = (sectors[sec] ?? 0) + 1
    paintedFaces += 1
  }

  const total = paintedFaces || 1
  ozet.push('')
  ozet.push('sektör: ' + Object.entries(sectors).map(([k, v]) => `${k}:${v}`).join(', '))
  ozet.push(`bank sheets: ${bank.sheets.length}`)
  ozet.push('Galeri / Critiquito klasörü yeniden üretilmedi.')
  for (const [sec, n] of Object.entries(sectors)) {
    if (n / total > 0.3) throw new Error(`sector ${sec} is ${(n / total * 100).toFixed(0)}% (>30%)`)
  }

  await fs.writeFile(path.join(OUT_ROOT, '00-ANALIZ.txt'), `\uFEFF${analiz.join('\n')}\n`, 'utf8')
  await fs.writeFile(path.join(OUT_ROOT, 'OZET.txt'), `\uFEFF${ozet.join('\n')}\n`, 'utf8')
  console.log(`wrote ${OUT_ROOT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
