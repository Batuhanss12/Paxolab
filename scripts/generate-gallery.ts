/**
 * Tüm sektör ve ürünler için SVG tasarımlar üretir.
 * Her sektör+ürün+stil kombinasyonu için hem set 0 (motor) hem set 1+ (GraphicLibrary) üretir.
 * Çıktı: C:\Users\Admin\Desktop\FORMA-Tasarim-Galerisi\
 *   ├── 01-parfum/
 *   │   ├── 01-parfum-tuck-luxury-set0.svg
 *   │   ├── 01-parfum-tuck-luxury-set1.svg
 *   │   ├── 01-parfum-tuck-luxury-set2.svg
 *   │   └── ...
 *   ├── 02-krem/
 *   ├── 03-serum/
 *   ├── 04-gida/
 *   ├── 05-elektronik/
 *   ├── 06-evrensel/
 *   ├── 07-temizlik/
 *   └── 08-hero-library/
 *
 * Kullanım: npx vite-node scripts/generate-gallery.ts
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { scoreVisualCraft } from '../src/engine/brain/DesignScore'
import { renderFrontSvg, renderArtworkDoc } from '../src/engine/artwork/renderArtwork'
import { JOBS, briefFrom } from './catalog-jobs'

const OUT_ROOT = 'C:\\Users\\Admin\\Desktop\\FORMA-Tasarim-Galerisi'

async function main() {
  await fs.mkdir(OUT_ROOT, { recursive: true })
  const engine = new FormaLocalEngine()
  let totalGenerated = 0
  const summary: string[] = []

  for (const job of JOBS) {
    resetArtMemory()
    const sectorDir = path.join(OUT_ROOT, job.sectorFolder)
    await fs.mkdir(sectorDir, { recursive: true })

    // Her job için 3 set üret: set0 (motor), set1 (library v1), set2 (library v2)
    for (const setIdx of [0, 1, 2]) {
      resetArtMemory()
      const spec = engine.generate({
        brief: briefFrom(job),
        overridePatch: {
          variationIndex: setIdx,
          heroFamily: job.heroFamily,
        },
      })
      const plan = spec.designPlan
      if (!plan) throw new Error(`${job.slug} set${setIdx} missing plan`)

      const frontSvg = renderFrontSvg(spec.dieline, spec.artwork, spec.palette)
      const fullSvg = renderArtworkDoc(spec.dieline, spec.artwork, `${job.slug} — set${setIdx}`)
      const craft = scoreVisualCraft(spec, plan)

      const baseName = `${job.slug}-set${setIdx}`
      const frontPath = path.join(sectorDir, `${baseName}-front.svg`)
      const fullPath = path.join(sectorDir, `${baseName}-full.svg`)
      await fs.writeFile(frontPath, frontSvg, 'utf8')
      await fs.writeFile(fullPath, fullSvg, 'utf8')
      totalGenerated++

      const heroPainted = /data-art="hero"/.test(frontSvg)
      const patternPainted = /data-art="pattern"/.test(frontSvg)
      const motifPainted = /data-art="motif"/.test(frontSvg)
      const primitivePainted = /data-art="prim"/.test(frontSvg)
      const composition = plan.composition.intent

      const line = [
        `${baseName}`,
        `hero:${plan.heroGraphic.family}${heroPainted ? '' : '(no-paint)'}`,
        `pattern:${plan.patternSystem.family}${patternPainted ? '' : '(no-paint)'}`,
        `intent:${composition}`,
        `craft:${craft.visualCraft}`,
        `export:${spec.preflight.exportOk ? 'OK' : 'BLOCK'}`,
      ].join(' | ')
      summary.push(line)
      console.log(line)
    }
    summary.push('')
  }

  // Özet dosyası
  await fs.writeFile(path.join(OUT_ROOT, 'OZET.txt'), summary.join('\n'), 'utf8')

  // README
  const readme = `# FORMA Tasarım Galerisi

Bu klasör, FORMA tasarım motorunun tüm sektör ve ürünler için ürettiği tasarımları içerir.

## Klasör Yapısı

Her sektör için ayrı klasör:
- 01-parfum — Parfüm/kolonya (tuck + wrap)
- 02-krem — Krem kutusu + wrap
- 03-serum — Serum kutusu + wrap
- 04-gida — Zeytinyağı, çikolata, kurabiye, bal, reçel, çay
- 05-elektronik — Kulaklık, kablo, cihaz
- 06-evrensel — Evrensel tuck (kozmetik/gıda/elektronik)
- 07-temizlik — Temizlik ürünü
- 08-hero-library — Hero library variation'ları (monstera, palm, wave, zebra)

## Dosya Adlandırma

Her job için 3 set:
- *-set0-* — Motorun mevcut painter'ları (GraphicLibrary devre dışı)
- *-set1-* — GraphicLibrary variation 1 (pattern + primitive library'den)
- *-set2-* — GraphicLibrary variation 2 (yeni composition intent'ler + library)

Her set için 2 dosya:
- *-front.svg — Sadece ön panel
- *-full.svg — Tüm dieline (tüm paneller)

## Toplam

${totalGenerated} SVG dosyası üretildi.

## Mimari

- 75 grafik kayıtlı (18 pattern, 23 motif, 12 primitive, 8 composition, 14 hero)
- 180 grammar kombinasyonu çözülebilir
- Deterministic selection (brief+style+sector+variation → graphic picks)
- Composition intent'ler: symmetric, asymmetric, grid, offset, diagonal, editorial, floating, full-bleed
`
  await fs.writeFile(path.join(OUT_ROOT, 'README.md'), readme, 'utf8')

  console.log(`\n=== TAMAMLANDI ===`)
  console.log(`${totalGenerated} SVG dosyası üretildi: ${OUT_ROOT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
