import { describe, expect, it } from 'vitest'
import { mixWithWhite, parseHex, withAlpha } from './color'

describe('mixWithWhite', () => {
  it('mixes gravel 50% towards white', () => {
    // (154+255)/2 = 204.5 -> CD, (100+255)/2 = 177.5 -> B2, (20+255)/2 = 137.5 -> 8A
    expect(mixWithWhite('#9A6414', 0.5)).toBe('#CDB28A')
  })
  it('ratio 0 keeps the color and ratio 1 gives white', () => {
    expect(mixWithWhite('#2F5F96', 0)).toBe('#2F5F96')
    expect(mixWithWhite('#2F5F96', 1)).toBe('#FFFFFF')
  })
  it('accepts short hex and leaves other values unchanged', () => {
    expect(mixWithWhite('#fff', 0.5)).toBe('#FFFFFF')
    expect(mixWithWhite('rgb(1,2,3)', 0.5)).toBe('rgb(1,2,3)')
  })
})

describe('withAlpha', () => {
  it('appends 10% alpha as in the spec example', () => {
    expect(withAlpha('#9A6414', 0.1)).toBe('#9A64141A')
  })
})

describe('parseHex', () => {
  it('parses channels', () => {
    expect(parseHex('#1C2B3A')).toEqual([28, 43, 58])
    expect(parseHex('nope')).toBeNull()
  })
})
