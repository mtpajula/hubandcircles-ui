import { describe, expect, it } from 'vitest'
import { LAYER_SLOTS, slotAnchor } from './slots'

describe('layer slots', () => {
  it('are in chapter 8 order from bottom to top', () => {
    expect(LAYER_SLOTS).toEqual(['base', 'raster', 'area', 'routes', 'points'])
  })
  it('anchor ids are unique per slot', () => {
    expect(new Set(LAYER_SLOTS.map(slotAnchor)).size).toBe(LAYER_SLOTS.length)
  })
})
