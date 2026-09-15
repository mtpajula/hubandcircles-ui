import { mixWithWhite, withAlpha } from './data/color'
import type { Theme } from './types/catalog'

export const DARK_ATTRIBUTE = 'data-theme-dark'

/** Computed value of a CSS custom property on `<html>` (for MapLibre paint, which cannot read variables). */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * The only place that writes theme colors into CSS variables (components do not know themes by
 * name). `null` is the `all` pseudo-theme: base colors river/ink stand in for the theme.
 * Derived values (`--theme-primary-10`, `--theme-route-other`, `--theme-primary-tint`) are
 * computed here as plain hex so that the same values work as MapLibre paint properties.
 */
export function applyTheme(theme: Theme | null): void {
  const html = document.documentElement
  const style = html.style
  const primary = theme?.colors.primary ?? cssVar('--color-river')
  const route = theme?.colors.route ?? cssVar('--color-ink')
  const highlight = theme?.colors.highlight ?? cssVar('--color-midnight-sun')
  style.setProperty('--theme-primary', primary)
  style.setProperty('--theme-route', route)
  style.setProperty('--theme-highlight', highlight)
  style.setProperty('--theme-primary-10', withAlpha(primary, 0.1))
  style.setProperty('--theme-route-other', mixWithWhite(route, 0.5))
  style.setProperty('--theme-primary-tint', mixWithWhite(primary, 0.5))
  style.setProperty('--theme-shadow', `0 3px 10px ${withAlpha(primary, 0.16)}`)
  html.toggleAttribute(DARK_ATTRIBUTE, theme?.dark === true)
}
