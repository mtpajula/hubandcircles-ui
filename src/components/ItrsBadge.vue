<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { itrsNumber, type ItrsLevel } from '../data/itrs'

/**
 * ITRS level badge "3 punainen" (UI-SPEC 6, §1.3). The number precedes the name so the level
 * works in monochrome and in screen readers; `null` is "Not rated" in --itrs-none (P11 exception).
 */
const props = withDefaults(defineProps<{ level: ItrsLevel | null; size?: 'sm' | 'md' }>(), {
  size: 'md',
})
const { t } = useI18n()

const text = computed(() =>
  props.level ? `${itrsNumber(props.level)} ${t(`itrs.level.${props.level}`)}` : t('itrs.notRated'),
)
const fill = computed(() => `var(--itrs-${props.level ?? 'none'})`)
</script>

<template>
  <span class="badge" :class="size" :style="{ background: fill }" :aria-label="text">
    {{ text }}
  </span>
</template>

<style scoped>
/* UI-SPEC 1.6: badge radius 5–6, padding 5–6/10. */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: var(--radius-badge);
  color: var(--color-white);
  font: 700 14px/1.2 var(--font-family);
  white-space: nowrap;
}
.sm {
  padding: 3px 7px;
  font: 700 11px/1.2 var(--font-family);
}
</style>
