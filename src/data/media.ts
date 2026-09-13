import type { HeroImage } from '../types/catalog'
import type { PublishedMedia, PublishedRoute } from '../types/route'

export type MediaSize = '400' | '1600'

/** A media entry of the route by its source key (5.3); missing or incomplete entries are `null`. */
export function mediaEntry(route: PublishedRoute, key: string): PublishedMedia | null {
  const entry = route.media?.[key]
  return entry?.sizes ? entry : null
}

/** Path of one WebP size of a media key, relative to the data root; `null` when not built (P11). */
export function mediaPath(route: PublishedRoute, key: string, size: MediaSize): string | null {
  const file = mediaEntry(route, key)?.sizes?.[size]
  return file ? `routes/${route.id}/${file}` : null
}

/** The media key whose 400 px file is the route's `cover_image` path, for its other sizes. */
export function coverKey(route: PublishedRoute): string | null {
  const cover = route.cover_image
  if (!cover) return null
  const found = Object.keys(route.media ?? {}).find((k) => mediaPath(route, k, '400') === cover)
  return found ?? null
}

/**
 * The hero image (UI-SPEC 3.3, 5.1) per `theme.presentation.hero_image`: the hardest section's
 * picture or the cover, falling back to the other one. Paths relative to the data root.
 */
export function heroImage(
  route: PublishedRoute,
  kind: HeroImage,
): { small: string; large: string | null } | null {
  const hardestKey = route.hardest_section?.media ?? null
  const cover = coverKey(route)
  const keys = kind === 'hardest_section' ? [hardestKey, cover] : [cover, hardestKey]
  for (const key of keys) {
    const small = key ? mediaPath(route, key, '400') : null
    if (small) return { small, large: mediaPath(route, key!, '1600') }
  }
  return route.cover_image ? { small: route.cover_image, large: null } : null
}
