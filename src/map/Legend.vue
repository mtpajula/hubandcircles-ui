<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ServiceIcon from '../components/ServiceIcon.vue'
import { presentationOf } from '../data/presentation'
import type { Theme } from '../types/catalog'

/**
 * "On the map" legend box (UI-SPEC 3.4): selected route, other routes, topo coverage boundary,
 * divider, the theme's priority service categories (the first one labelled as such) and the
 * issue marker. Swatch colors come from the --theme-* variables, so the box follows the theme.
 */
const props = defineProps<{ theme: Theme | null }>()
const { t, te } = useI18n()

const categories = computed(() =>
  presentationOf(props.theme).service_categories_first.map((id, i) => {
    const key = `service.category.${id}`
    const label = te(key) ? t(key) : id
    return { id, label: i === 0 ? `${label} · ${t('map.legendPrimary')}` : label }
  }),
)
</script>

<template>
  <div class="legend">
    <h2 class="title">{{ t('map.legendTitle') }}</h2>
    <ul class="rows">
      <li class="row">
        <span class="swatch selected" aria-hidden="true"></span>{{ t('map.legendSelected') }}
      </li>
      <li class="row">
        <span class="swatch other" aria-hidden="true"></span>{{ t('map.legendOthers') }}
      </li>
      <li class="row">
        <span class="swatch coverage" aria-hidden="true"></span>{{ t('map.legendCoverage') }}
      </li>
      <li class="divider" role="separator"></li>
      <li v-for="c in categories" :key="c.id" class="row">
        <ServiceIcon class="category" :category="c.id" :size="16" />{{ c.label }}
      </li>
      <li class="row"><span class="issue" aria-hidden="true">!</span>{{ t('map.legendIssue') }}</li>
    </ul>
  </div>
</template>

<style scoped>
.legend {
  width: 236px;
  max-width: calc(100vw - 28px);
  box-sizing: border-box;
  padding: 11px 13px;
  background: var(--color-white-92);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  color: var(--color-ink);
}
.title {
  margin: 0 0 var(--gap-8);
  font: 700 13px/1.2 var(--font-family);
}
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--gap-6);
}
.row {
  display: flex;
  align-items: center;
  gap: var(--gap-9);
  font: var(--text-caption-lg);
  color: var(--color-ink-soft);
}
.swatch {
  flex: none;
  width: 22px;
  border-radius: 3px;
}
.swatch.selected {
  height: 5px;
  background: var(--theme-route);
}
.swatch.other {
  height: 4px;
  background: var(--theme-route-other);
}
.swatch.coverage {
  height: 0;
  border-top: 1.5px dashed var(--color-ink);
  opacity: 0.35;
  border-radius: 0;
}
.divider {
  height: 0;
  border-top: 1px solid var(--color-border-soft);
  margin: var(--gap-4) 0;
}
.category {
  margin: 0 3px;
}
.issue {
  flex: none;
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  margin-left: 3px;
  margin-right: 3px;
  border-radius: 50%;
  background: var(--color-white);
  border: 2px solid var(--color-midnight-sun);
  color: var(--color-notice-icon);
  font: 700 10px/1 var(--font-family);
}
</style>
