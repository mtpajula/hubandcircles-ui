<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatKm } from '../i18n/format'
import type { ServiceGap } from '../types/route'

/**
 * "Longest gap without services" box (UI-SPEC 4.2 item 7): below the services block on desktop,
 * a block of its own before the buttons on the mobile card (UI-SPEC 5.1). Renders nothing without
 * a gap (P11).
 */
const props = defineProps<{ gap: ServiceGap | null; lang: string }>()
const { t } = useI18n()
const km = (value: number) => formatKm(props.lang, value)
</script>

<template>
  <div v-if="gap" class="gap">
    <span class="gap-title">{{ t('service.gapTitle') }}</span>
    <span class="gap-value">{{ t('route.length', { km: km(gap.km) }) }}</span>
    <span class="gap-range">
      {{ t('service.gapRange', { start: km(gap.start_km), end: km(gap.end_km) }) }}
    </span>
  </div>
</template>

<style scoped>
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
