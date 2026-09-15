<script setup lang="ts">
import { Map as MapLibreMap, type GeoJSONSource } from 'maplibre-gl'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ServiceIcon from '../components/ServiceIcon.vue'
import { BASEMAP_URL } from '../config'
import { dataPath } from '../data/paths'
import { isOffRoute, nextService, progress, type Position } from '../data/ride'
import { loadRoute } from '../data/route'
import { loadServices, serviceById, type ServiceFeature } from '../data/services'
import { loadTrack, type TrackFeature } from '../data/track'
import { formatKm } from '../i18n/format'
import { langText } from '../i18n/language'
import '../map/worker'
import { applyTheme, cssVar } from '../theme'
import type { Catalog } from '../types/catalog'
import type { PublishedRoute } from '../types/route'

/**
 * Ride mode (`…/route/<id>/ride`, ARKKITEHTUURI.md 7.12, UI-SPEC 5.2): a full-screen dark map
 * with the route, the rider's position, the distance ridden and the next service. A glanceable
 * view, not a navigator: no voice, no turns, at most three 56 px buttons.
 *
 * Its own lightweight MapLibre instance: the OSM basemap under a `--color-night` overlay, the
 * route line, nothing else. Geolocation is requested only from the "Allow location" button
 * (iOS grants it from a gesture only) and the position never leaves the browser (chapter 13):
 * the only requests are the data files the route card already uses.
 */
const props = defineProps<{ catalog: Catalog }>()
const { t, te } = useI18n()
const route = useRoute()
const router = useRouter()

const lang = computed(() => String(route.params.lang))
const themeId = computed(() => String(route.params.theme))
const id = computed(() => String(route.params.id))
const defaultLang = computed(() => props.catalog.project.default_language)
const theme = computed(() => props.catalog.themes.find((x) => x.id === themeId.value) ?? null)
const summary = computed(() => props.catalog.routes.find((r) => r.id === id.value) ?? null)
const name = computed(() =>
  summary.value ? langText(summary.value.name, lang.value, defaultLang.value) : '',
)
const cardLink = computed(() => ({
  name: 'route',
  params: { lang: lang.value, theme: themeId.value, id: id.value },
}))

// The tint (`--theme-primary-tint`) comes from the theme, so the page applies it like MapPage.
watch(theme, (next) => applyTheme(next), { immediate: true })

// ---- data: route.json (nearby services), track.geojson, services.geojson --------------------

const published = ref<PublishedRoute | null>(null)
const track = shallowRef<TrackFeature | null>(null)
const services = shallowRef<ReadonlyMap<string, ServiceFeature> | null>(null)

async function loadData() {
  const routeId = id.value
  try {
    const [r, feature] = await Promise.all([
      loadRoute(dataPath(`routes/${routeId}/route.json`)),
      loadTrack(dataPath(`routes/${routeId}/track.geojson`)),
    ])
    if (routeId !== id.value) return
    published.value = r
    track.value = feature
    if (r.nearby_services?.length && props.catalog.services)
      services.value = serviceById(await loadServices(dataPath(props.catalog.services)))
  } catch (e) {
    console.warn('ride data could not be loaded', e)
  }
}

// ---- position (UI-SPEC 5.2) ------------------------------------------------------------------

type LocationState = 'idle' | 'watching' | 'denied' | 'unavailable'
const hasGeolocation = typeof navigator !== 'undefined' && 'geolocation' in navigator
const locationState = ref<LocationState>(hasGeolocation ? 'idle' : 'unavailable')
const position = ref<Position | null>(null)
/** The map follows the position until the user pans; "Centre on me" turns it back on. */
const follow = ref(true)
let watchId: number | null = null

const current = computed(() =>
  track.value && position.value ? progress(track.value, position.value) : null,
)
const offRoute = computed(() => current.value !== null && isOffRoute(current.value))
const riddenKm = computed(() => (current.value && !offRoute.value ? current.value.km : null))
const lengthKm = computed(() => summary.value?.length_km ?? null)
const progressPercent = computed(() =>
  riddenKm.value !== null && lengthKm.value
    ? Math.min(100, (riddenKm.value / lengthKm.value) * 100)
    : 0,
)
const next = computed(() => {
  const km = riddenKm.value
  const entry = km === null ? null : nextService(published.value?.nearby_services, km)
  const feature = entry ? services.value?.get(entry.id) : undefined
  return entry && feature ? { feature, aheadKm: entry.km - km! } : null
})

function serviceName(feature: ServiceFeature): string {
  const { name: serviceLabel, category } = feature.properties
  if (serviceLabel) return langText(serviceLabel, lang.value, defaultLang.value)
  const key = `service.category.${category}`
  return te(key) ? t(key) : category
}

/** Called from the button's click only: the permission prompt needs a user gesture (iOS). */
function allowLocation() {
  if (!hasGeolocation || watchId !== null) return
  locationState.value = 'watching'
  watchId = navigator.geolocation.watchPosition(
    (fix) => {
      position.value = { lng: fix.coords.longitude, lat: fix.coords.latitude }
    },
    (error) => {
      // Denied, or no fix at all before the first one: the message shows, the route stays.
      if (position.value === null) {
        stopWatching()
        locationState.value = 'denied'
      } else console.warn('geolocation error', error.message)
    },
    { enableHighAccuracy: true },
  )
}
function stopWatching() {
  if (watchId !== null && hasGeolocation) navigator.geolocation.clearWatch(watchId)
  watchId = null
}
function recenter() {
  follow.value = true
  if (map && position.value) centre(map, position.value)
}
function stop() {
  void router.push(cardLink.value)
}

// ---- screen wake lock (7.12): best effort, never a blocker ----------------------------------

let wakeLock: WakeLockSentinel | null = null
async function requestWakeLock() {
  if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return
  try {
    wakeLock = await navigator.wakeLock.request('screen')
  } catch {
    wakeLock = null
  }
}
function onVisibilityChange() {
  if (document.visibilityState === 'visible') void requestWakeLock()
}

// ---- map ---------------------------------------------------------------------------------------

const container = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | null = null
/** Bumped on every map move so that the position dot is re-projected. */
const viewVersion = ref(0)
const FOLLOW_ZOOM = 15

function animate(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
function centre(m: MapLibreMap, p: Position) {
  m.easeTo({
    center: [p.lng, p.lat],
    zoom: Math.max(m.getZoom(), FOLLOW_ZOOM),
    duration: animate() ? 300 : 0,
  })
}

const dotPx = computed(() => {
  void viewVersion.value
  const p = position.value
  if (!map || !p) return null
  const { x, y } = map.project([p.lng, p.lat])
  return { transform: `translate(${x}px, ${y}px)` }
})

function createMap(element: HTMLDivElement): MapLibreMap {
  const night = cssVar('--color-night')
  const bbox = summary.value?.bbox
  const m = new MapLibreMap({
    container: element,
    attributionControl: false,
    style: {
      version: 8,
      sources: {
        basemap: { type: 'raster', tiles: [BASEMAP_URL], tileSize: 256, maxzoom: 19 },
        route: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      },
      layers: [
        { id: 'basemap', type: 'raster', source: 'basemap' },
        // The OSM basemap dimmed under night at .55 so that the route tint stands out.
        {
          id: 'dim',
          type: 'background',
          paint: { 'background-color': night, 'background-opacity': 0.55 },
        },
        {
          id: 'route-casing',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': night, 'line-width': 14 },
        },
        {
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': cssVar('--theme-primary-tint'), 'line-width': 7 },
        },
      ],
    },
    ...(bbox
      ? {
          bounds: bbox,
          fitBoundsOptions: { padding: { top: 170, right: 30, bottom: 270, left: 30 } },
        }
      : { center: [25.72, 66.5] as [number, number], zoom: 10 }),
  })
  m.on('move', () => viewVersion.value++)
  m.on('dragstart', () => (follow.value = false))
  m.on('error', (e) => console.warn('ride map', e.error?.message))
  return m
}

watch(track, (feature) => {
  if (map && feature) (map.getSource('route') as GeoJSONSource | undefined)?.setData(feature)
})
watch(position, (p, previous) => {
  if (!map || !p) return
  if (previous === null) centre(map, p)
  else if (follow.value) map.easeTo({ center: [p.lng, p.lat], duration: animate() ? 300 : 0 })
})

onMounted(() => {
  if (container.value) {
    const m = createMap(container.value)
    map = m
    m.once('style.load', () => {
      if (track.value) (m.getSource('route') as GeoJSONSource | undefined)?.setData(track.value)
    })
  }
  void loadData()
  void requestWakeLock()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  void wakeLock?.release()
  wakeLock = null
  stopWatching()
  map?.remove()
  map = null
})
</script>

<template>
  <main class="ride">
    <div ref="container" class="map" role="region" :aria-label="t('ride.map')"></div>
    <div class="status-bar" aria-hidden="true"></div>
    <div v-if="dotPx" class="position" :style="dotPx" aria-hidden="true"></div>

    <section class="panel">
      <h1 class="name">{{ name }}</h1>
      <p v-if="offRoute" class="off-route" role="status">{{ t('ride.offRoute') }}</p>
      <template v-else-if="riddenKm !== null && lengthKm !== null">
        <p class="km-row" role="status">
          <span class="km">{{ formatKm(lang, riddenKm) }}</span>
          <span class="total">{{ t('ride.progress', { km: formatKm(lang, lengthKm) }) }}</span>
        </p>
        <div class="bar" aria-hidden="true">
          <div class="fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </template>
    </section>

    <div class="stack">
      <div v-if="next" class="service">
        <ServiceIcon :category="next.feature.properties.category" :size="34" />
        <div class="service-text">
          <span class="service-name">{{ serviceName(next.feature) }}</span>
          <span class="service-meta">
            {{ t('ride.nextService', { km: formatKm(lang, next.aheadKm) }) }}
          </span>
        </div>
      </div>
      <p
        v-if="locationState === 'denied' || locationState === 'unavailable'"
        class="notice"
        role="status"
      >
        {{ t('ride.locationDenied') }}
      </p>
      <button v-if="locationState === 'idle'" type="button" class="primary" @click="allowLocation">
        {{ t('ride.allowLocation') }}
      </button>
      <button
        v-else-if="locationState === 'watching'"
        type="button"
        class="primary"
        :aria-pressed="follow"
        @click="recenter"
      >
        {{ t('ride.recenter') }}
      </button>
      <button type="button" class="outline" @click="stop">{{ t('ride.stop') }}</button>
      <p class="footnote">{{ t('ride.footnote') }}</p>
      <p class="footnote">{{ t('map.attribution') }}</p>
    </div>
  </main>
</template>

<style scoped>
.ride {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: var(--color-night);
  color: var(--color-on-night);
}
.map {
  position: absolute;
  inset: 0;
}
.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: var(--color-night-status);
  pointer-events: none;
}
.position {
  position: absolute;
  top: -11px;
  left: -11px;
  width: 22px;
  height: 22px;
  box-sizing: border-box;
  border: 4px solid var(--color-white);
  border-radius: 50%;
  background: var(--theme-primary-tint);
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--theme-primary-tint) 28%, transparent);
  pointer-events: none;
}
.panel {
  position: absolute;
  top: 56px;
  left: 14px;
  right: 14px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
  padding: 13px 15px;
  border: 1px solid var(--color-night-border);
  border-radius: 12px;
  background: var(--color-night-soft);
}
.name {
  margin: 0;
  font: 700 15px/1.25 var(--font-family);
  color: var(--color-white);
}
.km-row {
  display: flex;
  align-items: baseline;
  gap: var(--gap-7);
  margin: 0;
}
.km {
  font: 700 34px/1.1 var(--font-family);
  color: var(--color-white);
}
.total,
.off-route {
  font: 400 15px/1.3 var(--font-family);
  color: var(--color-on-night-faint);
}
.off-route {
  margin: 0;
}
.bar {
  height: 8px;
  border-radius: 4px;
  background: var(--color-night-border);
  overflow: hidden;
}
.fill {
  height: 100%;
  background: var(--theme-primary-tint);
}
.stack {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-10);
}
.service {
  display: flex;
  align-items: center;
  gap: var(--gap-12);
  padding: 10px 12px;
  border: 1px solid var(--color-night-border);
  border-radius: 12px;
  background: var(--color-night-soft);
}
.service-text {
  display: flex;
  flex-direction: column;
  gap: var(--gap-4);
  min-width: 0;
}
.service-name {
  font: 700 15px/1.25 var(--font-family);
  color: var(--color-white);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.service-meta {
  font: 400 15px/1.3 var(--font-family);
  color: var(--color-on-night-faint);
}
.notice {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--color-night-soft);
  font: 400 15px/1.4 var(--font-family);
  color: var(--color-on-night);
}
.primary,
.outline {
  height: 56px;
  padding: 0 20px;
  border: 0;
  border-radius: 28px;
  cursor: pointer;
}
.primary {
  background: var(--theme-primary-tint);
  color: var(--color-night);
  font: 700 17px/1 var(--font-family);
}
.outline {
  box-sizing: border-box;
  border: 1.5px solid var(--color-night-outline);
  background: var(--color-night-status);
  color: var(--color-on-night);
  font: 600 16px/1 var(--font-family);
}
.footnote {
  margin: 0;
  font: 400 15px/1.35 var(--font-family);
  color: var(--color-on-night-faint);
  text-align: center;
}
</style>
