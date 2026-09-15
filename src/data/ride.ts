import type { NearbyService } from '../types/route'
import { trackPoints, type TrackFeature } from './track'

/**
 * Ride mode position handling (ARKKITEHTUURI.md 7.12, UI-SPEC 5.2). The rider's position is
 * snapped to the nearest track coordinate and the distance ridden is that coordinate's entry in
 * `track.properties.km` (P3: a lookup, not route computation). Haversine is used only to find
 * that coordinate and to tell an off-route rider from one on the track.
 */

/** Beyond this distance from the nearest track coordinate the rider is shown as off route. */
export const OFF_ROUTE_M = 300

export type Position = { lng: number; lat: number }
export type Progress = {
  /** Distance ridden: `km` of the nearest track coordinate. */
  km: number
  /** Index of that coordinate in track order (parts joined). */
  index: number
  /** Great-circle distance from the position to that coordinate, metres. */
  distanceM: number
}

const EARTH_RADIUS_M = 6_371_000
const rad = (deg: number) => (deg * Math.PI) / 180

/** Great-circle distance between two [lng, lat] points in metres (haversine). */
export function distanceM(a: readonly number[], b: readonly number[]): number {
  const dLat = rad(b[1]! - a[1]!)
  const dLng = rad(b[0]! - a[0]!)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1]!)) * Math.cos(rad(b[1]!)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/** The nearest track coordinate to `position` and its km; `null` for an empty track. */
export function progress(track: TrackFeature, position: Position): Progress | null {
  const { coordinates, km } = trackPoints(track)
  if (coordinates.length === 0) return null
  const here = [position.lng, position.lat]
  let index = 0
  let best = Infinity
  coordinates.forEach((c, i) => {
    const d = distanceM(here, c)
    if (d < best) {
      best = d
      index = i
    }
  })
  return { km: km[index]!, index, distanceM: best }
}

export function isOffRoute(p: Progress): boolean {
  return p.distanceM > OFF_ROUTE_M
}

/** The first nearby service at or ahead of `km`; `null` when none is left on the route. */
export function nextService(
  nearby: readonly NearbyService[] | undefined,
  km: number,
): NearbyService | null {
  let next: NearbyService | null = null
  for (const s of nearby ?? []) if (s.km >= km && (next === null || s.km < next.km)) next = s
  return next
}
