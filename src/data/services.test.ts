import { describe, expect, it, vi } from 'vitest'
import { nearbyOrdered, serviceById, type ServiceCollection } from './services'

const feature = (id: string, category: string): ServiceCollection['features'][number] => ({
  type: 'Feature',
  properties: { id, category: category as 'cafe', source: 'osm' },
  geometry: { type: 'Point', coordinates: [25.7, 66.5] },
})
const collection: ServiceCollection = {
  type: 'FeatureCollection',
  features: [
    feature('osm:node/1', 'cafe'),
    feature('osm:node/2', 'water'),
    feature('osm:node/3', 'lean_to'),
    feature('osm:node/4', 'water'),
    feature('osm:node/5', 'shop'),
  ],
}
const byId = serviceById(collection)

describe('serviceById', () => {
  it('maps every feature by its id', () => {
    expect([...byId.keys()]).toEqual([
      'osm:node/1',
      'osm:node/2',
      'osm:node/3',
      'osm:node/4',
      'osm:node/5',
    ])
    expect(byId.get('osm:node/3')?.properties.category).toBe('lean_to')
  })
})

describe('nearbyOrdered', () => {
  const route = {
    nearby_services: [
      { id: 'osm:node/1', km: 0.5 },
      { id: 'osm:node/2', km: 2.1 },
      { id: 'osm:node/3', km: 4.0 },
      { id: 'osm:node/4', km: 12.7 },
      { id: 'osm:node/5', km: 8.0 },
    ],
  }

  it('puts the priority categories first in theme order, then the rest by km', () => {
    const ids = nearbyOrdered(route, byId, ['water', 'lean_to']).map((e) => e.id)
    expect(ids).toEqual(['osm:node/2', 'osm:node/4', 'osm:node/3', 'osm:node/1', 'osm:node/5'])
  })

  it('keeps km order when the theme lists no priority categories', () => {
    const km = nearbyOrdered(route, byId, []).map((e) => e.km)
    expect(km).toEqual([0.5, 2.1, 4, 8, 12.7])
  })

  it('skips ids missing from the collection and routes without services', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const entries = nearbyOrdered({ nearby_services: [{ id: 'osm:node/9', km: 1 }] }, byId, [])
    expect(entries).toEqual([])
    expect(warn).toHaveBeenCalledOnce()
    expect(nearbyOrdered({}, byId, ['water'])).toEqual([])
    warn.mockRestore()
  })

  it('carries the feature so that the card does not look it up again', () => {
    const [first] = nearbyOrdered(route, byId, ['lean_to'])
    expect(first?.feature.properties.category).toBe('lean_to')
    expect(first?.km).toBe(4)
  })
})
