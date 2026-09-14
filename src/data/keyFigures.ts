import type { KeyFigures, RouteSummary } from '../types/catalog'
import type { PublishedRoute } from '../types/route'
import type { ItrsLevel } from './itrs'

export type KeyFigureId = KeyFigures[number]

/** The fields both the catalog summary and route.json carry for key figures (5.6). */
export type KeyFigureSource = Pick<
  PublishedRoute | RouteSummary,
  | 'length_km'
  | 'ascent_m'
  | 'difficulty'
  | 'itrs'
  | 'dominant_surface'
  | 'surface_shares'
  | 'separated_share'
  | 'winter_maintenance'
> &
  /** Only route.json carries the gap; the list card (catalog summary) never shows it. */
  Partial<Pick<PublishedRoute, 'longest_service_gap'>>

/** A key figure resolved from the route; the component only formats and translates. */
export type KeyFigure =
  | { id: KeyFigureId; kind: 'km'; value: number }
  | { id: KeyFigureId; kind: 'm'; value: number }
  | { id: KeyFigureId; kind: 'number'; value: number }
  | { id: KeyFigureId; kind: 'percent'; value: number }
  /** Translated as `<group>.<value>` (5.7 identifier). */
  | { id: KeyFigureId; kind: 'term'; group: string; value: string }
  /** ITRS technical or endurance; `null` renders "Not rated" (P11 exception). */
  | { id: KeyFigureId; kind: 'itrs'; level: ItrsLevel | null }
  | { id: KeyFigureId; kind: 'shares'; shares: Record<string, number> }

function resolve(id: KeyFigureId, route: KeyFigureSource, themeId?: string): KeyFigure | null {
  const itrs = route.itrs ?? {}
  switch (id) {
    case 'length':
      return { id, kind: 'km', value: route.length_km }
    case 'ascent':
      return route.ascent_m == null ? null : { id, kind: 'm', value: route.ascent_m }
    case 'difficulty':
      return route.difficulty
        ? { id, kind: 'term', group: 'difficulty', value: route.difficulty }
        : null
    case 'itrs_technical':
      return { id, kind: 'itrs', level: itrs.technical ?? null }
    case 'itrs_endurance':
      return { id, kind: 'itrs', level: itrs.endurance ?? null }
    case 'itrs_exposure':
      return itrs.exposure == null ? null : { id, kind: 'number', value: itrs.exposure }
    case 'itrs_wilderness':
      return itrs.wilderness == null ? null : { id, kind: 'number', value: itrs.wilderness }
    case 'dominant_surface':
      return route.dominant_surface
        ? { id, kind: 'term', group: 'surface', value: route.dominant_surface }
        : null
    case 'surface_shares':
      return route.surface_shares && Object.keys(route.surface_shares).length > 0
        ? { id, kind: 'shares', shares: route.surface_shares }
        : null
    case 'separated_share':
      return route.separated_share == null
        ? null
        : { id, kind: 'percent', value: route.separated_share }
    case 'winter_maintenance':
      return route.winter_maintenance
        ? { id, kind: 'term', group: 'winterMaintenance', value: route.winter_maintenance }
        : null
    case 'longest_service_gap': {
      // Theme-specific (5.3): the gap of the theme's own service categories.
      const gap = themeId ? route.longest_service_gap?.[themeId] : undefined
      return gap ? { id, kind: 'km', value: gap.km } : null
    }
  }
}

/**
 * Key figures of a route in the theme's order (UI-SPEC 4.2 item 3). Missing data hides the tile
 * (P11) except ITRS technical/endurance, which show "Not rated". `limit` counts shown tiles;
 * `themeId` picks the theme's `longest_service_gap`.
 */
export function keyFigures(
  ids: readonly KeyFigureId[],
  route: KeyFigureSource,
  limit = Infinity,
  themeId?: string,
): KeyFigure[] {
  const out: KeyFigure[] = []
  for (const id of ids) {
    const figure = resolve(id, route, themeId)
    if (figure) out.push(figure)
    if (out.length >= limit) break
  }
  return out
}

export interface ItrsFootnote {
  exposure: number | null
  wilderness: number | null
  assessedBy: string | null
  assessedOn: string | null
}

/**
 * The muted line under the key figures: exposure and wilderness (unless already shown as tiles)
 * and who assessed the route, when any of them exist.
 */
export function itrsFootnote(
  ids: readonly KeyFigureId[],
  route: Pick<KeyFigureSource, 'itrs'>,
): ItrsFootnote | null {
  const itrs = route.itrs
  if (!itrs) return null
  const note: ItrsFootnote = {
    exposure: ids.includes('itrs_exposure') ? null : (itrs.exposure ?? null),
    wilderness: ids.includes('itrs_wilderness') ? null : (itrs.wilderness ?? null),
    assessedBy: itrs.assessed_by ?? null,
    assessedOn: itrs.assessed_on ?? null,
  }
  return Object.values(note).some((v) => v != null) ? note : null
}
