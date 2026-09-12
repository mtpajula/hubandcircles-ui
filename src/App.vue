<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useCatalog } from './composables/useCatalog'
import { setLanguage } from './i18n'
import { langText } from './i18n/language'

/** App shell: catalog loading and error states, language sync, then the routed page. */
const { t, locale } = useI18n()
const route = useRoute()
const { state, catalog, errorKey } = useCatalog()

const lang = computed(() => String(route.params.lang ?? locale.value))
const projectName = computed(() =>
  catalog.value
    ? langText(catalog.value.project.name, lang.value, catalog.value.project.default_language)
    : '',
)

watch(lang, (l) => setLanguage(l), { immediate: true })
watch(projectName, (name) => {
  document.title = name || t('app.title')
})
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
