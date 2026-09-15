import type { Feature, FeatureCollection, Point } from 'geojson'
import type { NearbyService, PublishedRoute } from '../types/route'
import type { Service } from '../types/service'

/** Properties of a services.geojson feature: the service without `location`, which is the geometry. */
export type ServiceProperties = Omit<Service, 'location'>
export type ServiceFeature = Feature<Point, ServiceProperties>
export type ServiceCollection = FeatureCollection<Point, ServiceProperties>

/** A nearby service of a route (5.3) resolved against the collection, in card order. */
export type NearbyEntry = NearbyService & { feature: ServiceFeature }

const cache = new Map<string, Promise<ServiceCollection>>()

/**
 * Loads services.geojson written by the build (`catalog.services`). The map and the route card
 * both need it, so the promise is cached per URL and the file is fetched once.
 */
export function loadServices(url: string): Promise<ServiceCollection> {
  let pending = cache.get(url)
  if (!pending) {
    pending = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json() as Promise<ServiceCollection>
    })
    pending.catch(() => cache.delete(url))
    cache.set(url, pending)
  }
  return pending
}

/** Features by service id; features without an id are skipped. */
export function serviceById(
  collection: Pick<ServiceCollection, 'features'>,
): Map<string, ServiceFeature> {
  const map = new Map<string, ServiceFeature>()
  for (const f of collection.features) if (f.properties?.id) map.set(f.properties.id, f)
  return map
}

/**
 * The route's nearby services for the card (UI-SPEC 4.2 item 7): the theme's
 * `service_categories_first` categories first in the theme's order, then by km. Ids missing
 * from the collection are skipped (P4).
 */
export function nearbyOrdered(
  route: Pick<PublishedRoute, 'nearby_services'>,
  services: ReadonlyMap<string, ServiceFeature>,
  categoriesFirst: readonly string[],
): NearbyEntry[] {
  const rank = (category: string) => {
    const i = categoriesFirst.indexOf(category)
    return i === -1 ? categoriesFirst.length : i
  }
  const entries: NearbyEntry[] = []
  for (const { id, km } of route.nearby_services ?? []) {
    const feature = services.get(id)
    if (feature) entries.push({ id, km, feature })
    else console.warn(`nearby service ${id} is not in services.geojson`)
  }
  return entries.sort(
    (a, b) =>
      rank(a.feature.properties.category) - rank(b.feature.properties.category) || a.km - b.km,
  )
}

/**
 * Marker shape of a nearby service (UI-SPEC 5.0): on desktop every service gets a pill; on
 * mobile only the theme's `service_categories_first` categories do, the rest are 10 px dots.
 */
export function pillOrDot(
  service: Pick<ServiceProperties, 'category'>,
  categoriesFirst: readonly string[],
  isMobile: boolean,
): 'pill' | 'dot' {
  return !isMobile || categoriesFirst.includes(service.category) ? 'pill' : 'dot'
}
