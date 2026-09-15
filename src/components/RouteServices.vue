<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NearbyEntry } from '../data/services'
import { formatKm } from '../i18n/format'
import { langText } from '../i18n/language'
import type { ServiceGap } from '../types/route'
import ServiceIcon from './ServiceIcon.vue'

/**
 * Services block of the route card (UI-SPEC 4.2 item 7): caption from the theme's priority
 * categories, one row per nearby service in the order of `nearbyOrdered`, and the theme's longest
 * gap without services below. A row click moves the band cursor (and the map marker) to the km
 * and asks the map to fly to the service (`focus` with the service id, UI-SPEC 3.4).
 */
const props = defineProps<{
  entries: readonly NearbyEntry[]
  categoriesFirst: readonly string[]
  gap: ServiceGap | null
  lang: string
  defaultLang: string
}>()
const cursorKm = defineModel<number | null>('cursorKm', { default: null })
const emit = defineEmits<{ focus: [id: string] }>()
const { t, te } = useI18n()

function category(id: string): string {
  const key = `service.category.${id}`
  return te(key) ? t(key) : id
}
const caption = computed(() => {
  const names = props.categoriesFirst.map(category)
  if (names.length === 0) return ''
  const last = names[names.length - 1]!
  const head = names.slice(0, -1).join(', ')
  return t('service.caption', { names: head ? `${head} ${t('service.and')} ${last}` : last })
})
const rows = computed(() =>
  props.entries.map((e) => ({
    id: e.id,
    km: e.km,
    category: e.feature.properties.category,
    name: e.feature.properties.name
      ? langText(e.feature.properties.name, props.lang, props.defaultLang)
      : category(e.feature.properties.category),
    kmText: t('service.km', { km: formatKm(props.lang, e.km) }),
  })),
)
const km = (value: number) => formatKm(props.lang, value)
function show(row: { id: string; km: number }) {
  cursorKm.value = row.km
  emit('focus', row.id)
}
</script>

<template>
  <section v-if="rows.length || gap" class="block">
    <h2 class="eyebrow">{{ t('service.title') }}</h2>
    <p v-if="caption" class="caption">{{ caption }}</p>
    <ul v-if="rows.length" class="rows">
      <li v-for="row in rows" :key="row.id">
        <button
          type="button"
          class="row"
          :aria-label="t('service.marker', { name: row.name, km: km(row.km) })"
          @click="show(row)"
        >
          <ServiceIcon :category="row.category" :size="22" />
          <span class="name">{{ row.name }}</span>
          <span class="km">{{ row.kmText }}</span>
        </button>
      </li>
    </ul>
    <div v-if="gap" class="gap">
      <span class="gap-title">{{ t('service.gapTitle') }}</span>
      <span class="gap-value">{{ t('route.length', { km: km(gap.km) }) }}</span>
      <span class="gap-range">
        {{ t('service.gapRange', { start: km(gap.start_km), end: km(gap.end_km) }) }}
      </span>
    </div>
  </section>
</template>

<style scoped>
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
  color: var(--text-muted);
}
.caption {
  margin: -4px 0 0;
  font: var(--text-caption-lg);
  color: var(--text-muted);
}
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--gap-6);
}
.row {
  display: flex;
  align-items: center;
  gap: var(--gap-9);
  width: 100%;
  min-height: 44px;
  padding: 9px 11px;
  box-sizing: border-box;
  border: 1px solid var(--border-card);
  border-radius: var(--radius-box);
  background: var(--surface-card);
  color: var(--text-strong);
  text-align: left;
  cursor: pointer;
}
.row:hover,
.row:focus-visible {
  border-color: var(--theme-primary);
}
.name {
  flex: 1;
  min-width: 0;
  font: 400 14px/1.3 var(--font-family);
  overflow-wrap: anywhere;
}
.km {
  flex: none;
  font: var(--text-caption-lg);
  color: var(--text-muted);
}
.gap {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--gap-4) var(--gap-9);
  padding: 10px 12px;
  border-radius: var(--radius-box);
  background: var(--surface-inset);
}
.gap-title {
  font: 400 13px/1.3 var(--font-family);
  color: var(--text-soft);
}
.gap-value {
  font: 700 15px/1.2 var(--font-family);
  color: var(--text-strong);
}
.gap-range {
  font: var(--text-caption-lg);
  color: var(--text-muted);
}
</style>
