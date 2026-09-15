<script setup lang="ts">
import { computed } from 'vue'
import { HUB_RADIUS, OUTER_RADIUS, ringGeometry } from '../data/logo'
import type { Theme } from '../types/catalog'

/**
 * The hub-and-circles mark (ARKKITEHTUURI.md 10.2-10.3, UI-SPEC chapter 6): a hub, one open arc
 * per theme in `order` from the inside out, and a dashed outer circle. Drawn from the catalog, so
 * a new theme adds a ring by itself. Decorative: the name next to it carries the meaning.
 */
const props = withDefaults(
  defineProps<{
    themes: readonly Theme[]
    selected?: string | null
    variant?: 'light' | 'dark'
    size?: number
  }>(),
  { selected: null, variant: 'light', size: 36 },
)

const rings = computed(() => ringGeometry(props.themes, props.selected))
const dark = computed(() => props.variant === 'dark')

function ringStroke(index: number, primary: string): string {
  return dark.value ? `var(--logo-tint-${index})` : primary
}
function ringOpacity(selected: boolean): number {
  if (dark.value || !props.selected) return 1
  return selected ? 1 : 0.3
}
</script>

<template>
  <svg
    class="logo"
    :class="{ dark }"
    :width="size"
    :height="size"
    viewBox="-32 -32 64 64"
    aria-hidden="true"
    focusable="false"
  >
    <circle
      class="outer"
      :r="OUTER_RADIUS"
      fill="none"
      stroke-width="1"
      stroke-dasharray="3 5"
      :opacity="dark ? 0.55 : 0.45"
    />
    <circle
      v-for="ring in rings"
      :key="ring.themeId"
      :r="ring.radius"
      fill="none"
      :stroke="ringStroke(ring.index, ring.primary)"
      :stroke-width="ring.strokeWidth"
      :stroke-dasharray="ring.dashArray"
      stroke-linecap="round"
      :opacity="ringOpacity(ring.selected)"
      :transform="`rotate(${ring.rotation})`"
    />
    <circle class="hub" :r="HUB_RADIUS" />
  </svg>
</template>

<style scoped>
.logo {
  display: block;
  flex: none;
}
.outer {
  stroke: var(--text-strong);
}
.hub {
  fill: var(--text-strong);
}
.dark .outer {
  stroke: var(--color-white);
}
.dark .hub {
  fill: var(--color-white);
}
</style>
