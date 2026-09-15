<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { applyFilters, filterQuery, parseFilterQuery, type FilterModel } from '../data/filters'
import { presentationOf } from '../data/presentation'
import { filterRoutesByTheme } from '../data/routes'
import { langText } from '../i18n/language'
import type { Catalog, Theme } from '../types/catalog'
import RouteFilters from './RouteFilters.vue'
import RouteListCard from './RouteListCard.vue'

/**
 * Sidebar content of the map page (UI-SPEC 3.2–3.3): filters and the route list of the current
 * theme (`theme === null` is `all`). The filter state lives in the query string so that a
 * filtered list is shareable; the highlighted route is owned by MapPage.
 */
defineOptions({ inheritAttrs: false })
const props = defineProps<{ catalog: Catalog; theme: Theme | null; lang: string }>()
const highlighted = defineModel<string | null>('highlightedRoute', { default: null })
/** Number of routes after filtering, for the mobile sheet's title row (UI-SPEC 5.0). */
const shownCount = defineModel<number>('shownCount', { default: 0 })
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const defaultLang = computed(() => props.catalog.project.default_language)
const themeName = computed(() =>
  props.theme ? langText(props.theme.name, props.lang, defaultLang.value) : t('theme.all'),
)
const routes = computed(() =>
  props.theme ? filterRoutesByTheme(props.catalog.routes, props.theme.id) : props.catalog.routes,
)
const filters = computed(() => presentationOf(props.theme).filters)
const model = computed<FilterModel>({
  get: () => parseFilterQuery(route.query, filters.value),
  set: (next) => void router.replace({ query: filterQuery(next) }),
})
const shown = computed(() => applyFilters(routes.value, filters.value, model.value))
watch(shown, (list) => (shownCount.value = list.length), { immediate: true })

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
    <RouteFilters
      v-model="model"
      :theme-name="themeName"
      :shown="shown.length"
      :total="routes.length"
      :filters="filters"
      :routes="routes"
      :lang="lang"
    />
    <p v-if="shown.length === 0" class="empty">{{ t('route.none') }}</p>
    <ul v-else class="list">
      <li v-for="r in shown" :id="`route-${r.id}`" :key="r.id">
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
  color: var(--text-soft);
}
.list {
  list-style: none;
  margin: 0;
  padding: 13px 18px;
  display: grid;
  gap: var(--gap-10);
}
</style>
