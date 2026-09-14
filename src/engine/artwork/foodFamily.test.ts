import { describe, expect, it } from 'vitest'
import { foodFamilyFromBlob, foodNutritionRows } from './foodFamily'

describe('foodFamilyFromBlob', () => {
  it('keys the gallery food SKUs', () => {
    expect(foodFamilyFromBlob('zeytinyağı Sızma')).toBe('oil')
    expect(foodFamilyFromBlob('bal Çiçek Balı')).toBe('honey')
    expect(foodFamilyFromBlob('reçel Vişne')).toBe('jam')
    expect(foodFamilyFromBlob('çay Adaçayı')).toBe('tea')
    expect(foodFamilyFromBlob('çikolata Cacao')).toBe('chocolate')
    expect(foodFamilyFromBlob('kurabiye Biscuit')).toBe('biscuit')
    expect(foodFamilyFromBlob('gurme kutu')).toBe('default-food')
  })
})

describe('foodNutritionRows', () => {
  it('keeps oil fat at 100 g and biscuit fat above zero', () => {
    const oil = foodNutritionRows('oil', 'tr', { compact: true, sugarSalt: false })
    const honey = foodNutritionRows('honey', 'tr', { compact: false, sugarSalt: true })
    const choco = foodNutritionRows('chocolate', 'tr', { compact: false, sugarSalt: true })
    const biscuit = foodNutritionRows('biscuit', 'tr', { compact: true, sugarSalt: false })
    expect(oil.find((r) => r.label === 'Yağ')?.value).toBe('100 g')
    expect(honey.find((r) => r.label === 'Enerji')?.value).toContain('334')
    expect(choco.find((r) => r.label === 'Enerji')?.value).toContain('550')
    expect(honey.find((r) => r.label === 'Enerji')?.value).not.toBe(choco.find((r) => r.label === 'Enerji')?.value)
    expect(biscuit.find((r) => r.label === 'Yağ')?.value).toBe('22 g')
  })
})
