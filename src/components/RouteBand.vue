<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { profileArea, profilePath } from '../data/band'
import { formatKm } from '../i18n/format'
import type { Profile } from '../types/route'

/**
 * Route band (UI-SPEC 4.2 item 5). V1: elevation profile and axis row only. `lanes` (technical,
 * surface, …) and the cursor come with the segment data; the prop is accepted but not drawn yet.
 */
const props = defineProps<{
  profile: Profile
  lengthKm: number
  lang: string
  /** V2: lane definitions from `theme.presentation.band`. Unused in V1. */
  lanes?: readonly unknown[]
}>()
const { t } = useI18n()

const WIDTH = 100
const HEIGHT = 84
const line = computed(() => profilePath(props.profile, WIDTH, HEIGHT))
const area = computed(() => profileArea(props.profile, WIDTH, HEIGHT))
const km = (value: number) => t('route.length', { km: formatKm(props.lang, value) })
</script>

<template>
  <div class="band">
    <svg
      class="profile"
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      preserveAspectRatio="none"
      role="img"
      :aria-label="t('route.elevationProfile')"
    >
      <path class="area" :d="area" />
      <path class="line" :d="line" vector-effect="non-scaling-stroke" />
    </svg>
    <!-- V2: lanes (technical, surface, traffic) -->
    <div class="axis" aria-hidden="true">
      <span>{{ km(0) }}</span>
      <span class="mid">{{ km(lengthKm / 2) }}</span>
      <span>{{ km(lengthKm) }}</span>
    </div>
    <!-- V2: cursor and tooltip, legend row -->
  </div>
</template>

<style scoped>
.band {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--gap-6);
  padding: 11px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  background: var(--color-white);
}
.profile {
  display: block;
  width: 100%;
  height: 84px;
}
.area {
  fill: var(--theme-primary);
  fill-opacity: 0.14;
}
.line {
  fill: none;
  stroke: var(--theme-primary);
  stroke-width: 2.2;
  stroke-linejoin: round;
}
.axis {
  display: flex;
  justify-content: space-between;
  height: 18px;
  font: var(--text-caption);
  color: var(--color-ink-muted);
}
@media (max-width: 699px) {
  .profile {
    height: 68px;
  }
  .mid {
    display: none;
  }
}
</style>
