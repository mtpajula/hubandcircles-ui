<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ITRS_LEVELS, SURFACES, TRAFFIC, UNKNOWN } from '../data/identifiers'
import { isItrsLevel, itrsNumber } from '../data/itrs'
import { orderedShares } from '../data/shares'
import { formatPercent } from '../i18n/format'

/**
 * Proportional share bar with a text legend (UI-SPEC 4.2 item 6, §1.4 fills). Ids outside the
 * fixed lists (5.7) are warned about and skipped (P4). `compact` is the list-card form (§3.3):
 * a thin bar and a one-line caption instead of chips.
 */
const props = withDefaults(
  defineProps<{
    shares: Record<string, number>
    kind: 'surface' | 'traffic' | 'itrs'
    lang: string
    height?: number
    compact?: boolean
  }>(),
  { height: 16, compact: false },
)
const { t } = useI18n()

const KNOWN: Record<typeof props.kind, readonly string[]> = {
  surface: SURFACES,
  traffic: TRAFFIC,
  itrs: [...ITRS_LEVELS, UNKNOWN],
}

const parts = computed(() =>
  orderedShares(props.shares)
    .filter((s) => {
      const known = KNOWN[props.kind].includes(s.id)
      if (!known) console.warn(`unknown ${props.kind} share id`, s.id)
      return known
    })
    .map((s) => ({
      ...s,
      label: label(s.id),
      percent: formatPercent(props.lang, s.share),
      fill: `var(--${s.id === UNKNOWN ? 'surface' : props.kind}-${s.id})`,
    })),
)

function label(id: string): string {
  if (props.kind === 'itrs') {
    return isItrsLevel(id) ? `${itrsNumber(id)} ${t(`itrs.level.${id}`)}` : t(`surface.${UNKNOWN}`)
  }
  return t(`${props.kind}.${id}`)
}
</script>

<template>
  <div class="share-bar" :class="{ compact }">
    <div class="bar" :style="{ height: `${height}px` }" aria-hidden="true">
      <span
        v-for="p in parts"
        :key="p.id"
        class="part"
        :class="{ snow: p.id === 'snow' }"
        :style="{ flex: p.share, background: p.fill }"
      ></span>
    </div>
    <ul class="legend">
      <li v-for="p in parts" :key="p.id" class="item">
        <span
          class="swatch"
          :class="{ snow: p.id === 'snow' }"
          :style="{ background: p.fill }"
          aria-hidden="true"
        ></span>
        <span class="text">{{ p.label }} {{ p.percent }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.share-bar {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
}
.bar {
  display: flex;
  overflow: hidden;
  border: 1px solid var(--border-card);
  border-radius: var(--radius-card);
  background: var(--surface-inset);
}
.part {
  display: block;
  min-width: 2px;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-6) var(--gap-8);
  margin: 0;
  padding: 0;
  list-style: none;
}
.item {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-6);
  padding: 4px 9px;
  border: 1px solid var(--border-card);
  border-radius: var(--radius-chip);
  background: var(--surface-inset);
  font: 600 12px/1.2 var(--font-family);
  color: var(--text-soft);
}
.swatch {
  width: 11px;
  height: 11px;
  border-radius: 2px;
}
.snow {
  box-shadow: inset 0 0 0 1px var(--surface-snow-border);
}

/* List-card form (UI-SPEC 3.3): 12 px bar, caption "sora 66 % · asfaltti 22 %". */
.compact {
  gap: var(--gap-4);
}
.compact .bar {
  border-radius: 6px;
}
.compact .legend {
  gap: 0;
}
.compact .item {
  padding: 0;
  border: 0;
  background: none;
  font: var(--text-caption);
  color: var(--text-muted);
}
.compact .item + .item::before {
  content: '·';
  margin: 0 5px;
}
.compact .swatch {
  display: none;
}
</style>
