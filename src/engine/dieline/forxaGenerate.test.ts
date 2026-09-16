import { describe, expect, it } from 'vitest'
import { emptyBrief } from '../fields'
import { buildDieline } from './buildDieline'
import { briefToEngineParams, generateForxaModel } from './forxaGenerate'

describe('Forxa brief → engine params', () => {
  it('maps pillow L×W×H onto length / panel height / flap depth (not the 40 mm default)', () => {
    const dims = { L: 100, W: 40, H: 80 }
    expect(briefToEngineParams('pillow-box', dims)).toEqual({
      length: 100,
      width: 80,
      height: 80,
      sideLength: 100,
      depth: 40,
    })
    const model = generateForxaModel('pillow-box', dims)
    const front = model.panels.find((p) => p.id === 'front')
    expect(front?.w).toBeCloseTo(100, 0)
    expect(front?.h).toBeCloseTo(80, 0)
    expect(model.dimensions).toEqual(dims)
    expect(model.cut.length).toBeGreaterThan(0)
    expect(model.crease.length).toBeGreaterThan(0)
    const ys = model.cut.flatMap((ring) => ring.map((p) => p.y))
    const flap = Math.max(...ys) - Math.min(...ys) - 80
    expect(flap).toBeCloseTo(80, 0)
  })

  it('keeps sleeve / mailer on length=L width=W height=H', () => {
    expect(briefToEngineParams('sleeve', { L: 90, W: 30, H: 150 })).toMatchObject({
      length: 90,
      width: 30,
      height: 150,
    })
    const sleeve = generateForxaModel('sleeve', { L: 90, W: 30, H: 150 })
    const sleeveFront = sleeve.panels.find((p) => p.id === 'front')
    expect(sleeveFront?.w).toBeCloseTo(90, 0)
    expect(sleeveFront?.h).toBeCloseTo(150, 0)

    const mailer = generateForxaModel('mailer-box', { L: 180, W: 120, H: 60 })
    const mailerFront = mailer.panels.find((p) => p.id === 'front')
    expect(mailerFront?.w).toBeCloseTo(180, 0)
    expect(mailerFront?.h).toBeCloseTo(60, 0)
  })

  it('native tuck front stays L×H with W as side', () => {
    const model = buildDieline('tuck-end-box', {
      ...emptyBrief(),
      packagingMode: 'box',
      dimensionsMm: { L: 70, W: 35, H: 140 },
    })
    const front = model.panels.find((p) => p.id === 'front')
    const left = model.panels.find((p) => p.id === 'left')
    expect(front?.w).toBeCloseTo(70, 0)
    expect(front?.h).toBeCloseTo(140, 0)
    expect(left?.w).toBeCloseTo(35, 0)
    expect(left?.h).toBeCloseTo(140, 0)
  })
})
