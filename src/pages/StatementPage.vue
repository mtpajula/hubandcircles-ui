<script lang="ts">
/** Statement pages and the order of their sections; each section is `page.<id>.<key>` (+ `Title`). */
export const STATEMENT_PAGES = ['accessibility', 'privacy'] as const
export type StatementPageId = (typeof STATEMENT_PAGES)[number]
const SECTIONS: Record<StatementPageId, readonly string[]> = {
  accessibility: ['status', 'issues', 'feedback'],
  privacy: ['storage', 'third', 'hosting', 'contact'],
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitch from '../components/LanguageSwitch.vue'
import SiteBrand from '../components/SiteBrand.vue'
import { availableLanguages } from '../i18n'
import type { Catalog } from '../types/catalog'

/**
 * Accessibility and privacy statements (UI-SPEC 2.1): plain document pages with the site header
 * and a back link. The content lives in the locale files; a section whose value is an array is
 * rendered as a list. The GitHub link shows only when the catalog names a repository (P11).
 */
const props = defineProps<{ catalog: Catalog; lang: string; page: StatementPageId }>()
const { t, tm, rt, te } = useI18n()

const languages = computed(() => availableLanguages(props.catalog.project.languages))
const repoUrl = computed(() => {
  const repo = props.catalog.project.feedback?.github_repo
  return repo ? `https://github.com/${repo}` : null
})
const sections = computed(() =>
  SECTIONS[props.page].map((key) => {
    const body = tm(`page.${props.page}.${key}`)
    return {
      key,
      title: t(`page.${props.page}.${key}Title`),
      items: Array.isArray(body) ? body.map((item) => rt(item)) : null,
      text: Array.isArray(body) ? '' : t(`page.${props.page}.${key}`),
    }
  }),
)
const repoLabel = computed(() =>
  te(`page.${props.page}.repoLabel`) ? t(`page.${props.page}.repoLabel`) : '',
)
</script>

<template>
  <div class="page">
    <header class="header">
      <SiteBrand :catalog="catalog" :lang="lang" />
      <LanguageSwitch :languages="languages" :current="lang" />
    </header>
    <main class="document">
      <RouterLink class="back" :to="{ name: 'landing', query: { lang } }">
        ← {{ t('nav.home') }}
      </RouterLink>
      <h1 class="title">{{ t(`page.${page}.title`) }}</h1>
      <p class="text">{{ t(`page.${page}.intro`) }}</p>
      <section v-for="s in sections" :key="s.key" class="section">
        <h2 class="heading">{{ s.title }}</h2>
        <ul v-if="s.items" class="text list">
          <li v-for="(item, i) in s.items" :key="i">{{ item }}</li>
        </ul>
        <p v-else class="text">{{ s.text }}</p>
      </section>
      <p v-if="repoUrl && repoLabel" class="text">
        <a :href="repoUrl" rel="noopener">{{ repoLabel }}</a>
      </p>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  background: var(--surface-page);
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-22);
  height: var(--header-height);
  padding: 0 20px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border-card);
  background: var(--surface-card);
}
.document {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 34px;
  box-sizing: border-box;
}
.back {
  display: inline-block;
  margin-bottom: var(--gap-22);
  font: 600 14px/1.2 var(--font-family);
  color: var(--text-link);
  text-decoration: none;
}
.back:hover {
  text-decoration: underline;
}
.title {
  margin: 0 0 var(--gap-16);
  font: 700 22px/1.2 var(--font-family);
  color: var(--text-strong);
}
.section {
  margin-top: var(--gap-22);
}
.heading {
  margin: 0 0 var(--gap-8);
  font: 700 16px/1.3 var(--font-family);
  color: var(--text-strong);
}
.text {
  margin: 0;
  font: 400 15px/1.6 var(--font-family);
  color: var(--text-prose);
}
.list {
  padding-left: 22px;
  display: grid;
  gap: var(--gap-8);
}
@media (max-width: 699px) {
  .header {
    gap: var(--gap-10);
    padding: 0 14px;
  }
  .document {
    padding: 28px 18px;
  }
}
</style>
