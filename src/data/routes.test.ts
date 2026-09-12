import { describe, expect, it } from 'vitest'
import catalog from '../test/fixtures/catalog.json'
import { countRoutesByTheme, filterRoutesByTheme } from './routes'

describe('filterRoutesByTheme', () => {
  it('returns the routes of the theme', () => {
    expect(filterRoutesByTheme(catalog.routes, 'gravel').map((r) => r.id)).toEqual(['test-loop'])
  })
  it('returns an empty list when the theme has no routes', () => {
    expect(filterRoutesByTheme(catalog.routes, 'road')).toEqual([])
  })
  it('keeps the order and takes only matching routes', () => {
    const routes = [
      { id: 'a', themes: ['gravel', 'touring'] },
      { id: 'b', themes: ['touring'] },
      { id: 'c', themes: ['gravel'] },
    ]
    expect(filterRoutesByTheme(routes, 'gravel').map((r) => r.id)).toEqual(['a', 'c'])
  })
})

describe('countRoutesByTheme', () => {
  it('counts every theme a route belongs to', () => {
    const routes = [
      { id: 'a', themes: ['gravel', 'touring'] },
      { id: 'b', themes: ['touring'] },
      { id: 'c', themes: ['gravel'] },
    ]
    expect(countRoutesByTheme(routes)).toEqual({ gravel: 2, touring: 2 })
  })
  it('has no entry for a theme without routes', () => {
    expect(countRoutesByTheme(catalog.routes).road).toBeUndefined()
  })
})
