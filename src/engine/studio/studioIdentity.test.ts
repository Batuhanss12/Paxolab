import { beforeEach, describe, expect, it } from 'vitest'
import { resetArtMemory } from '../brain/DesignMemory'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { parseIntent } from '../iterate/parseIntent'
import { paintMark, STUDIO_MIN_LOGO_R } from './anatomy'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'
import { generateStudioFace, hashStudioFace, STUDIO_FACE_GOLDEN } from './studioGolden'

const LOGO = 'paxo-user-logo.svg'
const COFFEE = STUDIO_GALLERY_JOBS.find((job) => job.slug === '05-kahve-kutu')!

function coffeeGenerate(extra: { logoHref?: string; overridePatch?: Record<string, unknown> } = {}) {
  return new FormaLocalEngine().generate({
    brief: {
      ...emptyBrief(),
      brandName: COFFEE.brand,
      productName: COFFEE.product,
      sector: COFFEE.sector,
      subProduct: COFFEE.subProduct,
      packagingMode: COFFEE.packagingMode,
      templateId: COFFEE.templateId,
      styleType: COFFEE.styleType,
      colors: COFFEE.colors,
      volume: COFFEE.volume,
      dimensionsMm: COFFEE.dimensionsMm,
    },
    overridePatch: { studio: true, premium: true, variationIndex: 0, ...extra.overridePatch },
    logoHref: extra.logoHref,
  })
}

function heroMarkup(spec: ReturnType<FormaLocalEngine['generate']>): string {
  return spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? ''
}

function logoWidth(markup: string): number {
  const match = markup.match(/data-art="brand-logo"[^>]*width="([\d.]+)"/)
  return Number(match?.[1] ?? 0)
}

describe('studio identity — logo + scales on P1', () => {
  beforeEach(() => resetArtMemory())

  it('keeps golden hashes when there is no logo and scales are 1', () => {
    const face = generateStudioFace(COFFEE)
    expect(face.hash).toBe(STUDIO_FACE_GOLDEN[COFFEE.slug].hash)
    expect(heroMarkup(coffeeGenerate())).not.toContain('data-art="brand-logo"')
  })

  it('paints the user logo on the marble lockup instead of the vector mark', () => {
    const markup = heroMarkup(coffeeGenerate({ logoHref: LOGO }))
    expect(markup).toContain('data-art="brand-logo"')
    expect(markup).toContain(LOGO)
    expect(hashStudioFace(markup)).not.toBe(STUDIO_FACE_GOLDEN[COFFEE.slug].hash)
  })

  it('applies logoScale to the painted logo size', () => {
    const base = logoWidth(heroMarkup(coffeeGenerate({ logoHref: LOGO })))
    const grown = logoWidth(heroMarkup(coffeeGenerate({ logoHref: LOGO, overridePatch: { logoScale: 1.35 } })))
    const shrunk = logoWidth(heroMarkup(coffeeGenerate({ logoHref: LOGO, overridePatch: { logoScale: 0.72 } })))
    expect(base).toBeGreaterThan(0)
    expect(grown).toBeGreaterThan(base)
    expect(shrunk).toBeLessThan(base)
  })

  it('applies titleScale to studio type without changing the no-logo golden at scale 1', () => {
    const identity = coffeeGenerate()
    const opened = coffeeGenerate({ overridePatch: { titleScale: 1.28 } })
    expect(hashStudioFace(heroMarkup(identity))).toBe(STUDIO_FACE_GOLDEN[COFFEE.slug].hash)
    expect(hashStudioFace(heroMarkup(opened))).not.toBe(STUDIO_FACE_GOLDEN[COFFEE.slug].hash)
  })

  it('honors logoyu büyüt on the studio face', () => {
    const intent = parseIntent('logoyu büyüt', 'luxury')
    const base = logoWidth(heroMarkup(coffeeGenerate({ logoHref: LOGO })))
    const grown = logoWidth(
      heroMarkup(coffeeGenerate({ logoHref: LOGO, overridePatch: intent.overridePatch })),
    )
    expect(intent.overridePatch.logoScale).toBe(1.35)
    expect(grown).toBeGreaterThan(base)
  })

  it('does not auto-apply luxury-tighten 1.1 on studio; kit still does', () => {
    const studio = coffeeGenerate({ overridePatch: { directorCue: 'luxury-tighten' } })
    expect(studio.overrides.titleScale).toBe(1)
    expect(hashStudioFace(heroMarkup(studio))).toBe(STUDIO_FACE_GOLDEN[COFFEE.slug].hash)

    const kit = new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: COFFEE.brand,
        productName: COFFEE.product,
        sector: COFFEE.sector,
        subProduct: COFFEE.subProduct,
        packagingMode: COFFEE.packagingMode,
        templateId: COFFEE.templateId,
        styleType: COFFEE.styleType,
        colors: COFFEE.colors,
        volume: COFFEE.volume,
        dimensionsMm: COFFEE.dimensionsMm,
      },
      overridePatch: { directorCue: 'luxury-tighten' },
    })
    expect(kit.overrides.studio).toBeFalsy()
    expect(kit.overrides.titleScale).toBe(1.1)
  })

  it('keeps tiny mark slots as vector even when a logo is present', () => {
    const tiny = paintMark('leaf', 10, 10, 1.6, '#c9a45c', 'AB', { logoHref: LOGO, logoScale: 1.4 })
    expect(1.6).toBeLessThan(STUDIO_MIN_LOGO_R)
    expect(tiny).toContain('data-art="brand-mark"')
    expect(tiny).not.toContain('brand-logo')

    const large = paintMark('leaf', 10, 10, 6, '#c9a45c', 'AB', { logoHref: LOGO })
    expect(large).toContain('data-art="brand-logo"')
    expect(large).toContain(LOGO)
  })
})
