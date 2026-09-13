<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { filterOptions, hasUnknown, type FilterId, type FilterModel } from '../data/filters'
import { ITRS_LEVELS } from '../data/identifiers'
import { itrsNumber, type ItrsLevel } from '../data/itrs'
import { formatPercent } from '../i18n/format'
import type { RouteSummary } from '../types/catalog'

/**
 * Filters block (UI-SPEC 3.2): header row, one group per `theme.presentation.filters` entry in
 * that order, a "no data" chip wherever some route lacks the field, and the info box when routes
 * were left out. The filtering itself is `applyFilters` in src/data/filters.ts; this only edits
 * the model.
 */
const props = defineProps<{
  themeName: string
  shown: number
  total: number
  filters: readonly FilterId[]
  routes: readonly RouteSummary[]
  lang: string
}>()
const model = defineModel<FilterModel>({ required: true })
const { t } = useI18n()

const groups = computed(() =>
  props.filters.map((id) => ({
    id,
    options: filterOptions(id, props.routes),
    unknown: hasUnknown(props.routes, id),
  })),
)

function title(id: FilterId): string {
  const base = t(`keyFigure.${id}`)
  if (id === 'itrs_technical') return `${base} · ${t('filter.atMost')}`
  if (id === 'separated_share') return `${base} · ${t('filter.atLeast')}`
  return base
}

function optionLabel(id: FilterId, value: string): string {
  switch (id) {
    case 'length':
    case 'ascent':
      return t(`filter.${id}.${value}`)
    case 'difficulty':
      return t(`difficulty.${value}`)
    case 'dominant_surface':
      return t(`surface.${value}`)
    case 'winter_maintenance':
      return t(`winterMaintenance.${value}`)
    default:
      return value
  }
}

function set(id: FilterId, value: string | number | undefined): void {
  const next = { ...model.value }
  if (value === undefined || next[id] === value) delete next[id]
  else (next as Record<string, unknown>)[id] = value
  model.value = next
}

function toggle(id: FilterId, value: string): void {
  set(id, value)
}

function toggleUnknown(id: FilterId): void {
  const hide = model.value.hideUnknown
  model.value = {
    ...model.value,
    hideUnknown: hide.includes(id) ? hide.filter((f) => f !== id) : [...hide, id],
  }
}

const maxLevel = computed(() =>
  model.value.itrs_technical ? itrsNumber(model.value.itrs_technical) : ITRS_LEVELS.length,
)
function setShare(e: Event): void {
  const value = Number((e.target as HTMLInputElement).value)
  set('separated_share', value > 0 ? value : undefined)
}
const share = computed(() => model.value.separated_share ?? 0)
const excluded = computed(() => props.total - props.shown)
</script>

<template>
  <div class="filters">
    <div class="header">
      <h1 class="theme-name">{{ themeName }}</h1>
      <span class="count">{{ t('route.shown', { shown, total }) }}</span>
    </div>
    <fieldset v-for="g in groups" :key="g.id" class="group">
      <legend class="eyebrow">{{ title(g.id) }}</legend>
      <div class="chips">
        <template v-if="g.id === 'itrs_technical'">
          <button
            v-for="level in ITRS_LEVELS"
            :key="level"
            type="button"
            class="level"
            :class="{ outlined: itrsNumber(level) > maxLevel }"
            :style="{ '--level': `var(--itrs-${level})` }"
            :aria-pressed="model.itrs_technical === level"
            :aria-label="`${itrsNumber(level)} ${t(`itrs.level.${level}`)}`"
            @click="toggle('itrs_technical', level as ItrsLevel)"
          >
            {{ itrsNumber(level) }}
          </button>
        </template>
        <label v-else-if="g.id === 'separated_share'" class="slider">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            :value="share"
            :style="{ '--fill': `${share}%` }"
            :aria-label="title(g.id)"
            @input="setShare"
          />
          <span class="slider-value">{{ formatPercent(lang, share / 100) }}</span>
        </label>
        <template v-else>
          <button
            v-for="value in g.options"
            :key="value"
            type="button"
            class="chip"
            :aria-pressed="model[g.id] === value"
            @click="toggle(g.id, value)"
          >
            <span
              v-if="g.id === 'dominant_surface' && value !== 'mixed'"
              class="swatch"
              :style="{ background: `var(--surface-${value})` }"
              aria-hidden="true"
            ></span>
            {{ optionLabel(g.id, value) }}
          </button>
        </template>
        <button
          v-if="g.unknown"
          type="button"
          class="chip"
          :aria-pressed="!model.hideUnknown.includes(g.id)"
          @click="toggleUnknown(g.id)"
        >
          {{ t('filter.noData') }}
        </button>
      </div>
    </fieldset>
    <p v-if="excluded > 0" class="info" role="status">
      {{ t('filter.excluded', { n: excluded }, excluded) }}
    </p>
  </div>
</template>

<style scoped>
.filters {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--gap-10);
  padding: 15px 18px 13px;
  background: var(--color-snow);
  border-bottom: 1px solid var(--color-border);
}
.header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--gap-10);
}
.theme-name {
  margin: 0;
  font: 700 17px/1.2 var(--font-family);
  color: var(--color-ink);
}
.count {
  font: 400 13px/1.2 var(--font-family);
  color: var(--color-ink-muted);
  white-space: nowrap;
}
.group {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}
.eyebrow {
  padding: 0;
  margin-bottom: var(--gap-6);
  font: var(--text-eyebrow);
  letter-spacing: var(--text-eyebrow-spacing);
  text-transform: uppercase;
  color: var(--color-ink-muted);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gap-6);
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-6);
  padding: 6px 11px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-chip);
  background: var(--color-white);
  color: var(--color-ink-soft);
  font: 600 12px/1.2 var(--font-family);
  cursor: pointer;
}
.chip[aria-pressed='true'] {
  background: var(--theme-primary);
  border-color: var(--theme-primary);
  color: var(--color-white);
}
.swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px var(--surface-snow-border);
}
.level {
  width: 30px;
  height: 26px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-badge);
  background: var(--level);
  color: var(--color-white);
  font: 700 12px/1 var(--font-family);
  cursor: pointer;
}
.level.outlined {
  background: var(--color-white);
  border-color: var(--color-border);
  color: var(--color-ink-muted);
}
.slider {
  display: flex;
  align-items: center;
  gap: var(--gap-10);
  width: 100%;
}
.slider input {
  flex: 1;
  height: 6px;
  margin: 8px 0;
  appearance: none;
  border-radius: 3px;
  background: linear-gradient(
    to right,
    var(--traffic-separated) var(--fill),
    var(--color-border) var(--fill)
  );
  cursor: pointer;
}
.slider input::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--color-white);
  background: var(--traffic-separated);
  box-shadow: var(--shadow-control);
}
.slider input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--color-white);
  background: var(--traffic-separated);
}
.slider-value {
  min-width: 40px;
  text-align: right;
  font: 700 13px/1.2 var(--font-family);
  color: var(--color-ink);
}
.info {
  margin: 0;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-box);
  background: var(--color-white);
  font: 400 12px/1.45 var(--font-family);
  color: var(--color-ink-soft);
}
</style>
