import type { RouteSummary } from '../types/catalog'

/** Routes that belong to the given theme. */
export function filterRoutesByTheme<T extends Pick<RouteSummary, 'themes'>>(
  routes: readonly T[],
  themeId: string,
): T[] {
  return routes.filter((r) => r.themes.includes(themeId))
}

/** Number of routes per theme id, for the landing page cards (UI-SPEC 2.1). */
export function countRoutesByTheme<T extends Pick<RouteSummary, 'themes'>>(
  routes: readonly T[],
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const r of routes) for (const id of r.themes) counts[id] = (counts[id] ?? 0) + 1
  return counts
}
