import { describe, expect, it } from 'vitest'
import { ringGeometry } from '../data/logo'
import fixture from '../test/fixtures/catalog.json'
import type { Theme } from '../types/catalog'

const themes = fixture.themes as Theme[]

describe('ringGeometry', () => {
  it('places five themes on radii 7, 11, 15, 19, 23 by order, inner to outer', () => {
    const rings = ringGeometry(themes)
    expect(rings.map((r) => r.themeId)).toEqual(['winter', 'mtb', 'gravel', 'road', 'touring'])
    expect(rings.map((r) => r.radius)).toEqual([7, 11, 15, 19, 23])
    expect(rings.map((r) => r.rotation)).toEqual([0, 20, 60, 100, 140])
  })

  it('draws 78% of the circumference as arc', () => {
    const rings = ringGeometry(themes)
    // r=7: circumference 43.98 -> arc 34.31, gap 9.68
    expect(rings[0]!.dashArray).toBe('34.31 9.68')
    // r=23: circumference 144.51 -> arc 112.72, gap 31.79
    expect(rings[4]!.dashArray).toBe('112.72 31.79')
    for (const r of rings) {
      const [arc, gap] = r.dashArray.split(' ').map(Number) as [number, number]
      expect(arc + gap).toBeCloseTo(2 * Math.PI * r.radius, 1)
      expect(arc / (arc + gap)).toBeCloseTo(0.78, 3)
    }
  })

  it('thickens only the selected ring', () => {
    const rings = ringGeometry(themes, 'gravel')
    expect(rings.map((r) => r.strokeWidth)).toEqual([2.6, 2.6, 3.4, 2.6, 2.6])
    expect(rings.filter((r) => r.selected).map((r) => r.themeId)).toEqual(['gravel'])
  })

  it('uses the first n radii for fewer themes', () => {
    const rings = ringGeometry(themes.slice(0, 3).reverse())
    expect(rings.map((r) => r.radius)).toEqual([7, 11, 15])
    expect(rings.map((r) => r.themeId)).toEqual(['winter', 'mtb', 'gravel'])
  })
})
