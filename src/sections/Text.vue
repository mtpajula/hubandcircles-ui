<script setup lang="ts">
import { langText } from '../i18n/language'
import type { TextSection } from '../types/route'

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
