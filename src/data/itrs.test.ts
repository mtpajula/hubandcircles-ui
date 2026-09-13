import { describe, expect, it } from 'vitest'
import { isItrsLevel, itrsNumber } from './itrs'

describe('itrs', () => {
  it('numbers the levels green 1 to orange 5', () => {
    expect(['green', 'blue', 'red', 'black', 'orange'].map((l) => itrsNumber(l as never))).toEqual([
      1, 2, 3, 4, 5,
    ])
  })

  it('recognises only the five fixed levels', () => {
    expect(isItrsLevel('red')).toBe(true)
    expect(isItrsLevel('purple')).toBe(false)
    expect(isItrsLevel(null)).toBe(false)
  })
})
