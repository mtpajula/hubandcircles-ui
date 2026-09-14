<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDate } from '../i18n/format'
import { langText } from '../i18n/language'
import type { PublishedLayer } from '../types/catalog'
import type { LayerState } from './layers'

/**
 * Layer picker popover (UI-SPEC 3.4): a radio list of the available `base` layers plus "no base
 * map", and a checkbox list that starts with the frontend-only "services on the route" entry
 * and continues with the other slots. Each catalog row carries the layer's attribution and fetch
 * date. Opening, closing and focus return are MapView's job; this only edits the state.
 */
const props = defineProps<{
  /** Layers offered in this view (`availableLayers`), in catalog order. */
  layers: PublishedLayer[]
  lang: string
  defaultLang: string
}>()
const state = defineModel<LayerState>('state', { required: true })
const { t } = useI18n()

const bases = computed(() => props.layers.filter((l) => l.slot === 'base'))
const overlays = computed(() => props.layers.filter((l) => l.slot !== 'base'))

const name = (layer: PublishedLayer) => langText(layer.name, props.lang, props.defaultLang)
function caption(layer: PublishedLayer): string {
  const fetched = layer.fetched_at
    ? t('layers.fetched', { date: formatDate(props.lang, layer.fetched_at) })
    : ''
  return [layer.attribution, fetched].filter(Boolean).join(' · ')
}
function setBase(id: string | null) {
  state.value = { ...state.value, base: id }
}
function setServices(on: boolean) {
  state.value = { ...state.value, services: on }
}
function toggle(id: string, on: boolean) {
  const next = new Set(state.value.on)
  if (on) next.add(id)
  else next.delete(id)
  state.value = { ...state.value, on: next }
}
</script>

<template>
  <div id="layer-picker" class="picker" role="group" :aria-label="t('layers.title')">
    <fieldset v-if="bases.length" class="group">
      <legend class="eyebrow">{{ t('layers.basemap') }}</legend>
      <label v-for="layer in bases" :key="layer.id" class="row">
        <input
          type="radio"
          name="basemap"
          :value="layer.id"
          :checked="state.base === layer.id"
          @change="setBase(layer.id)"
        />
        <span class="texts">
          <span class="name">{{ name(layer) }}</span>
          <span class="caption">{{ caption(layer) }}</span>
        </span>
      </label>
      <label class="row">
        <input
          type="radio"
          name="basemap"
          value=""
          :checked="state.base === null"
          @change="setBase(null)"
        />
        <span class="texts"
          ><span class="name">{{ t('layers.none') }}</span></span
        >
      </label>
    </fieldset>
    <fieldset class="group">
      <legend class="eyebrow">{{ t('layers.overlays') }}</legend>
      <label class="row">
        <input
          type="checkbox"
          value="services"
          :checked="state.services"
          @change="setServices(($event.target as HTMLInputElement).checked)"
        />
        <span class="texts"
          ><span class="name">{{ t('layers.services') }}</span></span
        >
      </label>
      <label v-for="layer in overlays" :key="layer.id" class="row">
        <input
          type="checkbox"
          :value="layer.id"
          :checked="state.on.has(layer.id)"
          @change="toggle(layer.id, ($event.target as HTMLInputElement).checked)"
        />
        <span class="texts">
          <span class="name">{{ name(layer) }}</span>
          <span class="caption">{{ caption(layer) }}</span>
        </span>
      </label>
    </fieldset>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--gap-12);
  width: 260px;
  max-width: calc(100vw - 28px);
  box-sizing: border-box;
  padding: 12px 14px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-card);
  color: var(--color-ink);
}
.group {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}
.eyebrow {
  padding: 0;
  margin-bottom: var(--gap-4);
  font: var(--text-eyebrow);
  letter-spacing: var(--text-eyebrow-spacing);
  text-transform: uppercase;
  color: var(--color-ink-muted);
}
.row {
  display: flex;
  align-items: flex-start;
  gap: var(--gap-9);
  cursor: pointer;
}
.row input {
  flex: none;
  margin: 1px 0 0;
  accent-color: var(--theme-primary);
}
.texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.name {
  font: 600 13px/1.25 var(--font-family);
  color: var(--color-ink);
}
.caption {
  font: var(--text-caption);
  color: var(--color-ink-muted);
  overflow-wrap: anywhere;
}
</style>
