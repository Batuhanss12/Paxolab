/**
 * A structure card must not offer a size it will not build.
 *
 * Sibling of the defect `structureKeepsDims.test.ts` covers. That one was "picking a structure must
 * not throw away the size the user gave". This is the step before it: what the cards *say* while
 * the customer is still choosing.
 *
 * Found by using the product, 2026-09-17. A brief of 70×45×150 produced three cards reading
 * 100×50×150, 80×40×80 and 70×35×120 — none of them the size just typed. Each card draws its own
 * net from that number, so the customer was comparing three boxes of the wrong *shape*, while the
 * large preview beside them showed the size they had actually asked for. One screen, two answers.
 *
 * The rule: a typed size is an instruction. With nothing typed there is no instruction to honour,
 * and each structure's own characteristic size is more use than one fallback repeated down the row.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { getTemplate } from './catalog'
import { recommendStructures } from './structureRecommend'
import { structureCardDims } from './structureOffer'
import { buildDieline, resolveDimensions } from '../dieline/buildDieline'

function cream(patch: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Verda',
    productName: 'Aloe Mist',
    sector: 'kozmetik',
    subProduct: 'krem',
    packagingMode: 'box',
    colors: 'yeşil · krem',
    dimensionsMm: { L: 0, W: 0, H: 0 },
    ...patch,
  }
}

/** The cards the picker would show, in the order it shows them. */
function cards(brief: DesignBrief) {
  return recommendStructures(brief).candidates.map((row) => {
    const template = getTemplate(row.templateId)!
    return { title: template.title, dims: structureCardDims(brief, template), template }
  })
}

describe('structure cards — what they offer is what gets built', () => {
  it('every card shows the size the customer typed', () => {
    const brief = cream({ dimensionsMm: { L: 70, W: 45, H: 150 } })
    const rows = cards(brief)
    expect(rows.length).toBeGreaterThan(1)
    for (const row of rows) {
      expect(row.dims, `${row.title} offered a different size`).toEqual({ L: 70, W: 45, H: 150 })
    }
  })

  it('a card is honest about the width it fills in', () => {
    // The customer gave length and height only. The engine supplies a depth, and the card must show
    // that same depth rather than the catalogue's — otherwise the number changes after they commit.
    const brief = cream({ dimensionsMm: { L: 70, W: 0, H: 150 } })
    for (const row of cards(brief)) {
      const built = resolveDimensions({ ...brief, templateId: row.template.id })
      expect(row.dims, row.title).toEqual(built)
      expect(row.dims.W, `${row.title} offered a zero depth`).toBeGreaterThan(0)
    }
  })

  it('the net drawn on the card has the proportions the customer asked for', () => {
    // The caption was only half the problem: each card renders its own dieline from these numbers,
    // so a wrong size meant a wrong *shape* on screen.
    const brief = cream({ dimensionsMm: { L: 70, W: 45, H: 150 } })
    for (const row of cards(brief)) {
      const net = buildDieline(row.template.structureId, {
        ...brief,
        templateId: row.template.id,
        dimensionsMm: row.dims,
      })
      expect(net.dimensions, `${row.title} drew a different box`).toEqual({ L: 70, W: 45, H: 150 })
    }
  })

  it('with no size typed, each structure keeps its own character', () => {
    // Nothing to honour here, and three identical fallbacks would tell the customer nothing about
    // how the structures differ.
    const rows = cards(cream({ volume: '50 ml' }))
    const distinct = new Set(rows.map((r) => `${r.dims.L}x${r.dims.W}x${r.dims.H}`))
    expect(distinct.size, 'every card showed the same fallback').toBeGreaterThan(1)
  })

  it('a typed size survives a change of structure', () => {
    // Switching cards is comparing structures, not resizing the box.
    const brief = cream({ dimensionsMm: { L: 70, W: 45, H: 150 } })
    const sizes = cards(brief).map((r) => `${r.dims.L}x${r.dims.W}x${r.dims.H}`)
    expect(new Set(sizes).size, 'the size moved between cards').toBe(1)
  })
})

/**
 * Which structure leads the offer.
 *
 * Found by using the product: on a cream brief of 70×45×150 the shortlist was A60 tuck-top 0.874
 * against "Krem kutusu" 0.871, so the carton that exists *for creams* lost first place by 0.003 —
 * decided by `physicalFit`, the distance between the customer's size and the template's catalogue
 * default. The nets are parametric and the box is built at the customer's size regardless, so that
 * distance was choosing the recommendation while having no effect on the result.
 *
 * Two things are pinned here: the category wins when the proportion allows it, and the proportion
 * still overrules the category when it does not. The second half matters as much as the first — a
 * tuck-end carton is the wrong structure for a flat 95×95×40 box however electronic its contents,
 * and I had assumed otherwise until the scores were read.
 */
describe('structure ranking — category leads, proportion vetoes', () => {
  function offerFor(patch: Partial<DesignBrief>): string[] {
    const brief = cream(patch)
    return recommendStructures(brief).candidates.map((row) => getTemplate(row.templateId)!.title)
  }

  const CATEGORY_LEADS: { label: string; brief: Partial<DesignBrief>; expect: string }[] = [
    {
      label: 'krem, dikey form',
      brief: { sector: 'kozmetik', subProduct: 'krem', dimensionsMm: { L: 70, W: 45, H: 150 } },
      expect: 'Krem kutusu',
    },
    {
      label: 'parfüm, dikey form',
      brief: { sector: 'kozmetik', subProduct: 'parfüm', dimensionsMm: { L: 60, W: 40, H: 110 } },
      expect: 'Parfüm tuck-end',
    },
    {
      label: 'zeytinyağı, dikey form',
      brief: { sector: 'gıda', subProduct: 'zeytinyağı', dimensionsMm: { L: 70, W: 70, H: 180 } },
      expect: 'Yağ / sos kutusu',
    },
    {
      label: 'kulaklık, dikey form',
      brief: { sector: 'elektronik', subProduct: 'kulaklık', dimensionsMm: { L: 60, W: 40, H: 130 } },
      expect: 'Kulaklık kutusu',
    },
    {
      label: 'serum, dikey form',
      brief: { sector: 'kozmetik', subProduct: 'serum', dimensionsMm: { L: 40, W: 40, H: 110 } },
      expect: 'Serum kutusu',
    },
  ]

  for (const row of CATEGORY_LEADS) {
    it(`${row.label}: "${row.expect}" leads`, () => {
      expect(offerFor(row.brief)[0]).toBe(row.expect)
    })
  }

  it('a flat form overrules the category carton', () => {
    // 95×95×40 is not a tuck-end shape. `aspectFit` drops a portrait family to 0.12 there, and no
    // amount of category fit should talk the offer into a squat tuck-end.
    const flat = offerFor({ sector: 'elektronik', subProduct: 'kulaklık', dimensionsMm: { L: 95, W: 95, H: 40 } })
    expect(flat[0]).not.toBe('Kulaklık kutusu')
    // ...but it must still be *offered*, since the customer may know something we do not.
    expect(flat, 'the category carton vanished entirely').toContain('Kulaklık kutusu')
  })

  it('scale still breaks ties, so a pillow box is not offered for a 300 mm cube', () => {
    // The reason `physicalFit` keeps a small weight rather than none.
    const huge = offerFor({ sector: 'kozmetik', subProduct: 'parfüm', dimensionsMm: { L: 300, W: 300, H: 300 } })
    expect(huge[0]).not.toBe('Yastık kutu')
  })
})
