import type { Filters, RouteSummary } from '../types/catalog'
import { ITRS_LEVELS, SURFACES } from './identifiers'
import { isItrsLevel, itrsNumber, type ItrsLevel } from './itrs'

/** Filter ids of `theme.presentation.filters` (5.7). */
export type FilterId = Filters[number]

/** Chip values of the range filters (UI-SPEC 3.2). Ascent ranges mirror the length ones. */
export const LENGTH_RANGES = ['under20', '20to40', 'over40'] as const
export const ASCENT_RANGES = ['under200', '200to500', 'over500'] as const
export const DIFFICULTIES = ['easy', 'moderate', 'demanding'] as const
export const WINTER_MAINTENANCE = ['groomed', 'plowed', 'none'] as const

/**
 * Filter state. A missing key is "no filter". `itrs_technical` is the highest allowed level,
 * `separated_share` the lowest allowed share in whole percent. `hideUnknown` lists the filters
 * whose "no data" chip is off: routes without that field are then hidden; by default they stay.
 */
export interface FilterModel {
  length?: string
  ascent?: string
  difficulty?: string
  dominant_surface?: string
  itrs_technical?: ItrsLevel
  separated_share?: number
  winter_maintenance?: string
  hideUnknown: FilterId[]
}

export const EMPTY_FILTERS: FilterModel = { hideUnknown: [] }

const HIDE_UNKNOWN_KEY = 'no_data_off'

function inRange(value: number, range: string, low: number, high: number): boolean {
  if (range.startsWith('under')) return value < low
  if (range.startsWith('over')) return value > high
  return value >= low && value <= high
}

/** The route's value for a filter, `undefined` when the route has no data for it. */
export function filterValue(route: RouteSummary, filter: FilterId): unknown {
  switch (filter) {
    case 'length':
      return route.length_km
    case 'ascent':
      return route.ascent_m ?? undefined
    case 'difficulty':
      return route.difficulty ?? undefined
    case 'dominant_surface':
      return route.dominant_surface ?? undefined
    case 'itrs_technical':
      return route.itrs?.technical ?? undefined
    case 'separated_share':
      return route.separated_share ?? undefined
    case 'winter_maintenance':
      return route.winter_maintenance ?? undefined
  }
}

/** Whether the route passes one filter; `undefined` data passes unless the filter hides unknowns. */
function passes(route: RouteSummary, filter: FilterId, model: FilterModel): boolean {
  const value = filterValue(route, filter)
  if (value === undefined) return !model.hideUnknown.includes(filter)
  const wanted = model[filter]
  if (wanted === undefined) return true
  switch (filter) {
    case 'length':
      return inRange(value as number, String(wanted), 20, 40)
    case 'ascent':
      return inRange(value as number, String(wanted), 200, 500)
    case 'itrs_technical':
      return isItrsLevel(value) && itrsNumber(value) <= itrsNumber(wanted as ItrsLevel)
    case 'separated_share':
      return (value as number) * 100 >= (wanted as number)
    default:
      return value === wanted
  }
}

/** Routes that pass every filter of the theme (UI-SPEC 3.2, 6). Pure. */
export function applyFilters(
  routes: readonly RouteSummary[],
  filters: readonly FilterId[],
  model: FilterModel,
): RouteSummary[] {
  return routes.filter((r) => filters.every((f) => passes(r, f, model)))
}

/** Whether any route of the list lacks the field: then the "no data" chip is shown. */
export function hasUnknown(routes: readonly RouteSummary[], filter: FilterId): boolean {
  return routes.some((r) => filterValue(r, filter) === undefined)
}

/** Chip values for a filter: fixed lists, or for `dominant_surface` the surfaces present. */
export function filterOptions(filter: FilterId, routes: readonly RouteSummary[]): string[] {
  switch (filter) {
    case 'length':
      return [...LENGTH_RANGES]
    case 'ascent':
      return [...ASCENT_RANGES]
    case 'difficulty':
      return [...DIFFICULTIES]
    case 'winter_maintenance':
      return [...WINTER_MAINTENANCE]
    case 'itrs_technical':
      return [...ITRS_LEVELS]
    case 'dominant_surface': {
      const present = new Set(routes.map((r) => r.dominant_surface).filter(Boolean))
      return [...SURFACES, 'mixed'].filter((s) => present.has(s))
    }
    case 'separated_share':
      return []
  }
}

type Query = Record<string, string | null | (string | null)[] | undefined>

function first(value: Query[string]): string | undefined {
  const v = Array.isArray(value) ? value[0] : value
  return v == null ? undefined : v
}

/** The filter state carried in the query string, ignoring values outside the known lists. */
export function parseFilterQuery(query: Query, filters: readonly FilterId[]): FilterModel {
  const model: FilterModel = { hideUnknown: [] }
  for (const f of filters) {
    const raw = first(query[f])
    if (raw === undefined) continue
    if (f === 'separated_share') {
      const n = Number(raw)
      if (Number.isFinite(n) && n > 0) model.separated_share = Math.min(100, Math.round(n))
    } else if (f === 'itrs_technical') {
      if (isItrsLevel(raw)) model.itrs_technical = raw
    } else if (filterOptions(f, []).includes(raw) || f === 'dominant_surface') {
      model[f] = raw
    }
  }
  const off = (first(query[HIDE_UNKNOWN_KEY]) ?? '').split(',')
  model.hideUnknown = filters.filter((f) => off.includes(f))
  return model
}

/** The query string form of the state; defaults are omitted so the plain URL stays clean. */
export function filterQuery(model: FilterModel): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(model)) {
    if (key === 'hideUnknown' || value === undefined) continue
    out[key] = String(value)
  }
  if (model.hideUnknown.length) out[HIDE_UNKNOWN_KEY] = model.hideUnknown.join(',')
  return out
}
