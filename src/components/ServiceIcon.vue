<script setup lang="ts">
import { computed } from 'vue'
import { SHELTER_CATEGORIES } from '../data/identifiers'

/**
 * Category icon circle of a service point (UI-SPEC 3.4, 4.2 item 7): a filled circle in river
 * (shelters: touring green) with a simple 24 px line icon in white. One path per category (5.5);
 * an unknown category gets an empty circle and a warning (P4). Decorative: the name or the
 * translated category always stands next to it.
 */
const props = withDefaults(defineProps<{ category: string; size?: number }>(), { size: 24 })

const PATHS: Record<string, string> = {
  cafe: 'M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM16 10h2a2 2 0 0 1 0 4h-2M7 3v2M11 3v2',
  restaurant: 'M6 3v18M4 3v4a2 2 0 0 0 4 0V3M17 3v18M17 3c-3 3-3 8 0 10',
  shop: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2',
  accommodation: 'M3 7v11M3 14h18v4M3 11h7v3M10 11h8a3 3 0 0 1 3 3',
  bike_repair: 'M20 7l-3.5 3.5-3-3L17 4a5 5 0 0 0-6.4 6.6L4 17.2 6.8 20l6.6-6.6A5 5 0 0 0 20 7z',
  bike_rental:
    'M5 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M19 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M5 17l4-9h6l4 9M9 8h5M12 17l3-9',
  water: 'M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z',
  toilet: 'M7 3h6v8H7zM7 11h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5zM12 19v2',
  lean_to: 'M3 19h18M5 19V8l10-4v15M15 10l5 3v6',
  hut: 'M4 11l8-7 8 7M6 9v11h12V9M10 20v-6h4v6',
  issue: 'M12 3 2 20h20zM12 10v5M12 18v.5',
}

const path = computed(() => {
  const d = PATHS[props.category]
  if (!d) console.warn(`unknown service category ${props.category}`)
  return d ?? null
})
const shelter = computed(() => (SHELTER_CATEGORIES as readonly string[]).includes(props.category))
const iconSize = computed(() => Math.round(props.size * 0.62))
</script>

<template>
  <span
    class="circle"
    :class="{ shelter }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <svg v-if="path" :width="iconSize" :height="iconSize" viewBox="0 0 24 24">
      <path :d="path" />
    </svg>
  </span>
</template>

<style scoped>
.circle {
  flex: none;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-service);
  color: var(--color-white);
}
.shelter {
  background: var(--color-service-shelter);
}
path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
