import type { Presentation, Theme } from '../types/catalog'

export type ResolvedPresentation = Required<{
  [K in keyof Presentation]: NonNullable<Presentation[K]>
}>

/** Frontend defaults when a theme has no `presentation` (5.2, 18.2.12 for `all`). */
export const DEFAULT_PRESENTATION: ResolvedPresentation = {
  key_figures: ['length', 'ascent'],
  band: ['elevation'],
  hero_image: 'cover_image',
  filters: [],
  service_categories_first: [],
}

/** The theme's presentation with every missing list filled from the defaults; `null` = `all`. */
export function presentationOf(theme: Theme | null | undefined): ResolvedPresentation {
  const given = theme?.presentation ?? {}
  return {
    key_figures: given.key_figures ?? DEFAULT_PRESENTATION.key_figures,
    band: given.band ?? DEFAULT_PRESENTATION.band,
    hero_image: given.hero_image ?? DEFAULT_PRESENTATION.hero_image,
    filters: given.filters ?? DEFAULT_PRESENTATION.filters,
    service_categories_first:
      given.service_categories_first ?? DEFAULT_PRESENTATION.service_categories_first,
  }
}

/** The theme a route card is presented in: the current theme, or under `all` its first theme. */
export function cardTheme(
  themes: readonly Theme[],
  current: Theme | null,
  routeThemes: readonly string[],
): Theme | null {
  return current ?? themes.find((t) => t.id === routeThemes[0]) ?? null
}
