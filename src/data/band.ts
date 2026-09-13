import type { Band } from '../types/catalog'
import type { Profile, PublishedSegment } from '../types/route'

/**
 * SVG path of an elevation profile (UI-SPEC 4.2 item 5) scaled to `width` × `height`.
 * X follows the km of each point (0 … last km), Y the elevation (lowest at the bottom).
 * A flat profile is drawn as a horizontal line through the middle. Pure: drawn from data only.
 */
export function profilePath(profile: Profile, width: number, height: number): string {
  if (profile.length === 0) return ''
  const maxKm = profile[profile.length - 1]![0] || 1
  const elevations = profile.map(([, m]) => m)
  const min = Math.min(...elevations)
  const span = Math.max(...elevations) - min
  const points = profile.map(([km, m]) => {
    const x = (km / maxKm) * width
    const y = span === 0 ? height / 2 : height - ((m - min) / span) * height
    return `${round(x)} ${round(y)}`
  })
  return `M${points.join('L')}`
}

/** Closed area under the profile line, for the tinted fill. */
export function profileArea(profile: Profile, width: number, height: number): string {
  const line = profilePath(profile, width, height)
  return line ? `${line}L${width} ${height}L0 ${height}Z` : ''
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

// ---- lanes (UI-SPEC 4.2 item 5) ---------------------------------------------------------------

/** A band lane other than elevation: a segment attribute drawn on the km axis. */
export type LaneId = Exclude<Band[number], 'elevation'>

/** A lane's segments as flex children: `flex` is the km span, `value` the 5.7 id or `null` (gap). */
export interface LaneSegment {
  startKm: number
  endKm: number
  flex: number
  value: string | null
}

const EPSILON = 0.05

/**
 * Lane geometry from the normalised segments (5.3): one child per segment sized by its km span,
 * with `null` for gaps. Uncovered km at the start or the end (within the build's tolerance
 * excluded) become `null` fillers so the lane always spans 0 … `lengthKm`.
 */
export function laneSegments(
  segments: readonly PublishedSegment[],
  lengthKm: number,
  lane: LaneId,
): LaneSegment[] {
  const out: LaneSegment[] = []
  let cursor = 0
  const push = (startKm: number, endKm: number, value: string | null) => {
    if (endKm - startKm <= 0) return
    out.push({ startKm, endKm, flex: round(endKm - startKm), value })
  }
  for (const s of segments) {
    if (s.start_km > cursor + EPSILON) push(cursor, s.start_km, null)
    push(Math.max(s.start_km, cursor), s.end_km, s[lane] ?? null)
    cursor = Math.max(cursor, s.end_km)
  }
  if (lengthKm > cursor + EPSILON) push(cursor, lengthKm, null)
  return out
}

/** Whether any segment carries a value for the lane; a lane without data is hidden (P11). */
export function laneHasData(segments: readonly PublishedSegment[], lane: LaneId): boolean {
  return segments.some((s) => s[lane] != null)
}

/** The segment containing `km` (start inclusive, end inclusive for the last segment). */
export function segmentAt(
  segments: readonly PublishedSegment[],
  km: number,
): PublishedSegment | null {
  const last = segments[segments.length - 1]
  if (last && km === last.end_km) return last
  return segments.find((s) => km >= s.start_km && km < s.end_km) ?? null
}

/** Elevation at `km`, interpolated linearly between the profile points; clamped to the ends. */
export function elevationAt(profile: Profile, km: number): number | null {
  if (profile.length === 0) return null
  const first = profile[0]!
  const last = profile[profile.length - 1]!
  if (km <= first[0]) return first[1]
  if (km >= last[0]) return last[1]
  for (let i = 1; i < profile.length; i++) {
    const [k1, e1] = profile[i]!
    if (km <= k1) {
      const [k0, e0] = profile[i - 1]!
      const f = k1 > k0 ? (km - k0) / (k1 - k0) : 0
      return e0 + (e1 - e0) * f
    }
  }
  return last[1]
}

/**
 * The lanes of `theme.presentation.band` that have data on this route, in theme order (P11):
 * `elevation` needs two profile points, the others at least one segment value. An empty result
 * means no band at all.
 */
export function visibleLanes(
  lanes: readonly Band[number][],
  profile: Profile,
  segments: readonly PublishedSegment[],
): Band {
  return lanes.filter((lane) =>
    lane === 'elevation' ? profile.length > 1 : laneHasData(segments, lane),
  )
}

/** CSS fill of a lane value (UI-SPEC 1.3–1.4); `null` is always the unknown hatch. */
export function laneFill(lane: LaneId, value: string | null): string {
  if (value === null) return 'var(--surface-unknown)'
  return `var(--${lane === 'itrs_technical' ? 'itrs' : lane}-${value})`
}
