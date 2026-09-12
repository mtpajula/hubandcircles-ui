<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { langText } from '../i18n/language'
import type { Theme } from '../types/catalog'
import HubLogo from './HubLogo.vue'

/**
 * Theme pills (UI-SPEC 3.1). Each pill is a link to `#/<lang>/<theme>/`, so `aria-current`
 * marks the active one. Below 700 px the row collapses to the logo, which opens a plain list.
 * `current` is a theme id or `all` (nothing active).
 */
const props = defineProps<{
  themes: readonly Theme[]
  current: string
  lang: string
  defaultLang: string
}>()
const { t } = useI18n()
const route = useRoute()

const inOrder = computed(() => [...props.themes].sort((a, b) => a.order - b.order))
const selected = computed(() =>
  props.themes.some((x) => x.id === props.current) ? props.current : null,
)
const open = ref(false)

// Navigating closes the mobile list.
watch(
  () => route.fullPath,
  () => (open.value = false),
)

function name(theme: Theme): string {
  return langText(theme.name, props.lang, props.defaultLang)
}
</script>

<template>
  <nav class="switcher" :aria-label="t('theme.select')">
    <ul class="pills">
      <li v-for="theme in inOrder" :key="theme.id">
        <RouterLink
          class="pill"
          :class="{ active: theme.id === selected }"
          :to="{ name: 'theme', params: { lang, theme: theme.id } }"
          :aria-current="theme.id === selected ? 'page' : undefined"
          :style="{ '--pill-color': theme.colors.primary }"
        >
          <span class="dot" aria-hidden="true"></span>
          {{ name(theme) }}
        </RouterLink>
      </li>
    </ul>

    <div class="compact">
      <button
        type="button"
        class="toggle"
        :aria-expanded="open"
        :aria-label="t('theme.select')"
        @click="open = !open"
      >
        <HubLogo :themes="themes" :selected="selected" :size="36" />
      </button>
      <ul v-if="open" class="sheet">
        <li v-for="theme in inOrder" :key="theme.id">
          <RouterLink
            class="row"
            :to="{ name: 'theme', params: { lang, theme: theme.id } }"
            :aria-current="theme.id === selected ? 'page' : undefined"
            :style="{ '--pill-color': theme.colors.primary }"
          >
            <span class="dot" aria-hidden="true"></span>
            {{ name(theme) }}
          </RouterLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.switcher {
  position: relative;
  min-width: 0;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-7);
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-7);
  height: 36px;
  padding: 0 13px 0 10px;
  box-sizing: border-box;
  border: 1.5px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-white);
  color: var(--color-ink-soft);
  font: var(--text-button);
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color var(--motion-fast),
    border-color var(--motion-fast);
}
.pill:hover {
  border-color: var(--pill-color);
}
.pill.active {
  background: var(--theme-primary-10);
  border-color: var(--pill-color);
  color: var(--pill-color);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--pill-color);
  flex: none;
}
.compact {
  display: none;
}
.toggle {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 22px;
  background: transparent;
  cursor: pointer;
}
.sheet {
  position: absolute;
  top: calc(100% + var(--gap-4));
  left: 0;
  z-index: 20;
  min-width: 220px;
  padding: var(--gap-6);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-card);
}
.row {
  display: flex;
  align-items: center;
  gap: var(--gap-10);
  min-height: 44px;
  padding: 0 var(--gap-12);
  border-radius: var(--radius-box);
  color: var(--color-ink-soft);
  font: var(--text-button);
  text-decoration: none;
}
.row[aria-current='page'] {
  background: var(--theme-primary-10);
  color: var(--pill-color);
}
@media (max-width: 699px) {
  .pills {
    display: none;
  }
  .compact {
    display: block;
  }
}
</style>
