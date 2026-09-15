import { describe, expect, it } from 'vitest'
import { OFF_ROUTE_M, distanceM, isOffRoute, nextService, progress } from './ride'
import type { TrackFeature } from './track'

// Three points along a parallel at 66° N: roughly 4.5 km per 0.1° of longitude.
const track: TrackFeature = {
  type: 'Feature',
  properties: {
    km: [
      [0, 4.5],
      [9, 13.5],
    ],
  },
  geometry: {
    type: 'MultiLineString',
    coordinates: [
      [
        [25.0, 66.0],
        [25.1, 66.0],
      ],
      [
        [25.2, 66.0],
        [25.3, 66.0],
      ],
    ],
  },
}

describe('distanceM', () => {
  it('measures 1° of latitude as about 111 km', () => {
    expect(distanceM([25, 66], [25, 67])).toBeCloseTo(111_195, -3)
  })
})

describe('progress (UI-SPEC 5.2)', () => {
  it('snaps to the nearest coordinate across parts and reads its km', () => {
    const p = progress(track, { lng: 25.21, lat: 66.0005 })
    expect(p).toMatchObject({ index: 2, km: 9 })
    expect(p!.distanceM).toBeGreaterThan(0)
    expect(p!.distanceM).toBeLessThan(500)
  })

  it('is null for an empty track', () => {
    const empty: TrackFeature = {
      type: 'Feature',
      properties: { km: [] },
      geometry: { type: 'LineString', coordinates: [] },
    }
    expect(progress(empty, { lng: 25, lat: 66 })).toBeNull()
  })
})

describe('isOffRoute', () => {
  it('is on route at the threshold and off beyond it', () => {
    expect(isOffRoute({ km: 1, index: 0, distanceM: OFF_ROUTE_M })).toBe(false)
    expect(isOffRoute({ km: 1, index: 0, distanceM: OFF_ROUTE_M + 1 })).toBe(true)
  })

  it('flags a rider a few km from the track', () => {
    const p = progress(track, { lng: 25.15, lat: 66.05 })!
    expect(isOffRoute(p)).toBe(true)
  })
})

describe('nextService', () => {
  const nearby = [
    { id: 'c', km: 12.7 },
    { id: 'a', km: 0.5 },
    { id: 'b', km: 5.3 },
  ]

  it('returns the first service at or ahead of the rider regardless of list order', () => {
    expect(nextService(nearby, 4)).toEqual({ id: 'b', km: 5.3 })
    expect(nextService(nearby, 5.3)).toEqual({ id: 'b', km: 5.3 })
    expect(nextService(nearby, 0)).toEqual({ id: 'a', km: 0.5 })
  })

  it('is null past the last service or without services', () => {
    expect(nextService(nearby, 13)).toBeNull()
    expect(nextService(undefined, 0)).toBeNull()
    expect(nextService([], 0)).toBeNull()
  })
})
