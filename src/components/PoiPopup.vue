<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ServiceProperties } from '../data/services'
import { formatDate, formatKm } from '../i18n/format'
import { langText } from '../i18n/language'
import ServiceIcon from './ServiceIcon.vue'

/**
 * Popup of a service point on the map (UI-SPEC chapter 6): name (default-language fallback),
 * translated category with the km when the point is on the open route, source with its fetch
 * date and a "Show source" link. Issues add severity and their reporting window. Missing fields
 * are left out (P11).
 */
const props = defineProps<{
  service: ServiceProperties
  km?: number | null
  lang: string
  defaultLang: string
}>()
const emit = defineEmits<{ close: [] }>()
const { t, te } = useI18n()

const category = computed(() => {
  const key = `service.category.${props.service.category}`
  return te(key) ? t(key) : props.service.category
})
const name = computed(() =>
  props.service.name ? langText(props.service.name, props.lang, props.defaultLang) : '',
)
const kmText = computed(() =>
  props.km == null ? '' : t('service.km', { km: formatKm(props.lang, props.km) }),
)
const subtitle = computed(() =>
  [name.value ? category.value : '', kmText.value].filter(Boolean).join(' · '),
)
const description = computed(() =>
  props.service.description
    ? langText(props.service.description, props.lang, props.defaultLang)
    : '',
)
const details = computed(() => {
  const s = props.service
  const rows: { label: string; value: string }[] = []
  if (s.opening_hours) rows.push({ label: t('service.openingHours'), value: s.opening_hours })
  if (s.severity) rows.push({ label: t('service.severity'), value: s.severity })
  if (s.reported_at)
    rows.push({ label: t('service.reportedAt'), value: formatDate(props.lang, s.reported_at) })
  if (s.valid_until)
    rows.push({ label: t('service.validUntil'), value: formatDate(props.lang, s.valid_until) })
  return rows
})
const source = computed(() => {
  const key = `service.sourceName.${props.service.source}`
  const line = t('service.source', { source: te(key) ? t(key) : props.service.source })
  const fetched = props.service.fetched_at
  return fetched
    ? `${line} · ${t('service.fetched', { date: formatDate(props.lang, fetched) })}`
    : line
})
</script>

<template>
  <div class="popup" role="dialog" :aria-label="name || category">
    <div class="head">
      <ServiceIcon :category="service.category" :size="24" />
      <div class="titles">
        <span class="name">{{ name || category }}</span>
        <span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
      </div>
      <button type="button" class="close" :aria-label="t('service.close')" @click="emit('close')">
        ×
      </button>
    </div>
    <p v-if="description" class="description">{{ description }}</p>
    <dl v-if="details.length" class="details">
      <template v-for="row in details" :key="row.label">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </template>
    </dl>
    <p class="source">{{ source }}</p>
    <a v-if="service.url" class="link" :href="service.url" target="_blank" rel="noopener">
      {{ t('service.showSource') }}
    </a>
  </div>
</template>

<style scoped>
.popup {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
  width: 240px;
  max-width: calc(100vw - 28px);
  box-sizing: border-box;
  padding: 11px 13px;
  background: var(--surface-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-card);
  color: var(--text-strong);
  text-align: left;
}
.head {
  display: flex;
  align-items: flex-start;
  gap: var(--gap-9);
}
.titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.name {
  font: 700 14px/1.25 var(--font-family);
  overflow-wrap: anywhere;
}
.subtitle {
  font: var(--text-caption-lg);
  color: var(--text-muted);
}
.close {
  flex: none;
  width: 28px;
  height: 28px;
  margin: -6px -8px 0 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--text-muted);
  font: 400 20px/1 var(--font-family);
  cursor: pointer;
}
.close:hover {
  background: var(--surface-inset);
}
.description {
  margin: 0;
  font: 400 13px/1.5 var(--font-family);
  color: var(--text-prose);
}
.details {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px var(--gap-8);
  margin: 0;
  font: var(--text-caption-lg);
}
.details dt {
  color: var(--text-muted);
}
.details dd {
  margin: 0;
  color: var(--text-soft);
}
.source {
  margin: 0;
  font: var(--text-caption);
  color: var(--text-muted);
}
.link {
  font: 600 12px/1.2 var(--font-family);
  color: var(--color-river);
}
</style>
