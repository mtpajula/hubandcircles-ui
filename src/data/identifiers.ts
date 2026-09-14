/** Fixed identifiers that are code, not data (ARKKITEHTUURI.md 5.7, P4). */

/** Theme pseudo-id of the map page that shows every route: `#/<lang>/all/`. */
export const ALL_THEMES = 'all'

/** Share key of a segment gap: surface, traffic or ITRS level not known. Always drawn hatched. */
export const UNKNOWN = 'unknown'

/** Surfaces of segments and shares; `mixed` is the derived `dominant_surface` below 50 %. */
export const SURFACES = [
  'asphalt',
  'paving',
  'gravel',
  'trail',
  'boardwalk',
  'snow',
  UNKNOWN,
] as const

export const TRAFFIC = ['separated', 'quiet', 'busy', UNKNOWN] as const

/** ITRS levels from easiest to most extreme; the index + 1 is the level number shown. */
export const ITRS_LEVELS = ['green', 'blue', 'red', 'black', 'orange'] as const

export const NON_MUNICIPAL_REASONS = [
  'private_road_no_permission',
  'unmarked',
  'unmaintained',
  'everymans_rights_terrain',
  'seasonal',
] as const

/** Service point categories (5.5); `issue` is drawn as the issue marker, the rest as service pills. */
export const SERVICE_CATEGORIES = [
  'cafe',
  'restaurant',
  'shop',
  'accommodation',
  'bike_repair',
  'bike_rental',
  'water',
  'toilet',
  'lean_to',
  'hut',
  'issue',
] as const

/** Shelter categories use the touring green icon circle instead of river (UI-SPEC 3.4). */
export const SHELTER_CATEGORIES = ['lean_to', 'hut'] as const
