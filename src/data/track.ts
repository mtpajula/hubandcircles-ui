import type { Feature, LineString, MultiLineString } from 'geojson'

/**
 * `track.geojson` (5.3, 7.11): `properties.km` is the cumulative km per coordinate. LineString:
 * one list aligned with `coordinates`; MultiLineString: one list per part, continuing across parts.
 */
export type TrackProperties = { id?: string; km: number[] | number[][] }
export type TrackFeature = Feature<LineString | MultiLineString, TrackProperties>

export async function loadTrack(url: string): Promise<TrackFeature> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as TrackFeature
}

/** Coordinates and their km in track order, parts joined. Mismatched lengths are cut to the shorter. */
export function trackPoints(feature: TrackFeature): { coordinates: number[][]; km: number[] } {
  const geometry = feature.geometry
  const parts = geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates]
  const rawKm = feature.properties?.km ?? []
  const kmParts: number[][] = Array.isArray(rawKm[0]) ? (rawKm as number[][]) : [rawKm as number[]]
  const coordinates: number[][] = []
  const km: number[] = []
  parts.forEach((part, i) => {
    const partKm = kmParts[i] ?? []
    const n = Math.min(part.length, partKm.length)
    for (let j = 0; j < n; j++) {
      coordinates.push(part[j]!)
      km.push(partKm[j]!)
    }
  })
  return { coordinates, km }
}

/** Index of the first km at or beyond `target` (binary search); `km.length` when past the end. */
function lowerBound(km: readonly number[], target: number): number {
  let lo = 0
  let hi = km.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (km[mid]! < target) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * The [lng, lat] at `targetKm`, interpolated linearly between the two neighbouring coordinates.
 * Clamped to the track ends; `null` when the track has no points.
 */
export function pointAtKm(feature: TrackFeature, targetKm: number): [number, number] | null {
  const { coordinates, km } = trackPoints(feature)
  if (coordinates.length === 0) return null
  const i = lowerBound(km, targetKm)
  if (i === 0) return pair(coordinates[0]!)
  if (i >= km.length) return pair(coordinates[coordinates.length - 1]!)
  const a = coordinates[i - 1]!
  const b = coordinates[i]!
  const span = km[i]! - km[i - 1]!
  const f = span > 0 ? (targetKm - km[i - 1]!) / span : 0
  return [a[0]! + (b[0]! - a[0]!) * f, a[1]! + (b[1]! - a[1]!) * f]
}

/** The km of the track coordinate nearest to a map position; `null` for an empty track. */
export function nearestKm(feature: TrackFeature, lng: number, lat: number): number | null {
  const { coordinates, km } = trackPoints(feature)
  if (coordinates.length === 0) return null
  const scale = Math.cos((lat * Math.PI) / 180)
  let best = 0
  let bestDistance = Infinity
  coordinates.forEach(([x, y], i) => {
    const dx = (x! - lng) * scale
    const dy = y! - lat
    const d = dx * dx + dy * dy
    if (d < bestDistance) {
      bestDistance = d
      best = i
    }
  })
  return km[best]!
}

function pair(c: number[]): [number, number] {
  return [c[0]!, c[1]!]
}
