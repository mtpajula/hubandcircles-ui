<script setup lang="ts">
import { langText } from '../i18n/language'
import type { TextSection } from '../types/route'

// Every section receives the same props (RouteCard); the ones this one ignores must not leak to the DOM.
defineOptions({ inheritAttrs: false })
defineProps<{ section: TextSection; lang: string; defaultLang: string }>()
</script>

<template>
  <p class="text">{{ langText(section.content, lang, defaultLang) }}</p>
</template>

<style scoped>
.text {
  white-space: pre-line;
}
</style>
