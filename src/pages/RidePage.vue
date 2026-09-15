<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { langText } from '../i18n/language'
import type { Catalog } from '../types/catalog'

/**
 * Placeholder for ride mode (`…/route/<id>/ride`, UI-SPEC 5.2): the route name, a notice that
 * the mode is coming, and the way back to the card. U9b replaces this with `RideMode`.
 */
const props = defineProps<{ catalog: Catalog }>()
const { t } = useI18n()
const route = useRoute()

const lang = computed(() => String(route.params.lang))
const name = computed(() => {
  const r = props.catalog.routes.find((x) => x.id === String(route.params.id))
  return r ? langText(r.name, lang.value, props.catalog.project.default_language) : ''
})
</script>

<template>
  <main class="ride">
    <h1 v-if="name" class="title">{{ name }}</h1>
    <p class="soon" role="status">{{ t('ride.soon') }}</p>
    <RouterLink
      class="back"
      :to="{ name: 'route', params: { lang, theme: route.params.theme, id: route.params.id } }"
    >
      {{ t('ride.back') }}
    </RouterLink>
  </main>
</template>

<style scoped>
.ride {
  display: flex;
  flex-direction: column;
  gap: var(--gap-14);
  min-height: 100dvh;
  padding: 56px 14px;
  box-sizing: border-box;
  background: var(--color-night);
  color: var(--color-on-night);
}
.title {
  margin: 0;
  font: 700 21px/1.2 var(--font-family);
}
.soon {
  margin: 0;
  font: var(--text-body);
  color: var(--color-on-night-faint);
}
.back {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font: 600 15px/1.2 var(--font-family);
  color: var(--color-on-night);
}
</style>
