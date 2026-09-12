import { describe, expect, it } from 'vitest'
import { dataPath } from './paths'

describe('dataPath', () => {
  it('joins onto the given root', () => {
    expect(dataPath('routes/x/route.json', './data/')).toBe('./data/routes/x/route.json')
  })
  it('does not produce double slashes', () => {
    expect(dataPath('/routes/x/route.json', './data/')).toBe('./data/routes/x/route.json')
  })
  it('works when the root has no trailing slash', () => {
    expect(dataPath('catalog.json', 'https://example.org/data')).toBe(
      'https://example.org/data/catalog.json',
    )
  })
  it('defaults to DATA_URL', () => {
    expect(dataPath('catalog.json')).toBe('./data/catalog.json')
  })
})
