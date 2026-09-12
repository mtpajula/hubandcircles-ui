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

const { t } = useI18n()

const ROVANIEMI: [number, number] = [25.72, 66.5]
const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }
const ROUTE_LAYERS = ['overview-casing', 'overview-line'] as const

const container = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | null = null
let ready: Promise<void> = Promise.resolve()

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

function updateOpenRoute(m: MapLibreMap, id: string | null) {
  const source = m.getSource('route') as GeoJSONSource | undefined
  if (!source) return
  if (!id) {
    source.setData(EMPTY)
    return
  }
  source.setData(dataPath(`routes/${id}/track.geojson`))
  const bbox = props.catalog.routes.find((r) => r.id === id)?.bbox
  if (bbox) m.fitBounds(bbox, { padding: 40, animate: animate() })
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
  map = m
  // 'style.load' and not 'load': the latter waits for every basemap tile, which delays the routes.
  ready = new Promise((resolve) => m.once('style.load', () => resolve()))
  void ready.then(() => {
    addRouteLayers(m)
    updateOpenRoute(m, props.openRoute)
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
      if (map) updateOpenRoute(map, id)
    })
  },
)
</script>

<template>
  <div class="frame">
    <div ref="container" class="map"></div>
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
@media (max-width: 699px) {
  .legend {
    display: none;
  }
}
</style>
