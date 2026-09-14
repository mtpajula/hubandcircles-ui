<script setup lang="ts">
import {
  Map as MapLibreMap,
  NavigationControl,
  type ExpressionSpecification,
  type FilterSpecification,
  type GeoJSONSource,
  type IControl,
  type LayerSpecification,
  type MapMouseEvent,
  type MapOptions,
  type StyleSpecification,
} from 'maplibre-gl'
import type { Feature, FeatureCollection, Point } from 'geojson'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  type ComponentPublicInstance,
} from 'vue'
import { useI18n } from 'vue-i18n'
import PoiPopup from '../components/PoiPopup.vue'
import ServiceIcon from '../components/ServiceIcon.vue'
import { BASEMAP_URL } from '../config'
import { mixWithWhite } from '../data/color'
import { loadOverview, routeEndpoints } from '../data/overview'
import { dataPath } from '../data/paths'
import {
  loadServices,
  serviceById,
  type ServiceCollection,
  type ServiceFeature,
} from '../data/services'
import { loadTrack, nearestKm, pointAtKm, type TrackFeature } from '../data/track'
import { formatKm } from '../i18n/format'
import { langText } from '../i18n/language'
import { cssVar } from '../theme'
import type { Catalog, Theme } from '../types/catalog'
import type { NearbyService } from '../types/route'
import LayerPicker from './LayerPicker.vue'
import Legend from './Legend.vue'
import './worker'
import { unionBboxes } from './bbox'
import {
  availableLayers,
  initialState,
  isOn,
  layerSpecs,
  mergedAttribution,
  parseNestedProperties,
  readState,
  storageKey,
  writeState,
  type LayerState,
} from './layers'
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
  /** `nearby_services` of the open route (route.json), drawn as service pills (UI-SPEC 3.4). */
  nearbyServices?: NearbyService[]
}>()

/** Highlighted route: set from the list (hover/focus) and from a click on a line. */
const highlighted = defineModel<string | null>('highlightedRoute', { default: null })
/** Band cursor of the open route (UI-SPEC 4.2 item 5): mirrored as a marker on the track. */
const cursorKm = defineModel<number | null>('cursorKm', { default: null })
/** Hardest-section km the card asked to show (UI-SPEC 4.3): marker and flyTo. */
const hardestKm = defineModel<number | null>('hardestKm', { default: null })

const { t, te } = useI18n()

const ROVANIEMI: [number, number] = [25.72, 66.5]
const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }
const ROUTE_LAYERS = ['overview-casing', 'overview-line'] as const
/** Service pills are HTML overlays; the count is capped so that a long route stays light. */
const MAX_PILLS = 30
/** The plain service circles (no route open) appear from this zoom on (UI-SPEC 3.4). */
const SERVICES_MIN_ZOOM = 12
/** Dim overlay of a dark theme above the `base` slot (UI-SPEC 3.4, chapter 8). */
const DIM_LAYER = 'dim'
const DIM_COLOR = 'rgba(12,20,28,0.35)'

const container = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | null = null
let ready: Promise<void> = Promise.resolve()
/** track.geojson of the open route, for km <-> position lookups (src/data/track.ts). */
let track: TrackFeature | null = null
/** Bumped on every map move so that the marker positions below are recomputed. */
const viewVersion = ref(0)
/** services.geojson (`catalog.services`), loaded once for the circles, the pills and the popup. */
const services = shallowRef<ServiceCollection | null>(null)
const serviceIndex = computed(() => (services.value ? serviceById(services.value) : null))
/** Service point whose popup is open, with its km when it sits on the open route. */
const selected = shallowRef<{ feature: ServiceFeature; km: number | null } | null>(null)

// ---- catalog layers (ARKKITEHTUURI.md 5.4, chapter 8; UI-SPEC 3.4) ---------------------------

/** Catalog layers offered in this view (`available()`), in catalog order. */
const catalogLayers = computed(() =>
  availableLayers(props.catalog.layers ?? [], props.theme?.id ?? null, props.openRoute),
)
const layerState = ref<LayerState>({ base: null, on: new Set() })
const pickerOpen = ref(false)
const picker = ref<ComponentPublicInstance | null>(null)
let layersControl: LayersControl | null = null
/** MapLibre layer ids per catalog layer, filled when the specs are added to the map. */
const mapLayerIds = new Map<string, string[]>()
const attribution = computed(() =>
  mergedAttribution(catalogLayers.value, layerState.value, t('map.attribution')),
)
const visibleLayers = computed(() => catalogLayers.value.filter((l) => isOn(l, layerState.value)))

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
/** Remembered choice of this theme when there is one, else the data's initial state. */
function loadLayerState() {
  const key = storageKey(props.theme?.id ?? null)
  layerState.value =
    readState(storage(), key, catalogLayers.value) ?? initialState(catalogLayers.value, props.theme)
}
function onPickerChange(state: LayerState) {
  layerState.value = state
  writeState(storage(), storageKey(props.theme?.id ?? null), state)
}
function togglePicker(open = !pickerOpen.value) {
  if (pickerOpen.value === open) return
  pickerOpen.value = open
  layersControl?.setExpanded(open)
  if (!open) layersControl?.focus()
}
function onPointerDown(e: PointerEvent) {
  const target = e.target as Node | null
  if (!pickerOpen.value || !target) return
  if (picker.value?.$el?.contains(target) || layersControl?.contains(target)) return
  togglePicker(false)
}

const highlightedName = computed(() => {
  const r = props.catalog.routes.find((x) => x.id === highlighted.value)
  return r ? langText(r.name, props.lang, props.catalog.project.default_language) : null
})

function animate(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * "Layers" tile below the zoom buttons, inside the MapLibre control stack (UI-SPEC 3.4). The
 * picker itself is a Vue component in the frame; the tile only toggles it and carries
 * `aria-expanded`. Disabled when the catalog offers no layers.
 */
class LayersControl implements IControl {
  private element: HTMLDivElement | null = null
  private button: HTMLButtonElement | null = null
  private readonly label: string
  private readonly onClick: () => void
  constructor(label: string, onClick: () => void) {
    this.label = label
    this.onClick = onClick
  }
  onAdd(): HTMLElement {
    const group = document.createElement('div')
    group.className = 'maplibregl-ctrl maplibregl-ctrl-group'
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'layers-button'
    button.textContent = this.label
    button.setAttribute('aria-expanded', 'false')
    button.setAttribute('aria-controls', 'layer-picker')
    button.addEventListener('click', this.onClick)
    group.append(button)
    this.element = group
    this.button = button
    return group
  }
  onRemove(): void {
    this.element?.remove()
    this.element = null
    this.button = null
  }
  setExpanded(open: boolean): void {
    this.button?.setAttribute('aria-expanded', String(open))
  }
  setDisabled(disabled: boolean): void {
    if (this.button) this.button.disabled = disabled
  }
  focus(): void {
    this.button?.focus()
  }
  contains(node: Node): boolean {
    return this.element?.contains(node) ?? false
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
  m.setPaintProperty('services', 'circle-stroke-color', cssVar('--theme-primary'))
  // With a route open its nearby services are pills; the plain circles would only add noise.
  m.setLayoutProperty('services', 'visibility', props.openRoute ? 'none' : 'visible')
  if (m.getLayer(DIM_LAYER))
    m.setLayoutProperty(DIM_LAYER, 'visibility', props.theme?.dark ? 'visible' : 'none')
}

/** Shows the catalog layers the picker has on; everything else in the catalog stays hidden. */
function applyLayers(m: MapLibreMap) {
  const visible = new Set(visibleLayers.value.map((l) => l.id))
  for (const [id, ids] of mapLayerIds)
    for (const layerId of ids)
      if (m.getLayer(layerId))
        m.setLayoutProperty(layerId, 'visibility', visible.has(id) ? 'visible' : 'none')
  layersControl?.setDisabled(catalogLayers.value.length === 0)
}

// ---- style and layers --------------------------------------------------------------------------

function style(): StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: { type: 'raster', tiles: [BASEMAP_URL], tileSize: 256, maxzoom: 19 },
      overview: { type: 'geojson', data: EMPTY },
      endpoints: { type: 'geojson', data: EMPTY },
      route: { type: 'geojson', data: EMPTY },
      services: { type: 'geojson', data: EMPTY },
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
  m.addLayer(
    {
      id: 'services',
      type: 'circle',
      source: 'services',
      minzoom: SERVICES_MIN_ZOOM,
      // Issues are drawn as HTML issue markers (UI-SPEC 3.4), not as plain circles.
      filter: ['!=', ['get', 'category'], 'issue'],
      paint: {
        'circle-radius': 6,
        'circle-color': cssVar('--color-white'),
        'circle-stroke-width': 2,
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
  // A plain service circle opens the popup; the feature is looked up by id because MapLibre
  // flattens nested properties (the name object) to strings.
  m.on('click', 'services', (e: MapMouseEvent & { features?: Feature[] }) => {
    const id = e.features?.[0]?.properties?.id
    const feature = typeof id === 'string' ? serviceIndex.value?.get(id) : undefined
    if (feature) select(feature, null)
  })
  m.on('mouseenter', 'services', () => (m.getCanvas().style.cursor = 'pointer'))
  m.on('mouseleave', 'services', () => (m.getCanvas().style.cursor = ''))
}

/**
 * Every catalog layer goes into its slot once, hidden; `applyLayers` switches visibility. The dim
 * overlay sits right above the `base` slot so that raster layers added afterwards land above it.
 */
function addCatalogLayers(m: MapLibreMap) {
  m.addLayer(
    {
      id: DIM_LAYER,
      type: 'background',
      layout: { visibility: 'none' },
      paint: { 'background-color': DIM_COLOR },
    },
    slotAnchor('raster'),
  )
  const fallback = cssVar('--color-river')
  for (const layer of props.catalog.layers ?? []) {
    const specs = layerSpecs(layer, fallback)
    if (!specs) continue
    try {
      m.addSource(specs.sourceId, specs.source)
      for (const spec of specs.layers) {
        const hidden: LayerSpecification = {
          ...spec,
          layout: { ...spec.layout, visibility: 'none' },
        }
        m.addLayer(hidden, slotAnchor(layer.slot))
        if (layer.type === 'geojson' && layer.slot === 'points') wirePointClicks(m, spec.id)
      }
      mapLayerIds.set(
        layer.id,
        specs.layers.map((l) => l.id),
      )
    } catch (e) {
      console.warn(`layer ${layer.id} could not be added`, e)
    }
  }
}

/** A click on a catalog points feature opens PoiPopup; the properties are Service-shaped (5.5). */
function wirePointClicks(m: MapLibreMap, layerId: string) {
  m.on('click', layerId, (e: MapMouseEvent & { features?: Feature[] }) => {
    const hit = e.features?.[0]
    if (!hit || hit.geometry.type !== 'Point') return
    const properties = parseNestedProperties(hit.properties ?? {}) as ServiceFeature['properties']
    if (typeof properties.id !== 'string' || typeof properties.category !== 'string') return
    const feature: ServiceFeature = {
      type: 'Feature',
      geometry: hit.geometry as Point,
      properties,
    }
    select(feature, null)
  })
  m.on('mouseenter', layerId, () => (m.getCanvas().style.cursor = 'pointer'))
  m.on('mouseleave', layerId, () => (m.getCanvas().style.cursor = ''))
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

// ---- service markers (UI-SPEC 3.4) --------------------------------------------------------------

type ServiceMarker = { feature: ServiceFeature; km: number | null; x: number; y: number }

/** The nearby services of the open route resolved to features, first `MAX_PILLS` of them. */
const nearbyFeatures = computed(() => {
  const index = serviceIndex.value
  if (!index || !props.openRoute) return []
  const out: { feature: ServiceFeature; km: number }[] = []
  for (const { id, km } of props.nearbyServices ?? []) {
    const feature = index.get(id)
    if (feature) out.push({ feature, km })
    if (out.length >= MAX_PILLS) break
  }
  return out
})
/** Every issue of the collection while no route is open; a route shows its nearby ones. */
const issueFeatures = computed(() =>
  props.openRoute
    ? nearbyFeatures.value.filter((x) => x.feature.properties.category === 'issue')
    : (services.value?.features ?? [])
        .filter((f) => f.properties.category === 'issue')
        .map((feature) => ({ feature, km: null })),
)

function project(items: { feature: ServiceFeature; km: number | null }[]): ServiceMarker[] {
  void viewVersion.value
  const m = map
  if (!m) return []
  return items.map(({ feature, km }) => {
    const [lng, lat] = feature.geometry.coordinates
    const { x, y } = m.project([lng!, lat!])
    return { feature, km, x, y }
  })
}
const pills = computed(() =>
  project(nearbyFeatures.value.filter((x) => x.feature.properties.category !== 'issue')),
)
const issues = computed(() => project(issueFeatures.value))
const popupPx = computed(() => project(selected.value ? [selected.value] : [])[0] ?? null)

function serviceName(feature: ServiceFeature): string {
  const { name, category } = feature.properties
  if (name) return langText(name, props.lang, props.catalog.project.default_language)
  const key = `service.category.${category}`
  return te(key) ? t(key) : category
}
function pillKm(km: number | null): string {
  return km === null ? '' : t('service.km', { km: formatKm(props.lang, km) })
}
function pillLabel(marker: ServiceMarker): string {
  const name = serviceName(marker.feature)
  return marker.km === null
    ? name
    : t('service.marker', { name, km: formatKm(props.lang, marker.km) })
}
function select(feature: ServiceFeature, km: number | null) {
  selected.value = selected.value?.feature === feature ? null : { feature, km }
}
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  selected.value = null
  togglePicker(false)
}

async function loadServicePoints(m: MapLibreMap) {
  if (!props.catalog.services) return
  try {
    const collection = await loadServices(dataPath(props.catalog.services))
    services.value = collection
    ;(m.getSource('services') as GeoJSONSource | undefined)?.setData(collection)
  } catch (e) {
    console.warn('services.geojson could not be loaded', e)
  }
}

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
  selected.value = null
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
    // The attribution is assembled from the visible layers (UI-SPEC 3.4) and rendered below.
    attributionControl: false,
    locale: {
      'NavigationControl.ZoomIn': t('map.zoomIn'),
      'NavigationControl.ZoomOut': t('map.zoomOut'),
    },
    ...initialView(),
  })
  m.addControl(new NavigationControl({ showCompass: false }), 'top-right')
  layersControl = new LayersControl(t('map.layers'), () => togglePicker())
  m.addControl(layersControl, 'top-right')
  m.on('move', () => viewVersion.value++)
  // A tile that fails (an external service refusing the origin, a WMS hiccup) is not a page
  // error: warn once per source and let the layers below show through.
  const failed = new Set<string>()
  m.on('error', (e) => {
    const sourceId = (e as { sourceId?: string }).sourceId
    if (!sourceId) return console.error(e.error)
    if (failed.has(sourceId)) return
    failed.add(sourceId)
    console.warn(`tiles of ${sourceId} could not be loaded`, e.error?.message)
  })
  map = m
  // 'style.load' and not 'load': the latter waits for every basemap tile, which delays the routes.
  ready = new Promise((resolve) => m.once('style.load', () => resolve()))
  loadLayerState()
  void ready.then(() => {
    addCatalogLayers(m)
    addRouteLayers(m)
    applyLayers(m)
    void updateOpenRoute(m, props.openRoute)
    void loadRoutes(m)
    void loadServicePoints(m)
  })
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pointerdown', onPointerDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointerdown', onPointerDown)
  map?.remove()
  map = null
})

watch([() => props.theme, highlighted, () => props.openRoute], () => {
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

watch(catalogLayers, () => {
  togglePicker(false)
  loadLayerState()
})

watch(visibleLayers, () => {
  void ready.then(() => {
    if (map) applyLayers(map)
  })
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
    <button
      v-for="marker in pills"
      :key="marker.feature.properties.id"
      type="button"
      class="service-pill"
      :style="translate(marker)"
      :aria-label="pillLabel(marker)"
      @click="select(marker.feature, marker.km)"
    >
      <ServiceIcon :category="marker.feature.properties.category" :size="24" />
      <span class="pill-name">{{ serviceName(marker.feature) }}</span>
      <span v-if="marker.km !== null" class="pill-km">{{ pillKm(marker.km) }}</span>
    </button>
    <button
      v-for="marker in issues"
      :key="marker.feature.properties.id"
      type="button"
      class="issue-marker"
      :style="translate(marker)"
      :aria-label="pillLabel(marker)"
      @click="select(marker.feature, marker.km)"
    >
      !
    </button>
    <div v-if="selected && popupPx" class="popup-anchor" :style="translate(popupPx)">
      <PoiPopup
        class="popup"
        :service="selected.feature.properties"
        :km="selected.km"
        :lang="lang"
        :default-lang="catalog.project.default_language"
        @close="selected = null"
      />
    </div>
    <p v-if="highlightedName" class="badge" role="status">
      {{ t('map.selected', { name: highlightedName }) }}
    </p>
    <LayerPicker
      v-if="pickerOpen"
      ref="picker"
      class="picker"
      :layers="catalogLayers"
      :state="layerState"
      :lang="lang"
      :default-lang="catalog.project.default_language"
      @update:state="onPickerChange"
    />
    <Legend
      class="legend"
      :theme="theme"
      :layers="visibleLayers"
      :lang="lang"
      :default-lang="catalog.project.default_language"
    />
    <p class="attribution">{{ attribution }}</p>
  </div>
</template>

<style scoped>
.frame {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: var(--map-strip-height);
  overflow: hidden;
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
/* Layer picker popover below the control stack (UI-SPEC 3.4). */
.picker {
  position: absolute;
  top: 152px;
  right: 14px;
  z-index: 3;
}
/* Attribution bottom-right, assembled from the visible layers (UI-SPEC 3.4). */
.attribution {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 1;
  margin: 0;
  padding: 3px 8px;
  background: var(--color-white-86);
  border-radius: var(--radius-badge) 0 0 0;
  color: var(--color-ink-soft);
  font: 400 11px/1.4 var(--font-family);
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
  color: var(--color-ink-muted);
  cursor: default;
}
.frame :deep(.layers-button[aria-expanded='true']) {
  background: var(--theme-primary-10);
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
/* Service pill (UI-SPEC 3.4): 34 h white pill, the 24 px icon circle centred on the point. */
.service-pill {
  position: absolute;
  top: -17px;
  left: -18px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--gap-7);
  height: 34px;
  padding: 0 11px 0 6px;
  border: 0;
  border-radius: 17px;
  background: var(--color-white);
  box-shadow: var(--shadow-control);
  color: var(--color-ink);
  white-space: nowrap;
  cursor: pointer;
}
.pill-name {
  font: 600 13px/1 var(--font-family);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pill-km {
  font: var(--text-caption-lg);
  line-height: 1;
  color: var(--color-ink-muted);
}
/* Issue marker: 30 px white circle, midnight-sun ring, "!" in gravel (UI-SPEC 3.4). */
.issue-marker {
  position: absolute;
  top: -15px;
  left: -15px;
  z-index: 1;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 2.5px solid var(--color-midnight-sun);
  border-radius: 50%;
  box-sizing: border-box;
  background: var(--color-white);
  box-shadow: var(--shadow-control);
  color: var(--color-notice-icon);
  font: 700 13px/1 var(--font-family);
  cursor: pointer;
}
/* Popup hangs above the point, centred. */
.popup-anchor {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  width: 0;
  height: 0;
}
.popup {
  position: absolute;
  bottom: 22px;
  left: -120px;
}
@media (max-width: 699px) {
  .legend {
    display: none;
  }
}
</style>
