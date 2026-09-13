import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(process.env.USERPROFILE ?? 'C:\\Users\\Admin', 'Desktop', 'FORMA-Tasarim-Katalogu')

type Hit = {
  slug: string
  folder: string
  file: string
  text: string
}

function collect(): Hit[] {
  const hits: Hit[] = []
  for (const folder of readdirSync(root, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue
    const dir = join(root, folder.name)
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('-artwork.svg')) continue
      hits.push({
        slug: name.replace('-artwork.svg', ''),
        folder: folder.name,
        file: name,
        text: readFileSync(join(dir, name), 'utf8'),
      })
    }
  }
  return hits.sort((a, b) => a.slug.localeCompare(b.slug))
}

const files = collect()

function has(text: string, re: RegExp): boolean {
  return re.test(text)
}

function heroOf(text: string): string {
  return text.match(/data-hero="([^"]+)"/)?.[1] ?? '—'
}

function patternOf(text: string): string {
  return text.match(/data-pattern="([^"]+)"/)?.[1] ?? '—'
}

const rows = files.map((f) => {
  const t = f.text
  return {
    slug: f.slug,
    folder: f.folder,
    hero: heroOf(t),
    pattern: patternOf(t),
    badges: has(t, /data-art="ingredient-badges"/),
    nutrition: has(t, /Besin Değerleri|nutrition-table|data-art="nutrition"/),
    claim: has(t, /data-art="claim"|DOĞAL|KATKISIZ|NET/),
    weee: has(t, /WEEE|weee|data-mark="weee"/),
    perfumeIc: has(t, /2004\.78|986\.01|EAU DE PARFUM|Alcohol Denat/),
    ghs: has(t, /GHS|flammable|data-mark="ghs"/),
    primitive: has(t, /data-art="primitive"/),
    styleBg: has(t, /data-art="style-bg"|ecoGrain|confetti|height="1\.8"|height="2\.2"/),
    glassFork: has(t, /glassfork|7\.15 2\.4/),
    glue: has(t, />GLUE</),
  }
})

const food = rows.filter((r) => r.folder === '04-gida' || r.slug.includes('gida') || r.slug.includes('zeytin') || r.slug.includes('bal') || r.slug.includes('recel') || r.slug.includes('cay') || r.slug.includes('cikolata') || r.slug.includes('kurabiye'))
const perfume = rows.filter((r) => r.folder === '01-parfum')
const creamSerum = rows.filter((r) => r.folder === '02-krem' || r.folder === '03-serum' || r.folder === '08-hero-library')
const elec = rows.filter((r) => r.folder === '05-elektronik' || r.slug.includes('elektronik'))
const clean = rows.filter((r) => r.folder === '07-temizlik')
const heroLib = rows.filter((r) => r.folder === '08-hero-library')

const bleedFoodPerfume = food.filter((r) => r.perfumeIc)
const bleedElecPerfume = elec.filter((r) => r.perfumeIc)
const bleedPerfumeFood = perfume.filter((r) => r.nutrition || r.glassFork)

const libraryHeroes = ['monstera', 'palm', 'organic-wave', 'zebra']
const libHits = new Set(heroLib.filter((r) => libraryHeroes.includes(r.hero)).map((r) => r.hero))

console.log('FILES', files.length)
console.log('HEROES', [...new Set(rows.map((r) => r.hero))].join(', '))
console.log('LIBRARY HEROES IN 08', [...libHits].join(', ') || 'NONE')
console.log('FOOD NUTRITION', food.filter((r) => r.nutrition).map((r) => r.slug).join(', ') || 'NONE')
console.log('FOOD CLAIM', food.filter((r) => r.claim).map((r) => r.slug).join(', ') || 'NONE')
console.log('COSMETIC BADGES', creamSerum.filter((r) => r.badges).map((r) => r.slug).join(', ') || 'NONE')
console.log('PERFUME IC', perfume.filter((r) => r.perfumeIc).map((r) => r.slug).join(', ') || 'NONE')
console.log('ELEC WEEE', elec.filter((r) => r.weee).map((r) => r.slug).join(', ') || 'NONE')
console.log('CLEAN GHS', clean.filter((r) => r.ghs).map((r) => r.slug).join(', ') || 'NONE')
console.log('PRIMITIVES (set>0)', rows.filter((r) => r.primitive).map((r) => r.slug).join(', ') || 'NONE')
console.log('BLEED food←perfume', bleedFoodPerfume.map((r) => r.slug).join(', ') || 'none')
console.log('BLEED elec←perfume', bleedElecPerfume.map((r) => r.slug).join(', ') || 'none')
console.log('BLEED perfume←food', bleedPerfumeFood.map((r) => r.slug).join(', ') || 'none')
console.log('SERUM MODERN PATTERN', rows.find((r) => r.slug.includes('serum-modern'))?.pattern)
console.log('KREM LUXURY PATTERN', rows.find((r) => r.slug.includes('03-krem'))?.pattern)
console.log('PARFUM LUXURY PATTERN', rows.find((r) => r.slug.includes('01-parfum-tuck'))?.pattern)
console.log('JSON')
console.log(JSON.stringify(rows, null, 2))
