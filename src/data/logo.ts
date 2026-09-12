import type { Theme } from '../types/catalog'

/** Ring radii from inner to outer in a -32..32 viewBox (UI-SPEC chapter 6, HubLogo). */
export const RING_RADII = [7, 11, 15, 19, 23] as const
/** Rotation offsets in degrees, inner to outer, so that the gaps form a spiral. */
export const RING_ROTATIONS = [0, 20, 60, 100, 140] as const
export const ARC_SHARE = 0.78
export const RING_STROKE = 2.6
export const RING_STROKE_SELECTED = 3.4
export const OUTER_RADIUS = 27
export const HUB_RADIUS = 3.4

export interface Ring {
  themeId: string
  /** 1-based position from the inside; also picks the dark-variant tint token. */
  index: number
  radius: number
  strokeWidth: number
  /** `stroke-dasharray` "arc gap" in viewBox units. */
  dashArray: string
  /** `rotate(deg)` transform. */
  rotation: number
  selected: boolean
  primary: string
}

/**
 * Geometry of the theme rings: one ring per theme in `order`, innermost first. Themes beyond the
 * fifth are dropped (the logo has five radii) with a warning; the data model does not limit the
 * count, the drawing does.
 */
export function ringGeometry(themes: readonly Theme[], selected?: string | null): Ring[] {
  const ordered = [...themes].sort((a, b) => a.order - b.order)
  if (ordered.length > RING_RADII.length) {
    console.warn(`HubLogo draws at most ${RING_RADII.length} themes; ${ordered.length} given`)
  }
  return ordered.slice(0, RING_RADII.length).map((theme, i) => {
    const radius = RING_RADII[i]!
    const circumference = 2 * Math.PI * radius
    const arc = circumference * ARC_SHARE
    const isSelected = theme.id === selected
    return {
      themeId: theme.id,
      index: i + 1,
      radius,
      strokeWidth: isSelected ? RING_STROKE_SELECTED : RING_STROKE,
      dashArray: `${round(arc)} ${round(circumference - arc)}`,
      rotation: RING_ROTATIONS[i]!,
      selected: isSelected,
      primary: theme.colors.primary,
    }
  })
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
