<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useMediaQuery } from '../composables/mediaQuery'
import { segmentAt, visibleLanes } from '../data/band'
import { heroImage, mediaPath } from '../data/media'
import { dataPath } from '../data/paths'
import { cardTheme, presentationOf } from '../data/presentation'
import { loadRoute } from '../data/route'
import { filterRoutesByTheme } from '../data/routes'
import { loadServices, nearbyOrdered, serviceById, type ServiceCollection } from '../data/services'
import { formatKm } from '../i18n/format'
import { langText } from '../i18n/language'
import { sectionComponent } from '../sections'
import type { Catalog, Theme } from '../types/catalog'
import type { NearbyService, PublishedRoute } from '../types/route'
import GpxButton from './GpxButton.vue'
import ItrsBadge from './ItrsBadge.vue'
import KeyFigures from './KeyFigures.vue'
import MaintenanceNotice from './MaintenanceNotice.vue'
import RouteBand from './RouteBand.vue'
import RouteServices from './RouteServices.vue'
import ShareBar from './ShareBar.vue'

/**
 * Route card panel (UI-SPEC 4.1–4.2, mobile 5.1). The theme's `presentation` decides the key
 * figures, the band lanes, the hero image and the block order: `hero_image: hardest_section`
 * themes put key figures and the hardest section first, `cover_image` themes the cover and the
 * shares. Under `all` the route's first theme is used. Ride mode is a V2 slot.
 */
defineOptions({ inheritAttrs: false })
const props = defineProps<{ catalog: Catalog; theme: Theme | null; lang: string }>()
/** Band cursor and hardest-section km, mirrored on the map by MapPage. */
const cursorKm = defineModel<number | null>('cursorKm', { default: null })
const hardestKm = defineModel<number | null>('hardestKm', { default: null })
/** Service id the services block asked the map to fly to (UI-SPEC 3.4). */
const focusService = defineModel<string | null>('focusService', { default: null })
/** `nearby_services` of the loaded route, handed to the map for its markers (UI-SPEC 3.4). */
const nearbyServices = defineModel<NearbyService[]>('nearbyServices', { default: () => [] })
const { t, te } = useI18n()
const route = useRoute()
const mobile = useMediaQuery('(max-width: 699px)')

const id = computed(() => String(route.params.id))
const themeId = computed(() => props.theme?.id ?? 'all')
const defaultLang = computed(() => props.catalog.project.default_language)
const themeName = computed(() =>
  props.theme ? langText(props.theme.name, props.lang, defaultLang.value) : t('theme.all'),
)
const themeRouteCount = computed(() =>
  props.theme
    ? filterRoutesByTheme(props.catalog.routes, props.theme.id).length
    : props.catalog.routes.length,
)
const backLabel = computed(() =>
  t('nav.backToTheme', { name: themeName.value, n: themeRouteCount.value }, themeRouteCount.value),
)

const published = ref<PublishedRoute | null>(null)
const failed = ref(false)

watch(
  id,
  async (next) => {
    published.value = null
    failed.value = false
    try {
      const data = await loadRoute(dataPath(`routes/${next}/route.json`))
      if (next === id.value) published.value = data
    } catch (e) {
      console.warn('route.json could not be loaded', e)
      failed.value = true
    }
  },
  { immediate: true },
)

/** Fixed identifiers (P4): translate when known, otherwise show the raw value. */
function label(group: string, value: string): string {
  const key = `${group}.${value}`
  return te(key) ? t(key) : value
}
/** Names of the route's themes from the catalog; unknown ids are skipped (P4). */
const themeChips = computed(() =>
  (published.value?.themes ?? [])
    .map((tid) => props.catalog.themes.find((x) => x.id === tid))
    .filter((x): x is Theme => x !== undefined)
    .map((x) => langText(x.name, props.lang, defaultLang.value)),
)
const seasons = computed(() =>
  (published.value?.seasons ?? []).map((s) => label('season', s)).join(', '),
)
const gpxHref = computed(() => (published.value?.gpx ? dataPath(published.value.gpx) : null))
const presentationTheme = computed(() =>
  cardTheme(props.catalog.themes, props.theme, published.value?.themes ?? []),
)
const presentation = computed(() => presentationOf(presentationTheme.value))

// ---- images ------------------------------------------------------------------------------------

/** Hero (mobile) and cover (desktop, `cover_image` themes): 400 and 1600 px variants. */
const hero = computed(() => {
  const r = published.value
  const image = r ? heroImage(r, presentation.value.hero_image) : null
  if (!image) return null
  const small = dataPath(image.small)
  const large = image.large ? dataPath(image.large) : null
  return { src: large ?? small, srcset: large ? `${small} 400w, ${large} 1600w` : undefined }
})
const showCover = computed(() => presentation.value.hero_image === 'cover_image' && !mobile.value)

// ---- hardest section (UI-SPEC 4.2 item 4) --------------------------------------------------------

const hardest = computed(() => {
  const r = published.value
  const h = r?.hardest_section
  if (!r || !h) return null
  const image = mediaPath(r, h.media, '400')
  const km = h.km ?? null
  const segments = r.segments ?? []
  const level =
    km !== null && segments.length
      ? (segmentAt(segments, km)?.itrs_technical ?? null)
      : (r.itrs?.technical ?? null)
  const description = h.description ? langText(h.description, props.lang, defaultLang.value) : ''
  if (!image && km === null && !description) return null
  return { image: image ? dataPath(image) : null, km, level, description }
})
const hardestKmText = computed(() =>
  hardest.value?.km == null ? '' : t('hardest.km', { km: formatKm(props.lang, hardest.value.km) }),
)

async function showHardest(): Promise<void> {
  const km = hardest.value?.km ?? null
  if (km === null) return
  // Reset first so that a second tap flies to the spot again.
  hardestKm.value = null
  await nextTick()
  hardestKm.value = km
}

// ---- band and shares ---------------------------------------------------------------------------

const segments = computed(() => published.value?.segments ?? [])
const bandLanes = computed(() =>
  published.value
    ? visibleLanes(presentation.value.band, published.value.profile, segments.value)
    : [],
)
const bandCaption = computed(() =>
  bandLanes.value.map((lane) => t(`band.lane.${lane}`)).join(' · '),
)
const bandShowsElevation = computed(() => bandLanes.value.includes('elevation'))

/** Share bars (UI-SPEC 4.2 item 6) for the shares that exist and are not a key figure already. */
const shareBars = computed(() => {
  const r = published.value
  if (!r) return []
  const shown = presentation.value.key_figures
  const bars: { kind: 'itrs' | 'surface' | 'traffic'; shares: Record<string, number> }[] = []
  if (r.itrs_technical_shares) bars.push({ kind: 'itrs', shares: r.itrs_technical_shares })
  if (r.surface_shares && !shown.includes('surface_shares'))
    bars.push({ kind: 'surface', shares: r.surface_shares })
  if (r.traffic_shares) bars.push({ kind: 'traffic', shares: r.traffic_shares })
  return bars.filter((b) => Object.keys(b.shares).length > 0)
})

// ---- services (UI-SPEC 4.2 item 7) --------------------------------------------------------------

const services = ref<ServiceCollection | null>(null)
watch(
  () => (published.value?.nearby_services?.length ? props.catalog.services : null),
  async (url) => {
    if (!url || services.value) return
    try {
      services.value = await loadServices(dataPath(url))
    } catch (e) {
      console.warn('services.geojson could not be loaded', e)
    }
  },
  { immediate: true },
)
watch(published, (r) => (nearbyServices.value = r?.nearby_services ?? []))
const byId = computed(() => (services.value ? serviceById(services.value) : null))
const nearby = computed(() =>
  published.value && byId.value
    ? nearbyOrdered(published.value, byId.value, presentation.value.service_categories_first)
    : [],
)
const serviceGap = computed(() => {
  const id = presentationTheme.value?.id
  return (id && published.value?.longest_service_gap?.[id]) || null
})

/** Block order per theme (UI-SPEC 4.2 intro); the description sections always come last. */
const blocks = computed(() =>
  presentation.value.hero_image === 'cover_image'
    ? ['cover', 'keyFigures', 'shares', 'band', 'hardest', 'services']
    : ['keyFigures', 'hardest', 'band', 'shares', 'services'],
)
</script>

<template>
  <div class="panel">
    <div v-if="mobile" class="hero">
      <img
        v-if="hero"
        class="hero-image"
        :src="hero.src"
        :srcset="hero.srcset"
        sizes="100vw"
        alt=""
      />
      <div v-else class="hero-image placeholder" aria-hidden="true"></div>
      <RouterLink class="back-pill" :to="{ name: 'theme', params: { lang, theme: themeId } }">
        ← {{ themeName }}
      </RouterLink>
      <div v-if="hardest" class="hero-badges">
        <ItrsBadge v-if="hardest.level" :level="hardest.level" size="sm" />
        <span v-if="hardestKmText" class="km-pill">{{ hardestKmText }}</span>
      </div>
    </div>
    <div v-else class="panel-header">
      <RouterLink class="back" :to="{ name: 'theme', params: { lang, theme: themeId } }">
        {{ backLabel }}
      </RouterLink>
      <GpxButton :href="gpxHref" :bytes="published?.gpx_bytes" :lang="lang" />
      <!-- V2: ride mode button -->
    </div>
    <p v-if="failed" class="status" role="alert">{{ t('error.route') }}</p>
    <p v-else-if="!published" class="status" role="status">{{ t('app.loading') }}</p>
    <article v-else class="body">
      <div class="title-block">
        <h1 class="title">{{ langText(published.name, lang, defaultLang) }}</h1>
        <div class="chips">
          <span v-for="name in themeChips" :key="name" class="chip theme-chip">{{ name }}</span>
          <span v-if="seasons" class="chip season-chip">{{ seasons }}</span>
          <span v-if="published.difficulty" class="chip">
            {{ t('route.difficulty') }}: {{ label('difficulty', published.difficulty) }}
          </span>
          <MaintenanceNotice :route="published" variant="pill" interactive />
        </div>
      </div>
      <MaintenanceNotice
        :route="published"
        variant="panel"
        :lang="lang"
        :default-lang="defaultLang"
      />
      <template v-for="block in blocks" :key="block">
        <img
          v-if="block === 'cover' && showCover && hero"
          class="cover"
          :src="hero.src"
          :srcset="hero.srcset"
          sizes="516px"
          alt=""
          loading="lazy"
        />
        <section v-else-if="block === 'keyFigures'" class="block">
          <h2 class="eyebrow">{{ t('route.keyFigures') }}</h2>
          <KeyFigures
            :figures="presentation.key_figures"
            :route="published"
            :lang="lang"
            :theme-id="presentationTheme?.id"
          />
        </section>
        <section v-else-if="block === 'hardest' && hardest" class="block">
          <h2 class="eyebrow">{{ t('hardest.title') }}</h2>
          <component
            :is="hardest.km === null ? 'div' : 'button'"
            class="hardest"
            :type="hardest.km === null ? undefined : 'button'"
            @click="showHardest"
          >
            <img
              v-if="hardest.image"
              class="hardest-image"
              :src="hardest.image"
              alt=""
              loading="lazy"
              width="188"
              height="128"
            />
            <span class="hardest-text">
              <span class="hardest-head">
                <ItrsBadge v-if="hardest.level" :level="hardest.level" size="sm" />
                <span v-if="hardestKmText" class="hardest-km">{{ hardestKmText }}</span>
              </span>
              <span v-if="hardest.description" class="hardest-description">
                {{ hardest.description }}
              </span>
              <span v-if="hardest.km !== null" class="hardest-hint">{{ t('hardest.hint') }}</span>
            </span>
          </component>
        </section>
        <section v-else-if="block === 'band' && bandLanes.length" class="block">
          <h2 class="eyebrow">{{ t('band.title') }}</h2>
          <p class="caption">{{ bandCaption }}</p>
          <RouteBand
            v-model:cursor-km="cursorKm"
            :profile="published.profile"
            :segments="segments"
            :lanes="presentation.band"
            :length-km="published.length_km"
            :lang="lang"
          />
        </section>
        <template v-else-if="block === 'shares'">
          <section v-for="bar in shareBars" :key="bar.kind" class="block">
            <h2 class="eyebrow">{{ t(`route.sharesTitle.${bar.kind}`) }}</h2>
            <ShareBar :shares="bar.shares" :kind="bar.kind" :lang="lang" />
          </section>
        </template>
        <RouteServices
          v-else-if="block === 'services'"
          v-model:cursor-km="cursorKm"
          :entries="nearby"
          @focus="focusService = $event"
          :categories-first="presentation.service_categories_first"
          :gap="serviceGap"
          :lang="lang"
          :default-lang="defaultLang"
        />
      </template>
      <section v-if="published.sections.length" class="block description">
        <template v-for="(section, i) in published.sections" :key="i">
          <template v-if="section.type === 'elevation_profile'">
            <RouteBand
              v-if="!bandShowsElevation && published.profile.length > 1"
              v-model:cursor-km="cursorKm"
              :profile="published.profile"
              :lanes="['elevation']"
              :length-km="published.length_km"
              :lang="lang"
            />
          </template>
          <component
            :is="sectionComponent(section.type)"
            v-else-if="sectionComponent(section.type)"
            :section="section"
            :route="published"
            :lang="lang"
            :default-lang="defaultLang"
          />
        </template>
      </section>
      <!-- V2 (mobile): primary "ride" pill; the GPX pill is filled until then -->
      <div v-if="mobile" class="mobile-actions">
        <GpxButton :href="gpxHref" :bytes="published.gpx_bytes" :lang="lang" />
      </div>
    </article>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--gap-14);
  padding: 18px 22px;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-12);
}
.back {
  font: 600 14px/1.2 var(--font-family);
  color: var(--color-river);
  text-decoration: none;
}
.back:hover {
  text-decoration: underline;
}
.status {
  margin: 0;
  font: var(--text-body);
  color: var(--color-ink-soft);
}
.body {
  display: flex;
  flex-direction: column;
  gap: var(--gap-14);
}
.title-block {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
}
.title {
  margin: 0;
  font: var(--text-page-title);
  color: var(--color-ink);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-8);
}
.chip {
  padding: 6px 11px;
  border-radius: var(--radius-chip);
  font: 600 12px/1.2 var(--font-family);
  color: var(--color-ink-soft);
  background: var(--color-white);
  border: 1px solid var(--color-border);
}
.theme-chip {
  color: var(--theme-primary);
  background: var(--theme-primary-10);
  border-color: transparent;
}
.season-chip {
  background: var(--color-snow);
  border-color: transparent;
}
.block {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
}
.eyebrow {
  margin: 0;
  font: var(--text-eyebrow);
  letter-spacing: var(--text-eyebrow-spacing);
  text-transform: uppercase;
  color: var(--color-ink-muted);
}
.caption {
  margin: -4px 0 0;
  font: var(--text-caption-lg);
  color: var(--color-ink-muted);
}
.cover {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  border-radius: var(--radius-panel);
  background: var(--color-border-soft);
}
.description {
  font: var(--text-body);
  color: var(--color-ink-prose);
}
.description :deep(p) {
  margin: 0;
}

/* Hardest section card (UI-SPEC 4.2 item 4) */
.hardest {
  display: flex;
  align-items: stretch;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  background: var(--color-white);
  color: inherit;
  font: inherit;
  text-align: left;
  overflow: hidden;
}
button.hardest {
  cursor: pointer;
}
button.hardest:hover,
button.hardest:focus-visible {
  border-color: var(--theme-primary);
  box-shadow: var(--theme-shadow);
}
.hardest-image {
  flex: none;
  width: 188px;
  height: 128px;
  object-fit: cover;
}
.hardest-text {
  display: flex;
  flex-direction: column;
  gap: var(--gap-6);
  padding: 12px 14px;
  min-width: 0;
}
.hardest-head {
  display: flex;
  align-items: center;
  gap: var(--gap-8);
}
.hardest-km {
  font: 700 14px/1.2 var(--font-family);
  color: var(--color-ink);
}
.hardest-description {
  font: 400 14px/1.5 var(--font-family);
  color: var(--color-ink-prose);
}
.hardest-hint {
  font: 400 12px/1.4 var(--font-family);
  color: var(--color-river);
}

/* Mobile route card (UI-SPEC 5.1) */
.hero {
  position: relative;
  margin: -14px -16px 0;
}
.hero-image {
  display: block;
  width: 100%;
  height: var(--hero-image-height);
  object-fit: cover;
}
.placeholder {
  background: var(--color-border-soft);
}
.back-pill {
  position: absolute;
  top: 14px;
  left: 14px;
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 14px;
  border-radius: 18px;
  background: var(--color-white);
  box-shadow: var(--shadow-control);
  font: 600 14px/1 var(--font-family);
  color: var(--color-ink);
  text-decoration: none;
}
.hero-badges {
  position: absolute;
  left: 14px;
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: var(--gap-6);
}
.km-pill {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 12px;
  background: var(--color-white-92);
  font: 700 12px/1 var(--font-family);
  color: var(--color-ink);
}
@media (max-width: 699px) {
  .panel {
    gap: 13px;
    padding: 14px 16px;
  }
  .body {
    gap: 13px;
  }
  .title {
    font: 700 21px/1.2 var(--font-family);
  }
  .hardest-image {
    width: 120px;
    height: auto;
  }
  .mobile-actions {
    display: flex;
    justify-content: center;
    padding-top: var(--gap-8);
  }
}
</style>
