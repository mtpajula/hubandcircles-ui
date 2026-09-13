<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NON_MUNICIPAL_REASONS } from '../data/identifiers'
import { langText } from '../i18n/language'
import type { PublishedRoute } from '../types/route'

/**
 * "Not municipally maintained" notice (UI-SPEC 4.2 items 1–2, §6). Renders only when
 * `maintainer === 'non_municipal'` (AP24). The pill is a button that scrolls to the panel when
 * `interactive`; elsewhere (list card, landing sample) it is static text.
 */
const PANEL_ID = 'maintenance-notice'

const props = withDefaults(
  defineProps<{
    route: Pick<PublishedRoute, 'maintainer' | 'non_municipal_reasons' | 'maintenance_note'>
    variant: 'pill' | 'panel'
    interactive?: boolean
    lang?: string
    defaultLang?: string
  }>(),
  { interactive: false, lang: 'fi', defaultLang: 'fi' },
)
const { t } = useI18n()

const shown = computed(() => props.route.maintainer === 'non_municipal')
const reasons = computed(() =>
  (props.route.non_municipal_reasons ?? []).filter((id) => {
    const known = (NON_MUNICIPAL_REASONS as readonly string[]).includes(id)
    if (!known) console.warn('unknown non_municipal_reasons id', id)
    return known
  }),
)
const note = computed(() =>
  props.route.maintenance_note
    ? langText(props.route.maintenance_note, props.lang, props.defaultLang)
    : '',
)

function scrollToPanel(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document
    .getElementById(PANEL_ID)
    ?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
}
</script>

<template>
  <template v-if="shown && variant === 'pill'">
    <button v-if="interactive" type="button" class="pill" @click="scrollToPanel">
      <span class="icon" aria-hidden="true">i</span>
      {{ t('maintenance.notice') }}
    </button>
    <span v-else class="pill">
      <span class="icon" aria-hidden="true">i</span>
      {{ t('maintenance.notice') }}
    </span>
  </template>
  <section v-else-if="shown" :id="PANEL_ID" class="panel">
    <h2 class="title">{{ t('maintenance.title') }}</h2>
    <p class="intro">{{ t('maintenance.intro') }}</p>
    <ul v-if="reasons.length" class="reasons">
      <li v-for="id in reasons" :key="id" class="reason">{{ t(`maintenance.reason.${id}`) }}</li>
    </ul>
    <p v-if="note" class="note">{{ note }}</p>
  </section>
</template>

<style scoped>
.pill {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-6);
  margin: 0;
  padding: 5px 10px;
  border: 1px solid var(--color-notice-border);
  border-radius: var(--radius-chip);
  background: var(--color-notice-bg);
  color: var(--color-notice-text);
  font: 700 12px/1.2 var(--font-family);
  vertical-align: middle;
  cursor: default;
}
button.pill {
  cursor: pointer;
}
/* UI-SPEC 1.1 / 6: 12–14 px "i" ring in the gravel icon color. */
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  border: 1.5px solid var(--color-notice-icon);
  border-radius: 50%;
  font: 700 9px/1 var(--font-family);
  color: var(--color-notice-icon);
}
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--gap-6);
  padding: 13px 14px;
  border: 1px solid var(--color-notice-border);
  border-radius: var(--radius-panel);
  background: var(--color-notice-panel);
  scroll-margin-top: var(--gap-14);
}
.title {
  margin: 0;
  font: 700 14px/1.3 var(--font-family);
  color: var(--color-notice-text);
}
.intro,
.note {
  margin: 0;
  font: 400 13px/1.55 var(--font-family);
  color: var(--color-ink-prose);
}
.reasons {
  margin: 0;
  padding: 0;
  list-style: none;
}
.reason {
  display: flex;
  gap: var(--gap-8);
  font: 400 13px/1.5 var(--font-family);
  color: var(--color-ink-prose);
}
.reason::before {
  content: '·';
  font-weight: 700;
  color: var(--color-notice-icon);
}
</style>
