<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/**
 * Filters block (UI-SPEC 3.2). V1: only the header row; the filter groups from
 * `theme.presentation.filters`, the "ei tietoa" chips and the info box come with the filter data.
 */
defineProps<{ themeName: string; shown: number; total: number }>()
const { t } = useI18n()
</script>

<template>
  <div class="filters">
    <div class="header">
      <h1 class="theme-name">{{ themeName }}</h1>
      <span class="count">{{ t('route.shown', { shown, total }) }}</span>
    </div>
    <!-- V2: filter groups (length, dominant_surface, itrs_technical, …) and the info box -->
  </div>
</template>

<style scoped>
.filters {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 15px 18px 13px;
  background: var(--color-snow);
  border-bottom: 1px solid var(--color-border);
}
.header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--gap-10);
}
.theme-name {
  margin: 0;
  font: 700 17px/1.2 var(--font-family);
  color: var(--color-ink);
}
.count {
  font: 400 13px/1.2 var(--font-family);
  color: var(--color-ink-muted);
  white-space: nowrap;
}
</style>
