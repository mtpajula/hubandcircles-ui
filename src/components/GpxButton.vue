<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatBytes } from '../i18n/format'

/**
 * "Download GPX" filled theme pill with the file size from `gpx_bytes` (UI-SPEC 4.1). Renders
 * nothing without a file (P11). The file is fetched only when the user clicks (SKILL: first load).
 */
defineProps<{ href: string | null | undefined; bytes: number | null | undefined; lang: string }>()
const { t } = useI18n()
</script>

<template>
  <a v-if="href" class="gpx" :href="href" download>
    <span class="label">{{ t('route.downloadGpx') }}</span>
    <span v-if="bytes" class="size">{{ formatBytes(lang, bytes) }}</span>
  </a>
</template>

<style scoped>
.gpx {
  display: inline-flex;
  align-items: baseline;
  gap: var(--gap-7);
  height: 38px;
  padding: 0 16px;
  border-radius: 19px;
  background: var(--theme-primary);
  color: var(--color-white);
  font: 600 14px/38px var(--font-family);
  text-decoration: none;
  white-space: nowrap;
}
.size {
  font: 400 11px/38px var(--font-family);
  opacity: 0.8;
}
</style>
