import { describe, expect, it } from 'vitest'
import type { Profile, PublishedSegment } from '../types/route'
import {
  elevationAt,
  laneFill,
  laneHasData,
  laneSegments,
  profileArea,
  profilePath,
  segmentAt,
  visibleLanes,
} from './band'

describe('profilePath', () => {
  it('scales three points to the box with the lowest point at the bottom', () => {
    expect(
      profilePath(
        [
          [0, 100],
          [5, 150],
          [10, 125],
        ],
        100,
        84,
      ),
    ).toBe('M0 84L50 0L100 42')
  })
  it('draws a flat profile through the middle', () => {
    expect(
      profilePath(
        [
          [0, 10],
          [2, 10],
        ],
        100,
        84,
      ),
    ).toBe('M0 42L100 42')
  })
  it('returns an empty path for an empty profile', () => {
    expect(profilePath([], 100, 84)).toBe('')
    expect(profileArea([], 100, 84)).toBe('')
  })
  it('closes the area along the bottom edge', () => {
    expect(
      profileArea(
        [
          [0, 0],
          [1, 10],
        ],
        100,
        84,
      ),
    ).toBe('M0 84L100 0L100 84L0 84Z')
  })
})

const segments: PublishedSegment[] = [
  { start_km: 0, end_km: 0.4, surface: 'asphalt', traffic: 'separated' },
  { start_km: 0.4, end_km: 0.9, surface: 'gravel', traffic: 'quiet', itrs_technical: 'green' },
  { start_km: 0.9, end_km: 1.0 },
  { start_km: 1.0, end_km: 1.3, surface: 'trail', itrs_technical: 'red' },
]

describe('laneSegments', () => {
  it('sizes each segment by its km span and keeps gaps as null', () => {
    expect(laneSegments(segments, 1.3, 'surface')).toEqual([
      { startKm: 0, endKm: 0.4, flex: 0.4, value: 'asphalt' },
      { startKm: 0.4, endKm: 0.9, flex: 0.5, value: 'gravel' },
      { startKm: 0.9, endKm: 1.0, flex: 0.1, value: null },
      { startKm: 1.0, endKm: 1.3, flex: 0.3, value: 'trail' },
    ])
    expect(laneSegments(segments, 1.3, 'itrs_technical').map((s) => s.value)).toEqual([
      null,
      'green',
      null,
      'red',
    ])
  })
  it('fills uncovered km at both ends with null', () => {
    const partial: PublishedSegment[] = [{ start_km: 2, end_km: 4, surface: 'gravel' }]
    expect(laneSegments(partial, 10, 'surface')).toEqual([
      { startKm: 0, endKm: 2, flex: 2, value: null },
      { startKm: 2, endKm: 4, flex: 2, value: 'gravel' },
      { startKm: 4, endKm: 10, flex: 6, value: null },
    ])
  })
  it('ignores the build tolerance at the end and empty spans', () => {
    const almost: PublishedSegment[] = [{ start_km: 0, end_km: 1.28, traffic: 'busy' }]
    expect(laneSegments(almost, 1.3, 'traffic')).toHaveLength(1)
    expect(laneSegments([], 0, 'traffic')).toEqual([])
  })
})

describe('laneHasData / segmentAt', () => {
  it('reports lanes without any value', () => {
    expect(laneHasData(segments, 'traffic')).toBe(true)
    expect(laneHasData([{ start_km: 0, end_km: 1 }], 'traffic')).toBe(false)
  })
  it('finds the segment containing a km, end inclusive for the last one', () => {
    expect(segmentAt(segments, 0.4)?.surface).toBe('gravel')
    expect(segmentAt(segments, 0.95)?.surface).toBeUndefined()
    expect(segmentAt(segments, 1.3)?.surface).toBe('trail')
    expect(segmentAt(segments, 5)).toBeNull()
  })
})

describe('elevationAt', () => {
  const profile: Profile = [
    [0, 100],
    [1, 200],
    [3, 100],
  ]
  it('interpolates and clamps', () => {
    expect(elevationAt(profile, 0.5)).toBe(150)
    expect(elevationAt(profile, 2)).toBe(150)
    expect(elevationAt(profile, -1)).toBe(100)
    expect(elevationAt(profile, 9)).toBe(100)
    expect(elevationAt([], 1)).toBeNull()
  })
})

describe('visibleLanes / laneFill', () => {
  it('keeps only lanes with data, in theme order', () => {
    const profile: Profile = [
      [0, 1],
      [1, 2],
    ]
    expect(visibleLanes(['elevation', 'itrs_technical', 'surface'], profile, segments)).toEqual([
      'elevation',
      'itrs_technical',
      'surface',
    ])
    expect(visibleLanes(['elevation', 'traffic'], [[0, 1]], [{ start_km: 0, end_km: 1 }])).toEqual(
      [],
    )
  })
  it('maps values to the palette tokens and null to the unknown hatch', () => {
    expect(laneFill('itrs_technical', 'red')).toBe('var(--itrs-red)')
    expect(laneFill('surface', 'trail')).toBe('var(--surface-trail)')
    expect(laneFill('traffic', null)).toBe('var(--surface-unknown)')
  })
})
