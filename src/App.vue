<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useCatalog } from './composables/useCatalog'
import { setLanguage } from './i18n'
import { langText } from './i18n/language'
import { applyTheme } from './theme'

/** App shell: catalog loading and error states, language sync, document title, then the routed page. */
const { t, locale } = useI18n()
const route = useRoute()
const { state, catalog, errorKey } = useCatalog()

const lang = computed(() => String(route.params.lang ?? locale.value))
const projectName = computed(() =>
  catalog.value
    ? langText(catalog.value.project.name, lang.value, catalog.value.project.default_language)
    : '',
)

/** Statement pages prefix the project name with their own title; other pages use the name. */
const title = computed(() => {
  const name = projectName.value || t('app.title')
  return route.name === 'statement' ? `${t(`page.${route.params.page}.title`)} – ${name}` : name
})

watch(lang, (l) => setLanguage(l), { immediate: true })
watch(title, (next) => (document.title = next), { immediate: true })
// Only the map page applies a theme; the other pages reset to the light base look.
watch(
  () => route.name,
  (name) => {
    if (name === 'landing' || name === 'statement') applyTheme(null)
  },
  { immediate: true },
)
</script>

<template>
  <p v-if="state === 'loading'" class="status" role="status">{{ t('app.loading') }}</p>
  <div v-else-if="state === 'error' || !catalog" class="status" role="alert">
    <h1>{{ t('error.title') }}</h1>
    <p>{{ t(errorKey ?? 'error.load') }}</p>
  </div>
  <RouterView v-else v-slot="{ Component }">
    <component :is="Component" :catalog="catalog" />
  </RouterView>
</template>

<style scoped>
.status {
  padding: var(--gap-40) var(--gap-22);
  max-width: 40rem;
  margin: 0 auto;
  font: var(--text-body);
}
</style>
