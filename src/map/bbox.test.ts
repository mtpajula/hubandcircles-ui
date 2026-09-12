import { describe, expect, it } from 'vitest'
import { unionBboxes } from './bbox'

describe('unionBboxes', () => {
  it('empty -> null', () => {
    expect(unionBboxes([])).toBeNull()
  })
  it('single -> same', () => {
    expect(unionBboxes([[1, 2, 3, 4]])).toEqual([1, 2, 3, 4])
  })
  it('union', () => {
    expect(
      unionBboxes([
        [25.7, 66.4, 25.9, 66.5],
        [25.5, 66.45, 25.8, 66.6],
      ]),
    ).toEqual([25.5, 66.4, 25.9, 66.6])
  })
})
