<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute, type RouteLocationRaw } from 'vue-router'

/**
 * FI | EN segment (UI-SPEC 3.1). Links keep the current theme and route in the URL. The landing
 * page has no language in its path, so there the choice travels as `#/?lang=`. The `dark`
 * variant is the hero header style (UI-SPEC 2.1).
 */
withDefaults(
  defineProps<{ languages: readonly string[]; current: string; variant?: 'light' | 'dark' }>(),
  { variant: 'light' },
)
const { t } = useI18n()
const route = useRoute()

function target(lang: string): RouteLocationRaw {
  return route.name === 'landing'
    ? { name: 'landing', query: { lang } }
    : { name: route.name ?? 'theme', params: { ...route.params, lang } }
}
</script>

<template>
  <nav class="segment" :class="{ dark: variant === 'dark' }" :aria-label="t('lang.select')">
    <RouterLink
      v-for="l in languages"
      :key="l"
      class="option"
      :to="target(l)"
      :aria-current="l === current ? 'page' : undefined"
      :lang="l"
      :title="t(`lang.${l}`)"
      >{{ l.toUpperCase() }}</RouterLink
    >
  </nav>
</template>

<style scoped>
.segment {
  display: inline-flex;
  height: 36px;
  padding: 2px;
  box-sizing: border-box;
  border: 1.5px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-white);
}
.option {
  display: inline-flex;
  align-items: center;
  padding: 0 11px;
  border-radius: 16px;
  color: var(--color-ink-soft);
  font: var(--text-button);
  text-decoration: none;
}
.option[aria-current='page'] {
  background: var(--color-ink);
  color: var(--color-white);
  font: var(--text-button-strong);
}

/* Dark variant: on the hero (UI-SPEC 2.1: 38 h, active filled on-night, text night). */
.dark {
  height: 38px;
  border-color: var(--hero-pill-border);
  border-radius: 19px;
  background: transparent;
}
.dark .option {
  color: var(--color-on-night);
  font-size: 14px;
  border-radius: 17px;
}
.dark .option[aria-current='page'] {
  background: var(--color-on-night);
  color: var(--color-night);
}
@media (max-width: 699px) {
  .dark {
    height: 32px;
    border-radius: 16px;
  }
  .dark .option {
    padding: 0 10px;
    border-radius: 14px;
  }
}
</style>
