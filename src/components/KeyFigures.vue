<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  itrsFootnote,
  keyFigures,
  type KeyFigureId,
  type KeyFigureSource,
} from '../data/keyFigures'
import { formatDate, formatKm, formatM, formatPercent } from '../i18n/format'
import ItrsBadge from './ItrsBadge.vue'
import ShareBar from './ShareBar.vue'

/**
 * Key figure tiles in the theme's order (UI-SPEC 4.2 item 3; list card §3.3 with `compact` and
 * `limit: 3`). Values come resolved from `src/data/keyFigures.ts`; this component only formats.
 */
const props = withDefaults(
  defineProps<{
    figures: readonly KeyFigureId[]
    route: KeyFigureSource
    lang: string
    limit?: number
    compact?: boolean
    /** Theme whose `longest_service_gap` is shown (5.3); without it the figure is hidden. */
    themeId?: string
  }>(),
  { limit: undefined, compact: false, themeId: undefined },
)
const { t, te } = useI18n()

const tiles = computed(() => keyFigures(props.figures, props.route, props.limit, props.themeId))
const footnote = computed(() => (props.compact ? null : itrsFootnote(props.figures, props.route)))

/** Fixed identifiers (P4): translate when known, otherwise show the raw value. */
function term(group: string, value: string): string {
  const key = `${group}.${value}`
  return te(key) ? t(key) : value
}
const assessed = computed(() => {
  const f = footnote.value
  if (!f?.assessedBy) return ''
  const by = t('itrs.assessedBy', { name: f.assessedBy })
  return f.assessedOn ? `${by}, ${formatDate(props.lang, f.assessedOn)}` : by
})
const scales = computed(() => {
  const f = footnote.value
  const parts: string[] = []
  if (f?.exposure != null) parts.push(`${t('itrs.exposure')} ${f.exposure}`)
  if (f?.wilderness != null) parts.push(`${t('itrs.wilderness')} ${f.wilderness}`)
  return parts.join(' · ')
})
</script>

<template>
  <div v-if="tiles.length" class="key-figures" :class="{ compact }">
    <div class="tiles">
      <div v-for="f in tiles" :key="f.id" class="tile" :class="{ wide: f.kind === 'shares' }">
        <span class="label">{{ t(`keyFigure.${f.id}`) }}</span>
        <ItrsBadge v-if="f.kind === 'itrs'" :level="f.level" :size="compact ? 'sm' : 'md'" />
        <ShareBar
          v-else-if="f.kind === 'shares'"
          :shares="f.shares"
          kind="surface"
          :lang="lang"
          :height="compact ? 12 : 16"
          :compact="compact"
        />
        <span v-else-if="f.kind === 'km'" class="value">
          {{ t('route.length', { km: formatKm(lang, f.value) }) }}
        </span>
        <span v-else-if="f.kind === 'm'" class="value">
          {{ t('route.ascent', { m: formatM(lang, f.value) }) }}
        </span>
        <span v-else-if="f.kind === 'percent'" class="value">
          {{ formatPercent(lang, f.value) }}
        </span>
        <span v-else-if="f.kind === 'term'" class="value">{{ term(f.group, f.value) }}</span>
        <span v-else class="value">{{ f.value }}</span>
      </div>
    </div>
    <p v-if="scales || assessed" class="footnote">
      <span v-if="scales">{{ scales }}</span>
      <span v-if="scales && assessed" aria-hidden="true"> | </span>
      <span v-if="assessed">{{ assessed }}</span>
    </p>
  </div>
</template>

<style scoped>
.key-figures {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
}
.tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-9);
}
.tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--gap-4);
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid var(--border-card);
  border-radius: var(--radius-card);
  background: var(--surface-inset);
}
.wide {
  grid-column: 1 / -1;
  align-items: stretch;
}
.label {
  font: var(--text-caption);
  color: var(--text-muted);
}
.value {
  font: var(--text-key-figure);
  color: var(--theme-accent); /* theme identity in every theme (UI-SPEC 1.1) */
}
.footnote {
  margin: 0;
  font: var(--text-caption-lg);
  color: var(--text-muted);
}
@media (max-width: 699px) {
  .tile {
    padding: 9px 11px;
  }
  .value {
    font: 700 19px/1.2 var(--font-family);
  }
}

/* List card (UI-SPEC 3.3): label 400 11 muted + value 700 14, no tile frame. */
.compact .tiles {
  gap: var(--gap-8);
}
.compact .tile {
  gap: 2px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
}
.compact .value {
  font: 700 14px/1.2 var(--font-family);
}
</style>
