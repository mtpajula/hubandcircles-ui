import type { LayerSpecification, SourceSpecification } from 'maplibre-gl'
import { dataPath } from '../data/paths'
import type { Catalog, PublishedLayer, Theme } from '../types/catalog'

/**
 * Catalog layers (ARKKITEHTUURI.md 5.4, chapter 8): the visibility rules written once, the
 * picker state, the merged attribution and the adapter from a layer card to MapLibre specs.
 * Everything here is pure; MapView.vue wires the results into the map.
 */

/** What the picker chose: one `base` layer (or none) and the ids of the other layers that are on. */
export type LayerState = { base: string | null; on: Set<string> }

/** `available()` of 5.4. `themeId` is `null` in the `all` view, where only `"*"` layers apply. */
export function available(
  layer: PublishedLayer,
  themeId: string | null,
  openRouteId: string | null,
): boolean {
  const themes = layer.visible_in.themes
  if (themes === '*') return true
  if (themeId !== null && (themes ?? []).includes(themeId)) return true
  return openRouteId !== null && (layer.visible_in.routes ?? []).includes(openRouteId)
}

/** `on_initially()` of 5.4. */
export function onInitially(layer: PublishedLayer, theme: Theme | null): boolean {
  return (theme?.default_layers ?? []).includes(layer.id) || layer.default_on === true
}

/** Catalog layers offered in this view, in catalog order (chapter 8: order within a slot). */
export function availableLayers(
  layers: readonly PublishedLayer[],
  themeId: string | null,
  openRouteId: string | null,
): PublishedLayer[] {
  return layers.filter((l) => available(l, themeId, openRouteId))
}

/**
 * Initial picker state for the available layers: the theme's `basemap` when it is offered, else
 * the first `base` layer that is on initially; other slots per `on_initially()`.
 */
export function initialState(
  available: readonly PublishedLayer[],
  theme: Theme | null,
): LayerState {
  const bases = available.filter((l) => l.slot === 'base')
  const base =
    bases.find((l) => l.id === theme?.basemap) ?? bases.find((l) => onInitially(l, theme)) ?? null
  const on = available.filter((l) => l.slot !== 'base' && onInitially(l, theme)).map((l) => l.id)
  return { base: base?.id ?? null, on: new Set(on) }
}

export function isOn(layer: PublishedLayer, state: LayerState): boolean {
  return layer.slot === 'base' ? state.base === layer.id : state.on.has(layer.id)
}

/** Attribution line (UI-SPEC 3.4): the basemap's first, then each visible layer's, de-duplicated. */
export function mergedAttribution(
  available: readonly PublishedLayer[],
  state: LayerState,
  basemapAttribution: string,
): string {
  const parts = [basemapAttribution]
  for (const layer of available) {
    const text = layer.attribution.trim()
    if (text && isOn(layer, state) && !parts.includes(text)) parts.push(text)
  }
  return parts.join(' · ')
}

// ---- localStorage (UI-SPEC 3.4: choices remembered per theme) ---------------------------------

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>

export function storageKey(themeId: string | null): string {
  return `layers:${themeId ?? 'all'}`
}

/** Stored state validated against the available layers; `null` when nothing usable is stored. */
export function readState(
  storage: Storage | null,
  key: string,
  available: readonly PublishedLayer[],
): LayerState | null {
  try {
    const raw = storage?.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { base, on } = parsed as { base?: unknown; on?: unknown }
    const ids = new Set(available.map((l) => l.id))
    const bases = new Set(available.filter((l) => l.slot === 'base').map((l) => l.id))
    return {
      base: typeof base === 'string' && bases.has(base) ? base : null,
      on: new Set(Array.isArray(on) ? on.filter((x): x is string => ids.has(String(x))) : []),
    }
  } catch {
    return null
  }
}

export function writeState(storage: Storage | null, key: string, state: LayerState): void {
  try {
    storage?.setItem(key, JSON.stringify({ base: state.base, on: [...state.on] }))
  } catch {
    // Private mode or a full quota: the choice simply is not remembered.
  }
}

// ---- adapter: layer card -> MapLibre (5.4 layer types; chapter 8 slots) ------------------------

export type LayerSpecs = {
  sourceId: string
  source: SourceSpecification
  layers: LayerSpecification[]
}

export function sourceId(layer: Pick<PublishedLayer, 'id'>): string {
  return `layer-${layer.id}`
}

/** GetMap tile template of a `wms` layer; MapLibre fills in `{bbox-epsg-3857}`. */
export function wmsTileUrl(layer: Pick<PublishedLayer, 'url' | 'wms'>): string {
  const wms = layer.wms
  const query = [
    'SERVICE=WMS',
    `VERSION=${encodeURIComponent(wms?.version ?? '1.1.1')}`,
    'REQUEST=GetMap',
    `LAYERS=${encodeURIComponent(wms?.layers ?? '')}`,
    'STYLES=',
    `FORMAT=${encodeURIComponent(wms?.format ?? 'image/png')}`,
    'TRANSPARENT=true',
    `SRS=${encodeURIComponent(wms?.srs ?? 'EPSG:3857')}`,
    'WIDTH=256',
    'HEIGHT=256',
    'BBOX={bbox-epsg-3857}',
  ].join('&')
  return `${layer.url}${layer.url.includes('?') ? '&' : '?'}${query}`
}

/** Tool-tiled xyz layers have a data-relative `url` (5.6); external ones (`https://...`) do not. */
function tileUrl(url: string): string {
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : dataPath(url)
}

function zoomRange(layer: PublishedLayer): { minzoom?: number; maxzoom?: number } {
  const out: { minzoom?: number; maxzoom?: number } = {}
  if (layer.minzoom != null) out.minzoom = layer.minzoom
  if (layer.maxzoom != null) out.maxzoom = layer.maxzoom
  return out
}

/** The `maplibre` escape hatch of 5.4: passed through over the generated spec, ids kept. */
function passthrough(spec: LayerSpecification, layer: PublishedLayer): LayerSpecification {
  if (!layer.maplibre) return spec
  return { ...spec, ...layer.maplibre, id: spec.id } as LayerSpecification
}

/**
 * MapLibre source and layer specs of a catalog layer. `fallbackColor` is the point stroke when
 * the card has no `style.color` (`--color-river`, UI-SPEC 3.4). `null` for types this build does
 * not draw yet.
 */
export function layerSpecs(layer: PublishedLayer, fallbackColor: string): LayerSpecs | null {
  const id = sourceId(layer)
  const opacity = layer.opacity ?? 1
  switch (layer.type) {
    case 'wms':
    case 'xyz': {
      const source: SourceSpecification = {
        type: 'raster',
        tiles: [layer.type === 'wms' ? wmsTileUrl(layer) : tileUrl(layer.url)],
        tileSize: 256,
        ...zoomRange(layer),
      }
      const spec: LayerSpecification = {
        id,
        type: 'raster',
        source: id,
        paint: { 'raster-opacity': opacity },
      }
      return { sourceId: id, source, layers: [passthrough(spec, layer)] }
    }
    case 'geojson': {
      const source: SourceSpecification = { type: 'geojson', data: dataPath(layer.url) }
      const style = layer.style ?? {}
      const color = style.color ?? fallbackColor
      const vectorOpacity = style.opacity ?? opacity
      const range = zoomRange(layer)
      const specs: LayerSpecification[] =
        layer.slot === 'points'
          ? [
              {
                id,
                type: 'circle',
                source: id,
                ...range,
                paint: {
                  'circle-radius': 6,
                  'circle-color': '#ffffff',
                  'circle-stroke-width': 2,
                  'circle-stroke-color': color,
                  'circle-opacity': vectorOpacity,
                  'circle-stroke-opacity': vectorOpacity,
                },
              },
            ]
          : [
              {
                id: `${id}-fill`,
                type: 'fill',
                source: id,
                ...range,
                filter: ['==', ['geometry-type'], 'Polygon'],
                paint: { 'fill-color': color, 'fill-opacity': vectorOpacity },
              },
              {
                id,
                type: 'line',
                source: id,
                ...range,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                  'line-color': color,
                  'line-width': style.width ?? 2,
                  'line-opacity': vectorOpacity,
                  ...(style.dashed ? { 'line-dasharray': [2, 2] } : {}),
                },
              },
            ]
      return { sourceId: id, source, layers: specs.map((s) => passthrough(s, layer)) }
    }
    default:
      // ponytail: pmtiles needs the `pmtiles` protocol package; skipped until it is added (P9).
      console.warn(`layer ${layer.id}: type ${layer.type} is not supported yet`)
      return null
  }
}

/** A `catalog.coverage` entry and the line layer that draws it (chapter 8, 5.6). */
export type CoverageSpecs = LayerSpecs & { layerId: string }

export function coverageSourceId(layerId: string): string {
  return `coverage-${layerId}`
}

/**
 * Coverage boundaries of `catalog.coverage` for layers that exist in the catalog: one geojson
 * source and one dashed `line` layer each, styled per UI-SPEC 3.4 (1.5 px `ink`, opacity .35,
 * dash 7 7 in pixels). No fill. The caller shows the line only while its layer is on.
 */
export function coverageSpecs(
  catalog: Pick<Catalog, 'coverage' | 'layers'>,
  ink: string,
): CoverageSpecs[] {
  const ids = new Set((catalog.layers ?? []).map((l) => l.id))
  const width = 1.5
  return Object.entries(catalog.coverage ?? {})
    .filter(([layerId]) => ids.has(layerId))
    .map(([layerId, url]) => {
      const id = coverageSourceId(layerId)
      return {
        layerId,
        sourceId: id,
        source: { type: 'geojson', data: dataPath(url) },
        layers: [
          {
            id,
            type: 'line',
            source: id,
            layout: { 'line-join': 'round' },
            paint: {
              'line-color': ink,
              'line-width': width,
              'line-opacity': 0.35,
              // MapLibre dash lengths are in line widths; 7 px each at 1.5 px.
              'line-dasharray': [7 / width, 7 / width],
            },
          },
        ],
      }
    })
}

/** Whether any layer that is on has a coverage boundary (Legend row, UI-SPEC 3.4; P11). */
export function coverageOn(
  coverage: Catalog['coverage'],
  visible: readonly Pick<PublishedLayer, 'id'>[],
): boolean {
  return visible.some((l) => l.id in (coverage ?? {}))
}

/**
 * MapLibre flattens nested feature properties to JSON strings; a points layer's `name` and
 * `description` (5.5 language objects) are restored so that PoiPopup can read them.
 */
export function parseNestedProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...properties }
  for (const key of ['name', 'description']) {
    const value = out[key]
    if (typeof value === 'string' && value.startsWith('{')) {
      try {
        out[key] = JSON.parse(value)
      } catch {
        // Not JSON after all: keep the string.
      }
    }
  }
  return out
}
