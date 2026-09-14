<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import HubLogo from '../components/HubLogo.vue'
import LanguageSwitch from '../components/LanguageSwitch.vue'
import ReportButton from '../components/ReportButton.vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import { useCatalog } from '../composables/useCatalog'
import { availableLanguages } from '../i18n'
import { langText } from '../i18n/language'
import MapView from '../map/MapView.vue'
import { applyTheme } from '../theme'
import type { Catalog } from '../types/catalog'
import type { NearbyService } from '../types/route'

/**
 * Map page (UI-SPEC 3.1): header with logo, theme pills, report button and language switch;
 * sidebar with the route list (RouteList) or the route card (RouteCard); the map fills the rest.
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
/** `nearby_services` of the open route (from route.json, loaded by the card) for the map markers. */
const nearbyServices = ref<NearbyService[]>([])

const lang = computed(() => String(route.params.lang))
const defaultLang = computed(() => props.catalog.project.default_language)
const themeId = computed(() => String(route.params.theme))
const theme = computed(() => props.catalog.themes.find((x) => x.id === themeId.value) ?? null)
const openRoute = computed(() => (route.name === 'route' ? String(route.params.id) : null))
const languages = computed(() => availableLanguages(props.catalog.project.languages))

const projectName = computed(() =>
  langText(props.catalog.project.name, lang.value, defaultLang.value),
)
const projectSubtitle = computed(() =>
  langText(props.catalog.project.subtitle, lang.value, defaultLang.value),
)

watch(theme, (next) => applyTheme(next), { immediate: true })
watch(themeId, () => (highlighted.value = null))
watch(openRoute, () => {
  cursorKm.value = null
  hardestKm.value = null
  nearbyServices.value = []
})
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="brand">
        <HubLogo class="brand-logo" :themes="themesInOrder" :selected="theme?.id" :size="36" />
        <div class="brand-text">
          <span class="brand-name">{{ projectName }}</span>
          <span class="brand-subtitle">{{ projectSubtitle }}</span>
        </div>
      </div>
      <ThemeSwitcher
        :themes="themesInOrder"
        :current="themeId"
        :lang="lang"
        :default-lang="defaultLang"
      />
      <div class="right">
        <ReportButton />
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
  border-bottom: 1px solid var(--color-border);
  background: var(--color-white);
}
.brand {
  display: flex;
  align-items: center;
  gap: var(--gap-10);
  min-width: 0;
}
.brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.brand-name {
  font: 700 16px/1.2 var(--font-family);
  color: var(--color-ink);
  white-space: nowrap;
}
.brand-subtitle {
  font: var(--text-caption);
  color: var(--color-ink-muted);
  white-space: nowrap;
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
  background: var(--color-snow);
  border-right: 1px solid var(--color-border);
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
  .brand-logo,
  .brand-subtitle {
    display: none;
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
    border-top: 1px solid var(--color-border);
  }
  .sidebar-content {
    overflow: visible;
  }
}
</style>
