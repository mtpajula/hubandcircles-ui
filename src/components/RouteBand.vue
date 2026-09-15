<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  elevationAt,
  laneFill,
  laneSegments,
  profileArea,
  profilePath,
  segmentAt,
  visibleLanes,
  type LaneId,
} from '../data/band'
import { itrsNumber, type ItrsLevel } from '../data/itrs'
import { formatKm, formatM } from '../i18n/format'
import type { Band } from '../types/catalog'
import type { Profile, PublishedSegment } from '../types/route'

/**
 * Route band (UI-SPEC 4.2 item 5): the elevation profile and up to three segment lanes from
 * `theme.presentation.band`, an axis row, a legend row and a cursor that mirrors to the map
 * marker through `v-model:cursorKm`. Lanes without data are left out (P11); with nothing to draw
 * the band renders nothing. The whole stack is the hit target; arrow keys move 0.1 km.
 */
const props = withDefaults(
  defineProps<{
    profile: Profile
    segments?: readonly PublishedSegment[]
    lanes?: Band
    lengthKm: number
    lang: string
  }>(),
  { segments: () => [], lanes: () => ['elevation'] },
)
const cursorKm = defineModel<number | null>('cursorKm', { default: null })
const { t } = useI18n()

const WIDTH = 100
const HEIGHT = 84
const STEP = 0.1

const shown = computed(() => visibleLanes(props.lanes, props.profile, props.segments))
const showElevation = computed(() => shown.value.includes('elevation'))
const laneIds = computed(() => shown.value.filter((l): l is LaneId => l !== 'elevation'))

const line = computed(() => profilePath(props.profile, WIDTH, HEIGHT))
const area = computed(() => profileArea(props.profile, WIDTH, HEIGHT))
/** The profile's x axis is its last km; scale it so that it lines up with the lanes' 0…length. */
const profileWidth = computed(() => {
  const last = props.profile[props.profile.length - 1]?.[0] ?? 0
  return props.lengthKm > 0 ? `${Math.min(100, (last / props.lengthKm) * 100)}%` : '100%'
})

const lanes = computed(() =>
  laneIds.value.map((id) => ({
    id,
    segments: laneSegments(props.segments, props.lengthKm, id).map((s) => ({
      ...s,
      fill: laneFill(id, s.value),
      snow: s.value === 'snow',
    })),
  })),
)

function valueLabel(lane: LaneId, value: string | null): string {
  if (lane === 'itrs_technical') {
    return value
      ? `${itrsNumber(value as ItrsLevel)} ${t(`itrs.level.${value}`)}`
      : t('itrs.notRated')
  }
  return t(`${lane}.${value ?? 'unknown'}`)
}

/** Legend entries: each distinct value per lane in order of appearance, unknown last. */
const legend = computed(() =>
  lanes.value.flatMap((lane) => {
    const values = [...new Set(lane.segments.map((s) => s.value))].sort((a, b) =>
      a === null ? 1 : b === null ? -1 : 0,
    )
    return values.map((value) => ({
      key: `${lane.id}:${value}`,
      fill: laneFill(lane.id, value),
      snow: value === 'snow',
      label: valueLabel(lane.id, value),
    }))
  }),
)

const km = (value: number) => t('route.length', { km: formatKm(props.lang, value) })

// ---- cursor -------------------------------------------------------------------------------------

const stack = ref<HTMLDivElement | null>(null)

const cursorLeft = computed(() =>
  cursorKm.value === null || props.lengthKm <= 0
    ? null
    : `${Math.min(100, Math.max(0, (cursorKm.value / props.lengthKm) * 100))}%`,
)
const tooltipRight = computed(
  () => cursorKm.value !== null && cursorKm.value > props.lengthKm * 0.6,
)

const tooltip = computed(() => {
  const at = cursorKm.value
  if (at === null) return ''
  let text = `km ${formatKm(props.lang, at)}`
  const m = showElevation.value ? elevationAt(props.profile, at) : null
  if (m !== null) text += ` · ${formatM(props.lang, m)} m`
  const segment = segmentAt(props.segments, at)
  const values = laneIds.value.flatMap((lane) => {
    const value = segment?.[lane]
    return value ? [valueLabel(lane, value)] : []
  })
  return values.length ? `${text} / ${values.join(' · ')}` : text
})

function setCursor(value: number): void {
  const clamped = Math.min(props.lengthKm, Math.max(0, value))
  cursorKm.value = Math.round(clamped * 100) / 100
}

function onPointer(e: PointerEvent): void {
  if (e.type === 'pointermove' && e.pointerType !== 'mouse' && e.buttons === 0) return
  const rect = stack.value?.getBoundingClientRect()
  if (!rect || rect.width === 0) return
  setCursor(((e.clientX - rect.left) / rect.width) * props.lengthKm)
}

function onKey(e: KeyboardEvent): void {
  const current = cursorKm.value ?? 0
  const moves: Record<string, number> = {
    ArrowLeft: current - STEP,
    ArrowDown: current - STEP,
    ArrowRight: current + STEP,
    ArrowUp: current + STEP,
    Home: 0,
    End: props.lengthKm,
  }
  const next = moves[e.key]
  if (next === undefined) return
  e.preventDefault()
  setCursor(next)
}
</script>

<template>
  <div v-if="shown.length" class="band">
    <div
      ref="stack"
      class="stack"
      role="slider"
      tabindex="0"
      :aria-label="t('band.cursor')"
      aria-valuemin="0"
      :aria-valuemax="lengthKm"
      :aria-valuenow="cursorKm ?? 0"
      :aria-valuetext="tooltip || km(0)"
      @pointerdown="onPointer"
      @pointermove="onPointer"
      @keydown="onKey"
    >
      <svg
        v-if="showElevation"
        class="profile"
        :style="{ width: profileWidth }"
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="t('route.elevationProfile')"
      >
        <path class="area" :d="area" />
        <path class="line" :d="line" vector-effect="non-scaling-stroke" />
      </svg>
      <div
        v-for="lane in lanes"
        :key="lane.id"
        class="lane"
        role="img"
        :aria-label="t(`band.lane.${lane.id}`)"
      >
        <span
          v-for="s in lane.segments"
          :key="s.startKm"
          class="segment"
          :class="{ snow: s.snow }"
          :style="{ flex: s.flex, background: s.fill }"
        ></span>
      </div>
      <div
        v-if="cursorLeft !== null"
        class="cursor"
        :style="{ left: cursorLeft }"
        aria-hidden="true"
      >
        <span class="tooltip" :class="{ right: tooltipRight }">{{ tooltip }}</span>
      </div>
    </div>
    <div class="axis" aria-hidden="true">
      <span>{{ km(0) }}</span>
      <span class="mid">{{ km(lengthKm / 2) }}</span>
      <span>{{ km(lengthKm) }}</span>
    </div>
    <ul v-if="legend.length" class="legend">
      <li v-for="entry in legend" :key="entry.key" class="legend-item">
        <span
          class="swatch"
          :class="{ snow: entry.snow }"
          :style="{ background: entry.fill }"
          aria-hidden="true"
        ></span>
        {{ entry.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.band {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--gap-6);
  padding: 11px 12px;
  border: 1px solid var(--border-card);
  border-radius: var(--radius-panel);
  background: var(--surface-card);
}
.stack {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--gap-6);
  min-height: 44px;
  cursor: crosshair;
  touch-action: pan-y;
  border-radius: var(--radius-badge);
}
.stack:focus-visible {
  outline: 2px solid var(--theme-primary);
  outline-offset: 3px;
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
.lane {
  display: flex;
  height: 14px;
  border-radius: 3px;
  overflow: hidden;
}
.segment {
  display: block;
  min-width: 0;
}
.snow {
  box-shadow: inset 0 0 0 1px var(--surface-snow-border);
}
.cursor {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1.5px;
  margin-left: -0.75px;
  background: var(--text-strong);
  pointer-events: none;
}
.tooltip {
  position: absolute;
  top: 4px;
  left: 6px;
  padding: 4px 7px;
  border-radius: var(--radius-tooltip);
  background: var(--surface-inverse);
  color: var(--text-inverse);
  font: 600 11px/1.35 var(--font-family);
  white-space: nowrap;
}
.tooltip.right {
  left: auto;
  right: 6px;
}
.axis {
  display: flex;
  justify-content: space-between;
  height: 18px;
  font: var(--text-caption);
  color: var(--text-muted);
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-6) var(--gap-14);
  margin: 0;
  padding: 0;
  list-style: none;
  font: var(--text-caption);
  color: var(--text-soft);
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-6);
}
.swatch {
  width: 11px;
  height: 11px;
  border-radius: 2px;
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
