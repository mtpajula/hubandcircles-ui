<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useMediaQuery } from '../composables/mediaQuery'
import { dataPath } from '../data/paths'
import { cardTheme, presentationOf } from '../data/presentation'
import { loadRoute } from '../data/route'
import { filterRoutesByTheme } from '../data/routes'
import { langText } from '../i18n/language'
import { sectionComponent } from '../sections'
import type { Catalog, Theme } from '../types/catalog'
import type { PublishedRoute } from '../types/route'
import GpxButton from './GpxButton.vue'
import KeyFigures from './KeyFigures.vue'
import MaintenanceNotice from './MaintenanceNotice.vue'
import RouteBand from './RouteBand.vue'
import ShareBar from './ShareBar.vue'

/**
 * Route card panel (UI-SPEC 4.1–4.2, mobile 5.1). The theme's `presentation` decides the key
 * figures; under `all` the route's first theme is used. Blocks that need data not built yet
 * (hardest section, services, ride mode) are marked as slots.
 */
defineOptions({ inheritAttrs: false })
const props = defineProps<{ catalog: Catalog; theme: Theme | null; lang: string }>()
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
const coverImage = computed(() =>
  published.value?.cover_image ? dataPath(published.value.cover_image) : null,
)
const gpxHref = computed(() => (published.value?.gpx ? dataPath(published.value.gpx) : null))
const presentation = computed(() =>
  presentationOf(cardTheme(props.catalog.themes, props.theme, published.value?.themes ?? [])),
)
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
</script>

<template>
  <div class="panel">
    <div v-if="mobile" class="hero">
      <img v-if="coverImage" class="hero-image" :src="coverImage" alt="" />
      <div v-else class="hero-image placeholder" aria-hidden="true"></div>
      <RouterLink class="back-pill" :to="{ name: 'theme', params: { lang, theme: themeId } }">
        ← {{ themeName }}
      </RouterLink>
      <!-- V2: ItrsBadge + hardest-section km pill -->
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
      <!-- ponytail: block order per theme (UI-SPEC 4.2 intro) once M4 brings hero_image:
           `hardest_section` themes keep key figures first, `cover_image` themes put the cover
           and surface shares first. Until then key figures come first for every theme. -->
      <section class="block">
        <h2 class="eyebrow">{{ t('route.keyFigures') }}</h2>
        <KeyFigures :figures="presentation.key_figures" :route="published" :lang="lang" />
      </section>
      <!-- V2: hardest section card -->
      <section v-if="published.profile.length > 1" class="block">
        <h2 class="eyebrow">{{ t('route.elevationProfile') }}</h2>
        <RouteBand :profile="published.profile" :length-km="published.length_km" :lang="lang" />
      </section>
      <section v-for="bar in shareBars" :key="bar.kind" class="block">
        <h2 class="eyebrow">{{ t(`route.sharesTitle.${bar.kind}`) }}</h2>
        <ShareBar :shares="bar.shares" :kind="bar.kind" :lang="lang" />
      </section>
      <!-- V2: services list, longest gap -->
      <section v-if="published.sections.length" class="block description">
        <template v-for="(section, i) in published.sections" :key="i">
          <component
            :is="sectionComponent(section.type)"
            v-if="sectionComponent(section.type)"
            :section="section"
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
.description {
  font: var(--text-body);
  color: var(--color-ink-prose);
}
.description :deep(p) {
  margin: 0;
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
  .mobile-actions {
    display: flex;
    justify-content: center;
    padding-top: var(--gap-8);
  }
}
</style>
