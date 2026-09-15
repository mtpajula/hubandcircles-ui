<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import BottomSheet from '../components/BottomSheet.vue'
import LanguageSwitch from '../components/LanguageSwitch.vue'
import SiteBrand from '../components/SiteBrand.vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import { useMediaQuery } from '../composables/mediaQuery'
import { useCatalog } from '../composables/useCatalog'
import { filterRoutesByTheme } from '../data/routes'
import { sheetInset, sheetQuery, sheetStateFromQuery, type SheetState } from '../data/sheet'
import { availableLanguages } from '../i18n'
import { langText } from '../i18n/language'
import MapView from '../map/MapView.vue'
import { applyTheme } from '../theme'
import type { Catalog } from '../types/catalog'
import type { NearbyService } from '../types/route'

/**
 * Map page (UI-SPEC 3.1): header with the brand link, theme pills and language switch (no
 * report button since AP39); sidebar with the route list (RouteList) or the route card (RouteCard); the map fills the rest.
 * The sidebar widens to 560 px when a route is open (UI-SPEC 4.2). Below 700 px the sidebar
 * content sits in a bottom sheet over the map (UI-SPEC 5.0); its state lives in the route query.
 * This page owns the highlighted route and passes it to the list and the map as props/v-model.
 */
const props = defineProps<{ catalog: Catalog }>()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { themesInOrder } = useCatalog()
const mobile = useMediaQuery('(max-width: 699px)')
/** Route highlighted on the map: list hover/focus or a click on a line (UI-SPEC 3.3). */
const highlighted = ref<string | null>(null)
/** Band cursor and hardest-section km of the open route, shared by the card and the map. */
const cursorKm = ref<number | null>(null)
const hardestKm = ref<number | null>(null)
/** Service id the card asked the map to fly to; the map clears it after the flight. */
const focusService = ref<string | null>(null)
/** `nearby_services` of the open route (from route.json, loaded by the card) for the map markers. */
const nearbyServices = ref<NearbyService[]>([])
/** Routes the list shows after filtering, for the sheet's title row (UI-SPEC 5.0). */
const shownCount = ref(0)

const lang = computed(() => String(route.params.lang))
const defaultLang = computed(() => props.catalog.project.default_language)
const themeId = computed(() => String(route.params.theme))
const theme = computed(() => props.catalog.themes.find((x) => x.id === themeId.value) ?? null)
const openRoute = computed(() => (route.name === 'route' ? String(route.params.id) : null))
const languages = computed(() => availableLanguages(props.catalog.project.languages))

// ---- bottom sheet (UI-SPEC 5.0) ---------------------------------------------------------------

const sheetState = computed<SheetState>({
  get: () => sheetStateFromQuery(route.query),
  set: (next) => void router.replace({ query: sheetQuery(route.query, next) }),
})
/** Peek row: theme name with the shown/total count on the list page, the route name on the route page. */
const sheetTitle = computed(() => {
  const open = props.catalog.routes.find((r) => r.id === openRoute.value)
  if (open) return langText(open.name, lang.value, defaultLang.value)
  const name = theme.value
    ? langText(theme.value.name, lang.value, defaultLang.value)
    : t('theme.all')
  const total = theme.value
    ? filterRoutesByTheme(props.catalog.routes, theme.value.id).length
    : props.catalog.routes.length
  return `${name} · ${t('route.shown', { shown: shownCount.value, total })}`
})
/** Map area hidden under the sheet, so that the map fits routes above it (MapView padding). */
const mapInsetBottom = computed(() =>
  mobile.value ? Math.round(sheetInset(sheetState.value, window.innerHeight)) : 0,
)
/** The sidebar element: the bottom sheet below 700 px, a plain aside above. */
const sidebarProps = computed(() =>
  mobile.value
    ? {
        state: sheetState.value,
        title: sheetTitle.value,
        'onUpdate:state': (next: SheetState) => (sheetState.value = next),
      }
    : { class: 'sidebar' },
)

watch(theme, (next) => applyTheme(next), { immediate: true })
watch(themeId, () => (highlighted.value = null))
watch(openRoute, () => {
  cursorKm.value = null
  hardestKm.value = null
  focusService.value = null
  nearbyServices.value = []
})
</script>

<template>
  <div class="page">
    <header class="header">
      <SiteBrand :catalog="catalog" :lang="lang" :selected="theme?.id" />
      <ThemeSwitcher
        :themes="themesInOrder"
        :current="themeId"
        :lang="lang"
        :default-lang="defaultLang"
      />
      <div class="right">
        <LanguageSwitch :languages="languages" :current="lang" />
      </div>
    </header>
    <div class="body" :class="{ 'route-open': openRoute }">
      <main class="map" :aria-label="t('app.map')">
        <MapView
          v-model:highlighted-route="highlighted"
          v-model:cursor-km="cursorKm"
          v-model:hardest-km="hardestKm"
          v-model:focus-service="focusService"
          :catalog="catalog"
          :theme="theme"
          :open-route="openRoute"
          :nearby-services="nearbyServices"
          :inset-bottom="mapInsetBottom"
          :lang="lang"
        />
      </main>
      <component
        :is="mobile ? BottomSheet : 'aside'"
        v-bind="sidebarProps"
        :aria-label="t('app.routes')"
      >
        <div class="sidebar-content">
          <RouterView v-slot="{ Component }">
            <component
              :is="Component"
              v-model:highlighted-route="highlighted"
              v-model:cursor-km="cursorKm"
              v-model:hardest-km="hardestKm"
              v-model:focus-service="focusService"
              v-model:nearby-services="nearbyServices"
              v-model:shown-count="shownCount"
              :catalog="catalog"
              :theme="theme"
              :lang="lang"
            />
          </RouterView>
        </div>
      </component>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}
.header {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--gap-22);
  height: var(--header-height);
  padding: 0 20px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border-card);
  /* Theme identity (UI-SPEC 1.1): the card surface tinted with the theme primary at 10 %. */
  background-color: var(--surface-card);
  background-image: linear-gradient(var(--theme-primary-10), var(--theme-primary-10));
}
.right {
  display: flex;
  align-items: center;
  gap: var(--gap-12);
  margin-left: auto;
}
.body {
  flex: 1;
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 0;
}
.sidebar {
  order: -1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--surface-page);
  border-top: 4px solid var(--theme-primary); /* sidebar header stripe (UI-SPEC 1.1) */
  border-right: 1px solid var(--border-card);
}
.body.route-open {
  --sidebar-width: var(--sidebar-width-route);
}
.sidebar .sidebar-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.map {
  min-height: 0;
  min-width: 0;
}
/* Below 700 px the map fills the body and the sidebar content is the bottom sheet (UI-SPEC 5.0). */
@media (max-width: 699px) {
  .page {
    overflow: hidden;
  }
  .header {
    gap: var(--gap-10);
    height: 56px;
    padding: 0 14px;
  }
  .body {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
