import { describe, expect, it } from 'vitest'
import { JOBS as CATALOG_JOBS } from '../../../scripts/catalog-jobs'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'
import { generateStudioFace, hashStudioFace, STUDIO_FACE_GOLDEN } from './studioGolden'

describe('studio golden — 18 faces, kit freeze stays apart', () => {
  it('locks 9 sectors × 2 surfaces and keeps hashes unique', () => {
    expect(STUDIO_GALLERY_JOBS).toHaveLength(18)
    expect(Object.keys(STUDIO_FACE_GOLDEN)).toHaveLength(18)
    expect(new Set(Object.values(STUDIO_FACE_GOLDEN).map((row) => row.hash)).size).toBe(18)
  })

  it('does not reuse catalog freeze slugs', () => {
    const catalog = new Set(CATALOG_JOBS.map((job) => job.slug))
    for (const job of STUDIO_GALLERY_JOBS) {
      expect(catalog.has(job.slug), job.slug).toBe(false)
    }
  })

  it('paints each studio face to the frozen DNA + hash', () => {
    const collapsed = ['03-serum-kutu', '03-serum-etiket', '07-bebek-kutu', '07-bebek-etiket', '09-temizlik-kutu', '09-temizlik-etiket']
    for (const job of STUDIO_GALLERY_JOBS) {
      const face = generateStudioFace(job)
      const freeze = STUDIO_FACE_GOLDEN[job.slug]
      expect(freeze, job.slug).toBeTruthy()
      expect(face.studio, job.slug).toBe(true)
      expect(face.archetype, job.slug).toBe(freeze.archetype)
      expect(face.background, job.slug).toBe(freeze.background)
      expect(face.family, job.slug).toBe(freeze.family)
      expect(face.hash, job.slug).toBe(freeze.hash)
      if (collapsed.includes(job.slug)) {
        expect(face.archetype, job.slug).not.toBe('botanical-card')
        expect(face.archetype, job.slug).not.toBe('card-on-art')
      }
    }
  })

  it('same generate twice yields the same face hash', () => {
    const a = generateStudioFace(STUDIO_GALLERY_JOBS[8])
    const b = generateStudioFace(STUDIO_GALLERY_JOBS[8])
    expect(a.hash).toBe(b.hash)
    expect(hashStudioFace(a.markup)).toBe(a.hash)
  })
})
