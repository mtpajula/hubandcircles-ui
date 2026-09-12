import { describe, expect, it } from 'vitest'
import { profileArea, profilePath } from './band'

describe('profilePath', () => {
  it('scales three points to the box with the lowest point at the bottom', () => {
    expect(
      profilePath(
        [
          [0, 100],
          [5, 150],
          [10, 125],
        ],
        100,
        84,
      ),
    ).toBe('M0 84L50 0L100 42')
  })
  it('draws a flat profile through the middle', () => {
    expect(
      profilePath(
        [
          [0, 10],
          [2, 10],
        ],
        100,
        84,
      ),
    ).toBe('M0 42L100 42')
  })
  it('returns an empty path for an empty profile', () => {
    expect(profilePath([], 100, 84)).toBe('')
    expect(profileArea([], 100, 84)).toBe('')
  })
  it('closes the area along the bottom edge', () => {
    expect(
      profileArea(
        [
          [0, 0],
          [1, 10],
        ],
        100,
        84,
      ),
    ).toBe('M0 84L100 0L100 84L0 84Z')
  })
})
