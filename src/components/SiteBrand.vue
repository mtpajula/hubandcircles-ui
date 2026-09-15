<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { langText } from '../i18n/language'
import type { Catalog } from '../types/catalog'
import HubLogo from './HubLogo.vue'

/**
 * Header brand of the map and statement pages (UI-SPEC 2.1, 3.1): 36 px light logo + name and
 * subtitle, the whole block a link to the landing page. The landing page has no language in its
 * path, so the current language travels as `?lang=`.
 */
const props = defineProps<{ catalog: Catalog; lang: string; selected?: string }>()
const { t } = useI18n()

const defaultLang = computed(() => props.catalog.project.default_language)
const name = computed(() => langText(props.catalog.project.name, props.lang, defaultLang.value))
const subtitle = computed(() =>
  langText(props.catalog.project.subtitle, props.lang, defaultLang.value),
)
</script>

<template>
  <RouterLink class="brand" :to="{ name: 'landing', query: { lang } }" :aria-label="t('nav.home')">
    <HubLogo class="brand-logo" :themes="catalog.themes" :selected="selected" :size="36" />
    <span class="brand-text">
      <span class="brand-name">{{ name }}</span>
      <span class="brand-subtitle">{{ subtitle }}</span>
    </span>
  </RouterLink>
</template>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: var(--gap-10);
  min-width: 0;
  min-height: 44px;
  color: inherit;
  text-decoration: none;
}
.brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.brand-name {
  font: 700 16px/1.2 var(--font-family);
  color: var(--text-strong);
  white-space: nowrap;
}
.brand-subtitle {
  font: var(--text-caption);
  color: var(--text-muted);
  white-space: nowrap;
}
@media (max-width: 699px) {
  .brand-logo,
  .brand-subtitle {
    display: none;
  }
}
</style>
