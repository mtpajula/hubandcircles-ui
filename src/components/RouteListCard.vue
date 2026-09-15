<script setup lang="ts">
import { computed } from 'vue'
import { ALL_THEMES } from '../data/identifiers'
import { dataPath } from '../data/paths'
import { summaryImage } from '../data/media'
import { presentationOf } from '../data/presentation'
import { langText } from '../i18n/language'
import type { RouteSummary, Theme } from '../types/catalog'
import KeyFigures from './KeyFigures.vue'
import MaintenanceNotice from './MaintenanceNotice.vue'

/**
 * One route in the sidebar list (UI-SPEC 3.3). The whole card is a link to the route card;
 * hover and focus highlight the line on the map through the `highlight` event.
 */
const props = defineProps<{
  route: RouteSummary
  /** Current theme; `null` is `all` and shows the default key figures (18.2.12). */
  theme: Theme | null
  lang: string
  defaultLang: string
  /** Highlighted on the map (hover, focus or line click). */
  selected: boolean
  /** The route card of this route is open. */
  open: boolean
}>()
const emit = defineEmits<{ highlight: [id: string | null] }>()
const themeId = computed(() => props.theme?.id ?? ALL_THEMES)
const figures = computed(() => presentationOf(props.theme).key_figures)
const image = computed(() => summaryImage(props.route, presentationOf(props.theme).hero_image))

function highlight(): void {
  emit('highlight', props.route.id)
}
function clear(): void {
  emit('highlight', null)
}
</script>

<template>
  <RouterLink
    class="card"
    :class="{ selected }"
    :to="{ name: 'route', params: { lang, theme: themeId, id: route.id } }"
    :aria-current="open ? 'page' : undefined"
    @mouseenter="highlight"
    @mouseleave="clear"
    @focusin="highlight"
    @focusout="clear"
  >
    <img
      v-if="image"
      class="image"
      :src="dataPath(image)"
      alt=""
      loading="lazy"
      width="88"
      height="66"
    />
    <span v-else class="image placeholder" aria-hidden="true"></span>
    <span class="column">
      <span class="title">
        {{ langText(route.name, lang, defaultLang) }}
        <MaintenanceNotice :route="route" variant="pill" />
      </span>
      <KeyFigures :figures="figures" :route="route" :lang="lang" :limit="3" compact />
    </span>
  </RouterLink>
</template>

<style scoped>
.card {
  display: flex;
  gap: var(--gap-12);
  padding: 12px;
  border: 1px solid var(--border-card);
  border-left: 4px solid var(--theme-route-other);
  border-radius: var(--radius-card);
  background: var(--surface-card);
  color: inherit;
  text-decoration: none;
}
.card.selected {
  border-color: var(--theme-primary);
  box-shadow: var(--theme-shadow);
}
.image {
  flex: none;
  width: 88px;
  height: 66px;
  border-radius: var(--radius-image);
  object-fit: cover;
}
.placeholder {
  display: block;
  background: var(--surface-placeholder);
}
.column {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
  min-width: 0;
  flex: 1;
}
.title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gap-6) var(--gap-8);
  font: var(--text-card-title);
  color: var(--text-strong);
}
</style>
