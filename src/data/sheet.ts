import type { LocationQuery, LocationQueryRaw } from 'vue-router'

/** Bottom sheet states of the mobile map page (UI-SPEC 5.0). */
export type SheetState = 'open' | 'peek'

/** Query parameter that carries the sheet state; `open` is the default and leaves no trace. */
export const SHEET_PARAM = 'sheet'

/** `?sheet=peek` peeks; anything else is the default `open` (list page and route page alike). */
export function sheetStateFromQuery(query: Record<string, unknown>): SheetState {
  return query[SHEET_PARAM] === 'peek' ? 'peek' : 'open'
}

/** The query with the sheet state written in, other parameters (filters) untouched. */
export function sheetQuery(query: LocationQuery, state: SheetState): LocationQueryRaw {
  const rest: LocationQueryRaw = { ...query }
  delete rest[SHEET_PARAM]
  return state === 'peek' ? { ...rest, [SHEET_PARAM]: 'peek' } : rest
}

/**
 * State after the handle is released: a drag past `threshold` px goes in its direction (down =
 * peek, up = open, in screen coordinates), anything shorter counts as a tap and toggles.
 */
export function nextState(current: SheetState, deltaY = 0, threshold = 0): SheetState {
  if (deltaY > threshold) return 'peek'
  if (deltaY < -threshold) return 'open'
  return current === 'open' ? 'peek' : 'open'
}

/** Sheet geometry (UI-SPEC 5.0), mirrored in BottomSheet.vue's CSS: top at 45 dvh, at least 200 px of map; peek shows 64 px. */
export const SHEET_TOP_SHARE = 0.45
export const SHEET_MIN_MAP_HEIGHT = 200
export const SHEET_PEEK_HEIGHT = 64

/** Pixels of the viewport the sheet covers in `state`, for the map's bottom padding. */
export function sheetInset(state: SheetState, viewportHeight: number): number {
  if (state === 'peek') return SHEET_PEEK_HEIGHT
  return Math.max(
    0,
    viewportHeight - Math.max(viewportHeight * SHEET_TOP_SHARE, SHEET_MIN_MAP_HEIGHT),
  )
}
