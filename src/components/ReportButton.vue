<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/**
 * Issue report entry point (UI-SPEC 3.1). Placeholder in V1: the pill and its hint are shown so
 * the header layout is final; the report flow (location pick, preview, GitHub form) comes with
 * the feedback feature. The button is disabled until then.
 */
const { t } = useI18n()
</script>

<template>
  <span class="report">
    <button type="button" class="pill" disabled>{{ t('report.button') }}</button>
    <span class="hint">{{ t('report.requiresGithub') }}</span>
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
.hint {
  color: var(--color-ink-muted);
  font: var(--text-caption);
  white-space: nowrap;
}
@media (max-width: 899px) {
  .hint {
    display: none;
  }
}
</style>
