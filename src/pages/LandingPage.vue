<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import HubLogo from '../components/HubLogo.vue'
import LanguageSwitch from '../components/LanguageSwitch.vue'
import MaintenanceNotice from '../components/MaintenanceNotice.vue'
import { useCatalog } from '../composables/useCatalog'
import { ALL_THEMES } from '../data/identifiers'
import { countRoutesByTheme } from '../data/routes'
import { browserVideoConditions, shouldLoadVideo } from '../data/video'
import { availableLanguages, setLanguage } from '../i18n'
import { langText, resolveLanguage } from '../i18n/language'
import type { Catalog } from '../types/catalog'

/**
 * Landing page (UI-SPEC chapter 2): hero with theme links straight to the map, then what the site
 * is and where the data comes from. No route list, search or map. Shown for `#/` only; the page
 * has no language in its URL, so the choice is resolved here and travels as `?lang=`.
 */
const props = defineProps<{ catalog: Catalog }>()
/** Stub route for the sample notice in the about section (UI-SPEC 2.1). */
const NOTICE_SAMPLE = { maintainer: 'non_municipal' } as const
const { t } = useI18n()
const route = useRoute()
const { themesInOrder } = useCatalog()

const project = computed(() => props.catalog.project)
const languages = computed(() => availableLanguages(project.value.languages))
const lang = computed(() =>
  resolveLanguage(
    typeof route.query.lang === 'string' ? route.query.lang : undefined,
    navigator.languages,
    languages.value,
    project.value.default_language,
  ),
)
watch(lang, (l) => setLanguage(l), { immediate: true })

function text(obj: Record<string, string> | null | undefined): string {
  return obj ? langText(obj, lang.value, project.value.default_language) : ''
}
const routeCounts = computed(() => countRoutesByTheme(props.catalog.routes))
function countOf(themeId: string): number {
  return routeCounts.value[themeId] ?? 0
}
const sampleUrl = computed(() => `#/${lang.value}/${project.value.default_theme}/`)

// Video (UI-SPEC 2.3): decided once at mount so that phones never fetch a byte of it. A failed
// load falls back to the poster, a failed poster to the flat night background.
const POSTER_URL = `${import.meta.env.BASE_URL}landing/poster.jpg`
const VIDEO_URL = `${import.meta.env.BASE_URL}landing/hero.mp4`
const videoEnabled = ref(false)
const posterOk = ref(true)
const paused = ref(false)
const video = ref<HTMLVideoElement | null>(null)
onMounted(() => {
  videoEnabled.value = shouldLoadVideo(browserVideoConditions())
})
function toggleVideo(): void {
  const v = video.value
  if (!v) return
  if (v.paused) void v.play()
  else v.pause()
  paused.value = v.paused
}

function scrollToAbout(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById('about')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
}
</script>

<template>
  <div class="landing">
    <section class="hero">
      <div class="media" aria-hidden="true">
        <video
          v-if="videoEnabled"
          ref="video"
          muted
          autoplay
          loop
          playsinline
          :poster="POSTER_URL"
          @error="videoEnabled = false"
        >
          <source :src="VIDEO_URL" type="video/mp4" @error="videoEnabled = false" />
        </video>
        <img v-else-if="posterOk" :src="POSTER_URL" alt="" @error="posterOk = false" />
        <div class="scrim"></div>
      </div>

      <header class="header">
        <div class="brand">
          <HubLogo :themes="themesInOrder" variant="dark" :size="42" class="logo" />
          <div>
            <div class="name">{{ text(project.name) }}</div>
            <div class="subtitle">{{ text(project.subtitle) }}</div>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="pill about-link" @click="scrollToAbout">
            {{ t('landing.about') }}
          </button>
          <LanguageSwitch :languages="languages" :current="lang" variant="dark" />
        </div>
      </header>

      <div class="copy">
        <h2 class="title">
          <span class="title-desktop">{{ t('landing.title') }}</span>
          <span class="title-mobile">{{ t('landing.titleMobile') }}</span>
        </h2>
        <p class="lead">{{ t('landing.lead') }}</p>
        <p class="eyebrow">{{ t('landing.eyebrow') }}</p>
        <ul class="themes">
          <li v-for="theme in themesInOrder" :key="theme.id">
            <RouterLink
              class="theme-card"
              :to="{ name: 'theme', params: { lang, theme: theme.id } }"
              :style="{ '--card-color': theme.colors.primary }"
            >
              <span class="theme-title">{{ text(theme.name) }}</span>
              <span v-if="text(theme.tagline)" class="theme-tagline">{{
                text(theme.tagline)
              }}</span>
              <span class="theme-count"
                >{{ t('landing.routeCount', countOf(theme.id)) }}
                <span class="theme-arrow" aria-hidden="true">→</span></span
              >
            </RouterLink>
          </li>
        </ul>
        <RouterLink
          class="pill all-link"
          :to="{ name: 'theme', params: { lang, theme: ALL_THEMES } }"
        >
          {{ t('landing.allRoutes') }}
        </RouterLink>
        <p class="share-note">
          {{ t('landing.shareNote') }} <code class="url">{{ sampleUrl }}</code>
        </p>
      </div>

      <div v-if="videoEnabled" class="video-controls">
        <button type="button" class="video-toggle" :aria-pressed="paused" @click="toggleVideo">
          <span aria-hidden="true">{{ paused ? '▶' : '❚❚' }}</span>
          {{ paused ? t('landing.resumeVideo') : t('landing.pauseVideo') }}
        </button>
        <p class="video-help">{{ t('landing.videoHelp') }}</p>
      </div>

      <button type="button" class="scroll-hint" @click="scrollToAbout">
        {{ t('landing.scrollHint') }}
      </button>

      <div class="footer-block">
        <p class="footer-title">{{ t('landing.footerTitle') }}</p>
        <p class="footer-note">{{ t('landing.footerNote') }}</p>
        <button type="button" class="read-more" @click="scrollToAbout">
          {{ t('landing.readMore') }}
        </button>
      </div>
    </section>

    <section id="about" class="about">
      <div class="about-text">
        <h3 class="section-title">{{ t('landing.aboutTitle') }}</h3>
        <p>{{ t('landing.aboutText1') }}</p>
        <p>{{ t('landing.aboutText2') }}</p>
        <p class="notice-sample">
          <MaintenanceNotice :route="NOTICE_SAMPLE" variant="pill" />
          <span class="notice-caption">{{ t('landing.noticeSample') }}</span>
        </p>
      </div>
      <ul class="promises">
        <li v-for="n in 4" :key="n" class="promise">
          <h4 class="promise-title">{{ t(`landing.promise${n}Title`) }}</h4>
          <p class="promise-text">{{ t(`landing.promise${n}Text`) }}</p>
        </li>
      </ul>
    </section>

    <section class="sources">
      <div class="about-text">
        <h3 class="section-title">{{ t('landing.sourcesTitle') }}</h3>
        <p>{{ t('landing.sourcesText') }}</p>
      </div>
      <ul class="source-list">
        <li v-for="n in 5" :key="n">{{ t(`landing.source${n}`) }}</li>
      </ul>
      <div class="disclaimer">
        <h4 class="promise-title">{{ t('landing.disclaimerTitle') }}</h4>
        <p class="promise-text">{{ t('landing.disclaimerText') }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Hero (UI-SPEC 2.1) */
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 100dvh;
  padding: 186px 34px 120px;
  background: var(--color-night);
  color: var(--color-on-night);
  overflow: hidden;
}
.media {
  position: absolute;
  inset: 0;
}
.media video,
.media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    var(--hero-scrim-92) 0 34%,
    var(--hero-scrim-72) 52%,
    var(--hero-scrim-34) 100%
  );
}
/* The header keeps its absolute position; :not(.header) keeps this rule from outranking it. */
.hero > :not(.media):not(.header) {
  position: relative;
}

.header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-16);
  height: 76px;
  padding: 0 34px;
}
.brand {
  display: flex;
  align-items: center;
  gap: var(--gap-12);
}
.name {
  font: 700 19px/1.2 var(--font-family);
  color: var(--color-white);
}
.subtitle {
  font: 400 12px/1.3 var(--font-family);
  color: var(--color-on-night-muted);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--gap-10);
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0 18px;
  border: 1.5px solid var(--hero-pill-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-on-night);
  font: 600 14px/1 var(--font-family);
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--motion-fast);
}
.pill:hover {
  background: var(--hero-control-bg);
}
.about-link {
  height: 38px;
}
.all-link {
  height: 44px;
  align-self: flex-start;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 26px;
  max-width: 780px;
}
.copy > p,
.copy > ul {
  margin: 0;
}
.title {
  margin: 0;
  font: 700 62px/1.08 var(--font-family);
  color: var(--color-white);
}
.title-mobile {
  display: none;
}
.lead {
  max-width: 600px;
  font: 400 19px/1.55 var(--font-family);
  color: var(--color-on-night-lead);
}
.eyebrow {
  font: 600 12px/1 var(--font-family);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-on-night-muted);
}

.themes {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch; /* equal card heights in a row when a tagline wraps */
  gap: var(--gap-10);
  padding: 0;
  list-style: none;
}
.themes > li {
  display: flex;
}
.theme-card {
  display: flex;
  flex-direction: column;
  gap: var(--gap-6);
  box-sizing: border-box;
  width: 148px;
  min-height: 44px;
  padding: 14px 14px 13px;
  border-top: 4px solid var(--card-color);
  border-radius: var(--radius-card-lg);
  background: var(--color-white);
  color: var(--color-ink);
  text-decoration: none;
  transition: transform var(--motion-fast);
}
.theme-card:hover {
  transform: translateY(-2px);
}
.theme-title {
  font: 700 16px/1.2 var(--font-family);
}
.theme-tagline {
  font: 400 12px/1.4 var(--font-family);
  color: var(--color-ink-muted);
}
.theme-count {
  margin-top: auto; /* pins the count line to the bottom so equal-height cards align */
  font: 700 13px/1.2 var(--font-family);
  color: var(--card-color);
}
.share-note {
  font: 400 14px/1.5 var(--font-family);
  color: var(--color-on-night-muted);
}
.url {
  font: var(--text-mono);
  font-size: 13px;
}

.video-controls {
  position: absolute;
  right: 34px;
  bottom: 34px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--gap-8);
  text-align: right;
}
.video-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-8);
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--hero-control-border);
  border-radius: 18px;
  background: var(--hero-control-bg);
  color: var(--color-on-night);
  font: var(--text-button);
  cursor: pointer;
}
.video-help {
  max-width: 230px;
  margin: 0;
  font: 400 11px/1.4 var(--font-family);
  color: var(--color-on-night-faint);
}
.scroll-hint {
  position: absolute;
  left: 50%;
  bottom: 34px;
  transform: translateX(-50%);
  min-height: 44px;
  padding: 0 var(--gap-12);
  border: 0;
  background: transparent;
  color: var(--color-on-night-muted);
  font: 400 12px/1.4 var(--font-family);
  cursor: pointer;
}
.footer-block {
  display: none;
}

/* Sections 2 and 3 (UI-SPEC 2.1) */
.about {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-40);
  padding: 56px 34px 46px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-white);
}
.about-text {
  flex: 0 1 420px;
  min-width: 0;
}
.about-text p {
  margin: 0 0 var(--gap-16);
  font: 400 16px/1.6 var(--font-family);
  color: var(--color-ink-prose);
}
.section-title {
  margin: 0 0 var(--gap-16);
  font: var(--text-section-heading);
}
.notice-sample {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gap-10);
}
.notice-caption {
  font: var(--text-caption-lg);
  color: var(--color-ink-muted);
}
.promises {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--gap-14);
  flex: 1 1 360px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.promise {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
}
.promise-title {
  margin: 0 0 var(--gap-6);
  font: 700 16px/1.2 var(--font-family);
}
.promise-text {
  margin: 0;
  font: 400 14px/1.55 var(--font-family);
  color: var(--color-ink-prose);
}

.sources {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-40);
  padding: 36px 34px 40px;
  background: var(--color-snow);
}
.source-list {
  flex: 1 1 260px;
  margin: 0;
  padding: 0;
  list-style: none;
  font: 400 13px/1.6 var(--font-family);
  color: var(--color-ink-soft);
}
.disclaimer {
  flex: 0 1 250px;
}

/* Mobile (UI-SPEC 2.2): poster only, vertical gradient, theme rows, footer block. */
@media (max-width: 699px) {
  .hero {
    padding: 110px 18px 20px;
  }
  .scrim {
    background: linear-gradient(
      180deg,
      var(--hero-scrim-60) 0 22%,
      var(--hero-scrim-90) 52%,
      var(--hero-scrim-96) 100%
    );
  }
  .header {
    top: 18px;
    height: auto;
    padding: 0 18px;
  }
  .brand :deep(.logo) {
    width: 34px;
    height: 34px;
  }
  .name {
    font-size: 17px;
  }
  .subtitle,
  .about-link {
    display: none;
  }
  .copy {
    gap: var(--gap-16);
  }
  .title {
    font: 700 32px/1.12 var(--font-family);
  }
  .title-desktop {
    display: none;
  }
  .title-mobile {
    display: inline;
  }
  .lead {
    font: 400 15px/1.5 var(--font-family);
  }
  .themes {
    flex-direction: column;
    gap: var(--gap-9);
  }
  .theme-card {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'title arrow'
      'sub arrow';
    align-items: center;
    column-gap: var(--gap-10);
    row-gap: 2px;
    width: auto;
    height: 62px;
    padding: 0 15px;
    border-top: 0;
    border-left: 5px solid var(--card-color);
  }
  .theme-title {
    grid-area: title;
  }
  .theme-tagline {
    display: none;
  }
  .theme-count {
    grid-area: sub;
    margin: 0;
    font: 400 12px/1.3 var(--font-family);
    color: var(--color-ink-muted);
  }
  .theme-arrow {
    grid-area: arrow;
    font: 700 17px/1 var(--font-family);
    color: var(--card-color);
  }
  .all-link {
    height: 50px;
    align-self: stretch;
  }
  .share-note,
  .scroll-hint,
  .video-controls {
    display: none;
  }
  .footer-block {
    display: flex;
    flex-direction: column;
    gap: var(--gap-4);
    margin-top: auto;
    padding-top: var(--gap-22);
  }
  .footer-block p {
    margin: 0;
  }
  .footer-title {
    font: 700 14px/1.3 var(--font-family);
    color: var(--color-white);
  }
  .footer-note {
    font: 400 13px/1.4 var(--font-family);
    color: var(--color-on-night-muted);
  }
  .read-more {
    align-self: flex-start;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-on-night-lead);
    font: 600 13px/1 var(--font-family);
    cursor: pointer;
  }
  .about,
  .sources {
    flex-direction: column;
    gap: var(--gap-22);
    padding: 36px 18px;
  }
  .about-text,
  .disclaimer {
    flex-basis: auto;
  }
  .promises {
    grid-template-columns: 1fr;
    flex-basis: auto;
  }
}
</style>
