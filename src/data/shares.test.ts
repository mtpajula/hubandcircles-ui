import { describe, expect, it } from 'vitest'
import { orderedShares } from './shares'

describe('orderedShares', () => {
  it('sorts by share descending with unknown last', () => {
    expect(
      orderedShares({ unknown: 0.5, asphalt: 0.22, gravel: 0.66, trail: 0.08 }).map((s) => s.id),
    ).toEqual(['gravel', 'asphalt', 'trail', 'unknown'])
  })

  it('drops zero shares', () => {
    expect(orderedShares({ gravel: 1, snow: 0 })).toEqual([{ id: 'gravel', share: 1 }])
  })
})
