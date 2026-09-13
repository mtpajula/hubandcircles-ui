import { describe, expect, it } from 'vitest'
import { nearestKm, pointAtKm, trackPoints, type TrackFeature } from './track'

const line: TrackFeature = {
  type: 'Feature',
  properties: { id: 'a', km: [0, 1, 3] },
  geometry: {
    type: 'LineString',
    coordinates: [
      [25.0, 66.0],
      [25.1, 66.0],
      [25.3, 66.2],
    ],
  },
}

const multi: TrackFeature = {
  type: 'Feature',
  properties: {
    id: 'b',
    km: [
      [0, 1],
      [1.5, 2.5],
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

describe('trackPoints', () => {
  it('joins MultiLineString parts and their km lists in order', () => {
    expect(trackPoints(multi)).toEqual({
      coordinates: [
        [25.0, 66.0],
        [25.1, 66.0],
        [25.2, 66.0],
        [25.3, 66.0],
      ],
      km: [0, 1, 1.5, 2.5],
    })
  })
  it('tolerates a missing km list', () => {
    const broken = { ...line, properties: {} } as unknown as TrackFeature
    expect(trackPoints(broken)).toEqual({ coordinates: [], km: [] })
    expect(pointAtKm(broken, 1)).toBeNull()
    expect(nearestKm(broken, 25, 66)).toBeNull()
  })
})

describe('pointAtKm', () => {
  it('returns the coordinate at an exact km', () => {
    expect(pointAtKm(line, 1)).toEqual([25.1, 66.0])
  })
  it('interpolates between neighbours', () => {
    const [lng, lat] = pointAtKm(line, 2)!
    expect(lng).toBeCloseTo(25.2)
    expect(lat).toBeCloseTo(66.1)
  })
  it('clamps to the track ends', () => {
    expect(pointAtKm(line, -1)).toEqual([25.0, 66.0])
    expect(pointAtKm(line, 99)).toEqual([25.3, 66.2])
  })
  it('follows km across MultiLineString parts', () => {
    expect(pointAtKm(multi, 2.5)).toEqual([25.3, 66.0])
    const [lng] = pointAtKm(multi, 2)!
    expect(lng).toBeCloseTo(25.25)
  })
})

describe('nearestKm', () => {
  it('picks the km of the nearest coordinate', () => {
    expect(nearestKm(line, 25.12, 66.01)).toBe(1)
    expect(nearestKm(multi, 25.21, 66.0)).toBe(1.5)
  })
})
