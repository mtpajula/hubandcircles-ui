<script setup lang="ts">
import {
  Map as MapLibreMap,
  NavigationControl,
  type ExpressionSpecification,
  type FilterSpecification,
  type GeoJSONSource,
  type IControl,
  type MapMouseEvent,
  type MapOptions,
  type StyleSpecification,
} from 'maplibre-gl'
import type { Feature, FeatureCollection } from 'geojson'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BASEMAP_URL } from '../config'
import { mixWithWhite } from '../data/color'
import { loadOverview, routeEndpoints } from '../data/overview'
import { dataPath } from '../data/paths'
import { loadTrack, nearestKm, pointAtKm, type TrackFeature } from '../data/track'
import { formatKm } from '../i18n/format'
import { langText } from '../i18n/language'
import { cssVar } from '../theme'
import type { Catalog, Theme } from '../types/catalog'
import Legend from './Legend.vue'
import './worker'
import { unionBboxes } from './bbox'
import { LAYER_SLOTS, slotAnchor } from './slots'

/**
 * The MapLibre instance (ARKKITEHTUURI.md 4.4, chapter 8; UI-SPEC 3.4). `theme === null` is the
 * `all` pseudo-theme: every route is drawn, colored by its first theme. Colors are read from the
 * CSS variables that src/theme.ts writes, so the map and the page never disagree.
 */
const props = defineProps<{
  catalog: Catalog
  theme: Theme | null
  openRoute: string | null
  lang: string
}>()

/** Highlighted route: set from the list (hover/focus) and from a click on a line. */
const highlighted = defineModel<string | null>('highlightedRoute', { default: null })
/** Band cursor of the open route (UI-SPEC 4.2 item 5): mirrored as a marker on the track. */
const cursorKm = defineModel<number | null>('cursorKm', { default: null })
/** Hardest-section km the card asked to show (UI-SPEC 4.3): marker and flyTo. */
const hardestKm = defineModel<number | null>('hardestKm', { default: null })

const { t } = useI18n()

const ROVANIEMI: [number, number] = [25.72, 66.5]
const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }
const ROUTE_LAYERS = ['overview-casing', 'overview-line'] as const

const container = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | null = null
let ready: Promise<void> = Promise.resolve()
/** track.geojson of the open route, for km <-> position lookups (src/data/track.ts). */
let track: TrackFeature | null = null
/** Bumped on every map move so that the marker positions below are recomputed. */
const viewVersion = ref(0)

const highlightedName = computed(() => {
  const r = props.catalog.routes.find((x) => x.id === highlighted.value)
  return r ? langText(r.name, props.lang, props.catalog.project.default_language) : null
})

function animate(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Placeholder "Layers" tile below the zoom buttons; the layer picker arrives with the layer types. */
class LayersControl implements IControl {
  private element: HTMLDivElement | null = null
  private readonly label: string
  constructor(label: string) {
    this.label = label
  }
  onAdd(): HTMLElement {
    const group = document.createElement('div')
    group.className = 'maplibregl-ctrl maplibregl-ctrl-group'
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'layers-button'
    button.textContent = this.label
    button.disabled = true
    group.append(button)
    this.element = group
    return group
  }
  onRemove(): void {
    this.element?.remove()
    this.element = null
  }
}

// ---- paint -------------------------------------------------------------------------------------

const isHighlighted = (): ExpressionSpecification => ['==', ['get', 'id'], highlighted.value ?? '']

/** Route color: the theme's route color, or in `all` mode each route by its first theme. */
function routeColor(lighten: boolean): string | ExpressionSpecification {
  if (props.theme) return cssVar(lighten ? '--theme-route-other' : '--theme-route')
  const fallback = cssVar('--theme-route')
  const byTheme: (string | ExpressionSpecification)[] = props.catalog.themes.flatMap((x) => [
    x.id,
    lighten ? mixWithWhite(x.colors.route, 0.5) : x.colors.route,
  ])
  return [
    'match',
    ['at', 0, ['get', 'themes']],
    ...byTheme,
    fallback,
  ] as unknown as ExpressionSpecification
}

function colorExpression(): ExpressionSpecification {
  return ['case', isHighlighted(), routeColor(false), routeColor(true)]
}

function themeFilter(): FilterSpecification | null {
  return props.theme ? ['in', props.theme.id, ['get', 'themes']] : null
}

function paint(m: MapLibreMap) {
  const filter = themeFilter()
  for (const id of [...ROUTE_LAYERS, 'endpoints']) m.setFilter(id, filter)
  const color = colorExpression()
  m.setPaintProperty('overview-casing', 'line-color', cssVar('--color-snow'))
  m.setPaintProperty('overview-casing', 'line-width', ['case', isHighlighted(), 13, 9])
  m.setPaintProperty('overview-line', 'line-color', color)
  m.setPaintProperty('overview-line', 'line-width', ['case', isHighlighted(), 6, 4])
  m.setPaintProperty('route-line', 'line-color', cssVar('--theme-highlight'))
  m.setPaintProperty('endpoints', 'circle-stroke-color', color)
}

// ---- style and layers --------------------------------------------------------------------------

function style(): StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: [BASEMAP_URL],
        tileSize: 256,
        maxzoom: 19,
        attribution: t('map.attribution'),
      },
      overview: { type: 'geojson', data: EMPTY },
      endpoints: { type: 'geojson', data: EMPTY },
      route: { type: 'geojson', data: EMPTY },
    },
    layers: [
      { id: 'basemap', type: 'raster', source: 'basemap' },
      // Slot anchors in chapter 8 order. A slot's layers are inserted below their anchor.
      ...LAYER_SLOTS.map((slot) => ({
        id: slotAnchor(slot),
        type: 'background' as const,
        paint: { 'background-opacity': 0 },
      })),
    ],
  }
}

function addRouteLayers(m: MapLibreMap) {
  const routes = slotAnchor('routes')
  const round = { 'line-join': 'round', 'line-cap': 'round' } as const
  m.addLayer(
    { id: 'overview-casing', type: 'line', source: 'overview', layout: round, paint: {} },
    routes,
  )
  m.addLayer(
    { id: 'overview-line', type: 'line', source: 'overview', layout: round, paint: {} },
    routes,
  )
  m.addLayer(
    {
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: round,
      paint: { 'line-width': 4 },
    },
    routes,
  )
  m.addLayer(
    {
      id: 'endpoints',
      type: 'circle',
      source: 'endpoints',
      paint: {
        'circle-radius': 8,
        'circle-color': cssVar('--color-white'),
        'circle-stroke-width': 3,
      },
    },
    slotAnchor('points'),
  )
  paint(m)

  const pick = (e: MapMouseEvent & { features?: Feature[] }) => {
    const id = e.features?.[0]?.properties?.id
    if (typeof id === 'string') highlighted.value = id
  }
  for (const id of ROUTE_LAYERS) {
    m.on('click', id, pick)
    m.on('mouseenter', id, () => (m.getCanvas().style.cursor = 'pointer'))
    m.on('mouseleave', id, () => (m.getCanvas().style.cursor = ''))
  }
  // Hovering or tapping the open route's line moves the band cursor to the nearest track km.
  const toCursor = (e: MapMouseEvent) => {
    if (track) cursorKm.value = nearestKm(track, e.lngLat.lng, e.lngLat.lat)
  }
  m.on('mousemove', 'route-line', toCursor)
  m.on('click', 'route-line', toCursor)
  m.on('mouseenter', 'route-line', () => (m.getCanvas().style.cursor = 'crosshair'))
  m.on('mouseleave', 'route-line', () => (m.getCanvas().style.cursor = ''))
}

// ---- markers (UI-SPEC 3.4, 4.3) ----------------------------------------------------------------
// Plain positioned elements instead of maplibre's Marker: the same `project()` call, far less code.

/** Track position of a km as pixel coordinates in the frame; `null` when there is nothing to show. */
function markerPx(km: number | null): { x: number; y: number } | null {
  void viewVersion.value
  const m = map
  const point = m && track && km !== null ? pointAtKm(track, km) : null
  if (!m || !point) return null
  const { x, y } = m.project(point)
  return { x, y }
}
const cursorPx = computed(() => markerPx(cursorKm.value))
const hardestPx = computed(() => markerPx(hardestKm.value))
const hardestLabel = computed(() =>
  hardestKm.value === null
    ? ''
    : t('hardest.marker', { km: formatKm(props.lang, hardestKm.value) }),
)
const translate = (p: { x: number; y: number }) => ({ transform: `translate(${p.x}px, ${p.y}px)` })

function flyToHardest(m: MapLibreMap) {
  const point = track && hardestKm.value !== null ? pointAtKm(track, hardestKm.value) : null
  if (point) m.flyTo({ center: point, zoom: Math.max(m.getZoom(), 14), animate: animate() })
}

async function loadRoutes(m: MapLibreMap) {
  try {
    const overview = await loadOverview(dataPath(props.catalog.overview))
    ;(m.getSource('overview') as GeoJSONSource | undefined)?.setData(overview)
    ;(m.getSource('endpoints') as GeoJSONSource | undefined)?.setData(routeEndpoints(overview))
  } catch (e) {
    console.warn('overview.geojson could not be loaded', e)
  }
}

function initialView(): Partial<MapOptions> {
  // Project area from the catalog; the union of route bboxes is the fallback for old data.
  const bbox = props.catalog.project.area ?? unionBboxes(props.catalog.routes.map((r) => r.bbox))
  return bbox
    ? { bounds: bbox, fitBoundsOptions: { padding: 40 } }
    : { center: ROVANIEMI, zoom: 10 }
}

async function updateOpenRoute(m: MapLibreMap, id: string | null) {
  const source = m.getSource('route') as GeoJSONSource | undefined
  if (!source) return
  track = null
  viewVersion.value++
  if (!id) {
    source.setData(EMPTY)
    return
  }
  const bbox = props.catalog.routes.find((r) => r.id === id)?.bbox
  if (bbox) m.fitBounds(bbox, { padding: 40, animate: animate() })
  try {
    const feature = await loadTrack(dataPath(`routes/${id}/track.geojson`))
    if (id !== props.openRoute) return
    track = feature
    source.setData(feature)
    viewVersion.value++
    flyToHardest(m)
  } catch (e) {
    console.warn('track.geojson could not be loaded', e)
  }
}

// ---- lifecycle ---------------------------------------------------------------------------------

onMounted(() => {
  if (!container.value) return
  const m = new MapLibreMap({
    container: container.value,
    style: style(),
    attributionControl: { compact: false },
    locale: {
      'NavigationControl.ZoomIn': t('map.zoomIn'),
      'NavigationControl.ZoomOut': t('map.zoomOut'),
    },
    ...initialView(),
  })
  m.addControl(new NavigationControl({ showCompass: false }), 'top-right')
  m.addControl(new LayersControl(t('map.layers')), 'top-right')
  m.on('move', () => viewVersion.value++)
  map = m
  // 'style.load' and not 'load': the latter waits for every basemap tile, which delays the routes.
  ready = new Promise((resolve) => m.once('style.load', () => resolve()))
  void ready.then(() => {
    addRouteLayers(m)
    void updateOpenRoute(m, props.openRoute)
    void loadRoutes(m)
  })
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

watch([() => props.theme, highlighted], () => {
  void ready.then(() => {
    if (map) paint(map)
  })
})

watch(
  () => props.openRoute,
  (id) => {
    void ready.then(() => {
      if (map) void updateOpenRoute(map, id)
    })
  },
)

watch(hardestKm, () => {
  if (map) flyToHardest(map)
})
</script>

<template>
  <div class="frame">
    <div ref="container" class="map"></div>
    <div
      v-if="cursorPx"
      class="cursor-marker"
      :style="translate(cursorPx)"
      aria-hidden="true"
    ></div>
    <div v-if="hardestPx" class="hardest-marker" :style="translate(hardestPx)" aria-hidden="true">
      <div class="hardest-column">
        <span class="hardest-tooltip">{{ hardestLabel }}</span>
        <span class="hardest-stem"></span>
        <span class="hardest-dot"></span>
      </div>
    </div>
    <p v-if="highlightedName" class="badge" role="status">
      {{ t('map.selected', { name: highlightedName }) }}
    </p>
    <Legend class="legend" :theme="theme" />
  </div>
</template>

<style scoped>
.frame {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: var(--map-strip-height);
}
.map {
  position: absolute;
  inset: 0;
}
.badge {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 1;
  margin: 0;
  padding: 8px 12px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-control);
  color: var(--color-ink);
  font: 600 13px/1.2 var(--font-family);
  pointer-events: none;
}
.legend {
  position: absolute;
  left: 14px;
  bottom: 56px;
  z-index: 1;
}

/* MapLibre controls (UI-SPEC 3.4): 38 x 38 white tiles, radius 8, shadow; attribution 400 11. */
.frame :deep(.maplibregl-ctrl-top-right) {
  padding: 4px 4px 0 0;
}
.frame :deep(.maplibregl-ctrl-top-right .maplibregl-ctrl-group) {
  margin: 10px 10px 0 0;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-control);
  background: var(--color-white);
}
.frame :deep(.maplibregl-ctrl-group button) {
  width: 38px;
  height: 38px;
}
.frame :deep(.maplibregl-ctrl-group button + button) {
  border-top: 1px solid var(--color-border-soft);
}
.frame :deep(.layers-button) {
  color: var(--color-river);
  font: 600 12px/1 var(--font-family);
}
.frame :deep(.layers-button:disabled) {
  cursor: default;
}
.frame :deep(.maplibregl-ctrl-bottom-right .maplibregl-ctrl-attrib) {
  background: var(--color-white-86);
  color: var(--color-ink-soft);
  font: 400 11px/1.4 var(--font-family);
  padding: 3px 8px;
  border-radius: var(--radius-badge) 0 0 0;
}
.frame :deep(.maplibregl-ctrl-attrib a) {
  color: var(--color-ink-soft);
}
/* Band cursor (12 px theme dot) and hardest-section marker (UI-SPEC 4.3), anchored at the dot centre. */
.cursor-marker {
  position: absolute;
  top: -6px;
  left: -6px;
  z-index: 1;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--theme-primary);
  border: 2px solid var(--color-white);
  box-shadow: var(--shadow-control);
  pointer-events: none;
}
.hardest-marker {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 0;
  height: 0;
  pointer-events: none;
}
/* The column hangs above the anchor so that the dot's centre (12 px from its bottom) sits on the km. */
.hardest-column {
  position: absolute;
  bottom: -12px;
  left: -80px;
  width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hardest-tooltip {
  padding: 5px 8px;
  border-radius: var(--radius-tooltip);
  background: var(--color-ink);
  color: var(--color-white);
  font: 600 12px/1.2 var(--font-family);
  white-space: nowrap;
}
.hardest-stem {
  width: 2px;
  height: 26px;
  background: var(--color-ink);
}
.hardest-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--itrs-red);
  border: 3px solid var(--color-white);
  box-shadow: var(--shadow-control);
}
@media (max-width: 699px) {
  .legend {
    display: none;
  }
}
</style>
