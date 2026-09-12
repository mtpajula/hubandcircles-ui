<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { dataPath } from '../data/paths'
import { formatKm, formatM } from '../i18n/format'
import { langText } from '../i18n/language'
import type { RouteSummary } from '../types/catalog'

/**
 * One route in the sidebar list (UI-SPEC 3.3). The whole card is a link to the route card;
 * hover and focus highlight the line on the map through the `highlight` event.
 */
const props = defineProps<{
  route: RouteSummary
  themeId: string
  lang: string
  defaultLang: string
  /** Highlighted on the map (hover, focus or line click). */
  selected: boolean
  /** The route card of this route is open. */
  open: boolean
}>()
const emit = defineEmits<{ highlight: [id: string | null] }>()
const { t } = useI18n()

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
      v-if="route.cover_image"
      class="image"
      :src="dataPath(route.cover_image)"
      alt=""
      loading="lazy"
      width="88"
      height="66"
    />
    <span v-else class="image placeholder" aria-hidden="true"></span>
    <span class="column">
      <span class="title">
        {{ langText(route.name, lang, defaultLang) }}
        <!-- V2: MaintenanceNotice pill -->
      </span>
      <span class="figures">
        <span class="figure">
          <span class="label">{{ t('route.lengthLabel') }}</span>
          <span class="value">{{
            t('route.length', { km: formatKm(lang, route.length_km) })
          }}</span>
        </span>
        <span v-if="route.ascent_m != null" class="figure">
          <span class="label">{{ t('route.ascentLabel') }}</span>
          <span class="value">{{ t('route.ascent', { m: formatM(lang, route.ascent_m) }) }}</span>
        </span>
      </span>
      <!-- V2: third key figure (e.g. ShareBar) -->
    </span>
  </RouterLink>
</template>

<style scoped>
.card {
  display: flex;
  gap: var(--gap-12);
  padding: 12px;
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--theme-route-other);
  border-radius: var(--radius-card);
  background: var(--color-white);
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
  background: var(--color-border-soft);
}
.column {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
  min-width: 0;
  flex: 1;
}
.title {
  font: var(--text-card-title);
  color: var(--color-ink);
}
.figures {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-8);
}
.figure {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.label {
  font: var(--text-caption);
  color: var(--color-ink-muted);
}
.value {
  font: 700 14px/1.2 var(--font-family);
  color: var(--color-ink);
}
</style>
