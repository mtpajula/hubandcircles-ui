<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { filterRoutesByTheme } from '../data/routes'
import { langText } from '../i18n/language'
import type { Catalog, Theme } from '../types/catalog'
import RouteFilters from './RouteFilters.vue'
import RouteListCard from './RouteListCard.vue'

/**
 * Sidebar content of the map page (UI-SPEC 3.2–3.3): filters header and the route list of the
 * current theme (`theme === null` is `all`). The highlighted route is owned by MapPage.
 */
const props = defineProps<{ catalog: Catalog; theme: Theme | null; lang: string }>()
const highlighted = defineModel<string | null>('highlightedRoute', { default: null })
const { t } = useI18n()

const defaultLang = computed(() => props.catalog.project.default_language)
const themeName = computed(() =>
  props.theme ? langText(props.theme.name, props.lang, defaultLang.value) : t('theme.all'),
)
const routes = computed(() =>
  props.theme ? filterRoutesByTheme(props.catalog.routes, props.theme.id) : props.catalog.routes,
)

// Set while the highlight comes from this list (hover/focus) so that only a map click scrolls.
let fromList: string | null = null

function highlight(id: string | null): void {
  fromList = id
  highlighted.value = id
}

// A click on a map line scrolls the list to the card (UI-SPEC 3.3).
watch(highlighted, (id) => {
  if (!id || id === fromList) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document
    .getElementById(`route-${id}`)
    ?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
})
</script>

<template>
  <div class="list-page">
    <!-- V1: shown === total until RouteFilters filters. -->
    <RouteFilters :theme-name="themeName" :shown="routes.length" :total="routes.length" />
    <p v-if="routes.length === 0" class="empty">{{ t('route.none') }}</p>
    <ul v-else class="list">
      <li v-for="r in routes" :id="`route-${r.id}`" :key="r.id">
        <RouteListCard
          :route="r"
          :theme="theme"
          :lang="lang"
          :default-lang="defaultLang"
          :selected="r.id === highlighted"
          :open="false"
          @highlight="highlight"
        />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.empty {
  margin: 0;
  padding: 13px 18px;
  font: var(--text-body);
  color: var(--color-ink-soft);
}
.list {
  list-style: none;
  margin: 0;
  padding: 13px 18px;
  display: grid;
  gap: var(--gap-10);
}
</style>
