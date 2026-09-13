<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { embedUrl } from '../data/video'
import type { VideoSection } from '../types/route'

/**
 * Video section (UI-SPEC 4.2 item 8): YouTube and Vimeo as a lazily loaded privacy-friendly
 * iframe, any other address as a plain link. Nothing is fetched until the iframe scrolls into view.
 */
defineOptions({ inheritAttrs: false })
const props = defineProps<{ section: VideoSection }>()
const { t } = useI18n()
const embed = computed(() => embedUrl(props.section.url))
</script>

<template>
  <section class="video">
    <h2 class="eyebrow">{{ t('video.title') }}</h2>
    <iframe
      v-if="embed"
      class="player"
      :src="embed"
      :title="t('video.player')"
      loading="lazy"
      allow="fullscreen; picture-in-picture"
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
    <a v-else class="link" :href="section.url" target="_blank" rel="noopener">
      {{ t('video.link') }}
    </a>
  </section>
</template>

<style scoped>
.video {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
}
.eyebrow {
  margin: 0;
  font: var(--text-eyebrow);
  letter-spacing: var(--text-eyebrow-spacing);
  text-transform: uppercase;
  color: var(--color-ink-muted);
}
.player {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 0;
  border-radius: var(--radius-panel);
  background: var(--color-border-soft);
}
.link {
  font: 600 14px/1.2 var(--font-family);
  color: var(--color-river);
  word-break: break-all;
}
</style>
