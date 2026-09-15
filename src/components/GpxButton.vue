<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatBytes } from '../i18n/format'

/**
 * "Download GPX" filled theme pill with the file size from `gpx_bytes` (UI-SPEC 4.1). Renders
 * nothing without a file (P11). The file is fetched only when the user clicks (SKILL: first load).
 * `variant: 'outline'` is the 52 px outline pill of the mobile card (UI-SPEC 5.1).
 */
withDefaults(
  defineProps<{
    href: string | null | undefined
    bytes: number | null | undefined
    lang: string
    variant?: 'filled' | 'outline'
  }>(),
  { variant: 'filled' },
)
const { t } = useI18n()
</script>

<template>
  <a v-if="href" class="gpx" :class="variant" :href="href" download>
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
.outline {
  justify-content: center;
  height: 52px;
  padding: 0 20px;
  border: 1.5px solid var(--theme-primary);
  border-radius: 26px;
  box-sizing: border-box;
  background: none;
  color: var(--theme-accent);
  font: 600 15px/49px var(--font-family);
}
.outline .size {
  line-height: 49px;
}
</style>
