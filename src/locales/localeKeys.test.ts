import { describe, expect, it } from 'vitest'
import en from './en.json'
import fi from './fi.json'

// Recursive key list: { a: { b: 'x' } } -> ['a.b']
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? keyPaths(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )
}

describe('locale files', () => {
  it('fi.json and en.json contain the same keys (P8)', () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(fi).sort())
  })
})
