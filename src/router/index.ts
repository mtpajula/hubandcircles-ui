import { createRouter, createWebHashHistory } from 'vue-router'
import RouteCard from '../components/RouteCard.vue'
import RouteList from '../components/RouteList.vue'
import { useCatalog } from '../composables/useCatalog'
import { ALL_THEMES } from '../data/identifiers'
import { availableLanguages } from '../i18n'
import { resolveLanguage } from '../i18n/language'
import LandingPage from '../pages/LandingPage.vue'
import MapPage from '../pages/MapPage.vue'

function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/**
 * Hash routes (ARKKITEHTUURI.md 4.4): `#/` landing, `#/<lang>/<theme>/` map, `#/<lang>/all/` map
 * with every route, `#/<lang>/<theme>/route/<id>` route card. The pages receive the loaded
 * catalog as a prop from App.vue.
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'landing', component: LandingPage },
    {
      path: '/:lang/:theme',
      component: MapPage,
      children: [
        { path: '', name: 'theme', component: RouteList },
        { path: 'route/:id', name: 'route', component: RouteCard },
      ],
    },
    { path: '/:path(.*)*', redirect: '/' },
  ],
})

// The URL always carries a language and a theme (ARKKITEHTUURI.md 4.4, 9). The guard fills in and
// corrects them; an unknown theme falls back to the project default.
router.beforeEach(async (to) => {
  const { ready, catalog } = useCatalog()
  await ready
  const c = catalog.value
  if (!c || to.name === undefined || to.name === 'landing') return true

  const lang = resolveLanguage(
    param(to.params.lang),
    navigator.languages,
    availableLanguages(c.project.languages),
    c.project.default_language,
  )
  const requested = param(to.params.theme)
  const known = requested === ALL_THEMES || c.themes.some((t) => t.id === requested)
  const theme = known ? requested : c.project.default_theme

  if (lang === param(to.params.lang) && theme === requested) return true
  return { name: to.name, params: { ...to.params, lang, theme }, query: to.query, replace: true }
})
