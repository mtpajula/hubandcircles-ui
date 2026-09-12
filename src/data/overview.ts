import type { Feature, FeatureCollection, LineString, MultiLineString, Point } from 'geojson'

export type OverviewProperties = { id: string; themes: string[] }
export type OverviewCollection = FeatureCollection<LineString | MultiLineString, OverviewProperties>
/** `themes` is copied from the line so the map's theme filter applies to endpoints unchanged. */
export type EndpointProperties = { id: string; kind: 'start' | 'end'; themes: string[] }

/** Loads the overview GeoJSON written by the build (all routes, simplified). */
export async function loadOverview(url: string): Promise<OverviewCollection> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as OverviewCollection
}

/**
 * Start and end points of every overview line, for the r 8 circles of UI-SPEC 3.4. Only picks the
 * first coordinate of the first part and the last coordinate of the last part; nothing is computed.
 */
export function routeEndpoints(
  overview: Pick<OverviewCollection, 'features'>,
): FeatureCollection<Point, EndpointProperties> {
  const features: Feature<Point, EndpointProperties>[] = []
  for (const f of overview.features) {
    const parts = lineParts(f.geometry).filter((part) => part.length > 0)
    const first = parts[0]?.[0]
    const last = parts[parts.length - 1]?.at(-1)
    if (!first || !last) continue
    features.push(point(f.properties, 'start', first), point(f.properties, 'end', last))
  }
  return { type: 'FeatureCollection', features }
}

/** The coordinate arrays of a line geometry: one for a LineString, one per part for a MultiLineString. */
function lineParts(geometry: LineString | MultiLineString | null | undefined): number[][][] {
  if (!geometry?.coordinates) return []
  return geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates]
}

function point(
  { id, themes }: OverviewProperties,
  kind: EndpointProperties['kind'],
  coordinates: number[],
): Feature<Point, EndpointProperties> {
  return {
    type: 'Feature',
    properties: { id, kind, themes },
    geometry: { type: 'Point', coordinates },
  }
}
