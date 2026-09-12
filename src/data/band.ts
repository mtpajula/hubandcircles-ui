import type { Profile } from '../types/route'

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
