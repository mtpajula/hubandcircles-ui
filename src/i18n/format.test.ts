import { describe, expect, it } from 'vitest'
import { formatBytes, formatDate, formatKm, formatM, formatPercent } from './format'

// Intl separates number and unit with a (narrow) no-break space in Finnish; \s covers both.
const plain = (s: string) => s.replace(/\s/g, ' ')

describe('format', () => {
  it('formats distances with the language decimal separator', () => {
    expect(formatKm('fi', 32.44)).toBe('32,4')
    expect(formatKm('en', 32.44)).toBe('32.4')
    expect(formatM('fi', 410.4)).toBe('410')
  })

  it('formats shares as whole percentages', () => {
    expect(plain(formatPercent('fi', 0.66))).toBe('66 %')
    expect(formatPercent('en', 0.664)).toBe('66%')
  })

  it('formats file sizes in kilobytes below a megabyte', () => {
    expect(plain(formatBytes('fi', 12_345))).toBe('12 kt')
    expect(plain(formatBytes('fi', 1_234_567))).toBe('1,2 Mt')
    expect(formatBytes('en', 1_234_567)).toBe('1.2 MB')
  })

  it('formats ISO dates numerically and passes invalid input through', () => {
    expect(formatDate('fi', '2026-08-14')).toBe('14.8.2026')
    expect(formatDate('en', '2026-08-14')).toBe('8/14/2026')
    expect(formatDate('fi', 'unknown')).toBe('unknown')
  })
})
