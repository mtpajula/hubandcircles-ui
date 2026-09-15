<script setup lang="ts">
// ponytail: unused since AP39
import { useI18n } from 'vue-i18n'

/**
 * Issue report entry point. Not rendered anywhere since the public feedback channel was dropped
 * (ARKKITEHTUURI AP39, 15.9.2026); kept in case the decision is revisited.
 */
const { t } = useI18n()
</script>

<template>
  <span class="report">
    <button type="button" class="pill" disabled>{{ t('report.button') }}</button>
  </span>
</template>

<style scoped>
.report {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-8);
}
.pill {
  height: 36px;
  padding: 0 14px;
  border: 1.5px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-white);
  color: var(--color-ink-soft);
  font: var(--text-button);
  white-space: nowrap;
}
.pill:disabled {
  opacity: 0.6;
}
</style>
