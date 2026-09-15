<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import LanguageSwitch from '../components/LanguageSwitch.vue'
import SiteBrand from '../components/SiteBrand.vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import { useCatalog } from '../composables/useCatalog'
import { availableLanguages } from '../i18n'
import MapView from '../map/MapView.vue'
import { applyTheme } from '../theme'
import type { Catalog } from '../types/catalog'
import type { NearbyService } from '../types/route'

/**
 * Map page (UI-SPEC 3.1): header with the brand link, theme pills and language switch (no
 * report button since AP39); sidebar with the route list (RouteList) or the route card (RouteCard); the map fills the rest.
 * The sidebar widens to 560 px when a route is open (UI-SPEC 4.2). This page owns the
 * highlighted route and passes it to the list and the map as props/v-model.
 */
const props = defineProps<{ catalog: Catalog }>()
const { t } = useI18n()
const route = useRoute()
const { themesInOrder } = useCatalog()
/** Route highlighted on the map: list hover/focus or a click on a line (UI-SPEC 3.3). */
const highlighted = ref<string | null>(null)
/** Band cursor and hardest-section km of the open route, shared by the card and the map. */
const cursorKm = ref<number | null>(null)
const hardestKm = ref<number | null>(null)
/** Service id the card asked the map to fly to; the map clears it after the flight. */
const focusService = ref<string | null>(null)
/** `nearby_services` of the open route (from route.json, loaded by the card) for the map markers. */
const nearbyServices = ref<NearbyService[]>([])

const lang = computed(() => String(route.params.lang))
const defaultLang = computed(() => props.catalog.project.default_language)
const themeId = computed(() => String(route.params.theme))
const theme = computed(() => props.catalog.themes.find((x) => x.id === themeId.value) ?? null)
const openRoute = computed(() => (route.name === 'route' ? String(route.params.id) : null))
const languages = computed(() => availableLanguages(props.catalog.project.languages))

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
      <aside class="sidebar" :aria-label="t('app.routes')">
        <div class="sidebar-content">
          <RouterView v-slot="{ Component }">
            <component
              :is="Component"
              v-model:highlighted-route="highlighted"
              v-model:cursor-km="cursorKm"
              v-model:hardest-km="hardestKm"
              v-model:focus-service="focusService"
              v-model:nearby-services="nearbyServices"
              :catalog="catalog"
              :theme="theme"
              :lang="lang"
            />
          </RouterView>
        </div>
      </aside>
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
          :lang="lang"
        />
      </main>
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
.sidebar-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.map {
  min-height: 0;
  min-width: 0;
}
@media (max-width: 699px) {
  .page {
    height: auto;
    min-height: 100dvh;
  }
  .header {
    gap: var(--gap-10);
    padding: 0 14px;
  }
  .body {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: var(--map-strip-height) auto;
  }
  .map {
    order: -1;
  }
  .sidebar {
    border-right: 0;
  }
  .sidebar-content {
    overflow: visible;
  }
}
</style>
