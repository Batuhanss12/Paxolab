import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildPressProofKit } from '../src/engine/production/pressProof'

const kit = buildPressProofKit()
const root = join(process.cwd(), 'certs', 'press-proof')
mkdirSync(root, { recursive: true })
writeFileSync(join(root, 'KALIPHANE.txt'), kit.brief, 'utf8')
writeFileSync(
  join(root, 'INDEX.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      primary: kit.packs.find((p) => p.sku.role === 'primary')?.folder,
      packs: kit.packs.map((p) => ({
        role: p.sku.role,
        folder: p.folder,
        templateId: p.sku.templateId,
        dims: p.sku.dims,
        structureId: p.spec.structureId,
        exportOk: p.spec.preflight.exportOk,
      })),
    },
    null,
    2,
  ),
  'utf8',
)

for (const pack of kit.packs) {
  const dir = join(root, pack.folder)
  mkdirSync(dir, { recursive: true })
  for (const file of pack.files) {
    const path = join(dir, file.name)
    if (typeof file.data === 'string') writeFileSync(path, file.data, 'utf8')
    else writeFileSync(path, file.data)
  }
  console.log(`wrote ${dir}  CUT ${pack.shop.cut} CREASE ${pack.shop.crease}`)
}

console.log(`brief ${join(root, 'KALIPHANE.txt')}`)
console.log('forma-press-proof exit 0')
