import { describe, expect, it } from 'vitest'
import { routeEndpoints, type OverviewCollection } from './overview'

const overview: OverviewCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'a', themes: ['gravel'] },
      geometry: {
        type: 'LineString',
        coordinates: [
          [25.7, 66.5],
          [25.71, 66.51],
          [25.72, 66.52],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { id: 'empty', themes: [] },
      geometry: { type: 'LineString', coordinates: [] },
    },
    {
      type: 'Feature',
      properties: { id: 'multi', themes: ['mtb', 'gravel'] },
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [
            [25.8, 66.6],
            [25.81, 66.61],
          ],
          [
            [25.82, 66.62],
            [25.83, 66.63],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { id: 'multi-empty', themes: ['mtb'] },
      geometry: { type: 'MultiLineString', coordinates: [] },
    },
  ],
}

describe('routeEndpoints', () => {
  const points = routeEndpoints(overview)

  it('picks the first and last coordinate of each line and skips empty geometries', () => {
    expect(points.features.map((f) => [f.properties.id, f.properties.kind])).toEqual([
      ['a', 'start'],
      ['a', 'end'],
      ['multi', 'start'],
      ['multi', 'end'],
    ])
    expect(points.features[0]!.geometry.coordinates).toEqual([25.7, 66.5])
    expect(points.features[1]!.geometry.coordinates).toEqual([25.72, 66.52])
  })

  it('uses the first part start and the last part end of a MultiLineString', () => {
    expect(points.features[2]!.geometry.coordinates).toEqual([25.8, 66.6])
    expect(points.features[3]!.geometry.coordinates).toEqual([25.83, 66.63])
  })

  it('copies the themes of the line so the theme filter applies to endpoints', () => {
    expect(points.features[0]!.properties.themes).toEqual(['gravel'])
    expect(points.features[2]!.properties.themes).toEqual(['mtb', 'gravel'])
  })

  it('skips a MultiLineString whose parts are all empty', () => {
    const empty = routeEndpoints({
      features: [
        {
          type: 'Feature',
          properties: { id: 'x', themes: [] },
          geometry: { type: 'MultiLineString', coordinates: [[], []] },
        },
      ],
    })
    expect(empty.features).toEqual([])
  })
})
