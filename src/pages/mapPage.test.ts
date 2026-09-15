import { createSSRApp, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import RouteList from '../components/RouteList.vue'
import { i18n } from '../i18n'
import fixture from '../test/fixtures/catalog.json'
import { text } from '../test/render'
import type { Catalog } from '../types/catalog'
import MapPage from './MapPage.vue'

// The map needs WebGL and the theme writes to `document`; neither exists in the test process.
vi.mock('../map/MapView.vue', () => ({ default: { render: () => null } }))
vi.mock('../theme', () => ({ applyTheme: () => undefined }))
vi.mock('../composables/mediaQuery', () => ({ useMediaQuery: () => ref(true) }))
vi.mock('../composables/useCatalog', () => ({
  useCatalog: () => ({ themesInOrder: ref([]), ready: Promise.resolve() }),
}))
vi.stubGlobal('window', { innerHeight: 844 })

const catalog = fixture as unknown as Catalog
const Stub = { render: () => null }

/** MapPage with the real RouteList as its child view, at `path`, on a mobile viewport. */
async function renderMobile(path: string): Promise<string> {
  i18n.global.locale.value = 'fi'
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: Stub },
      { path: '/:lang/:theme', name: 'theme', component: RouteList },
      { path: '/:lang/:theme/route/:id', name: 'route', component: Stub },
      { path: '/:lang/:theme/route/:id/ride', name: 'ride', component: Stub },
    ],
  })
  await router.push(path)
  const app = createSSRApp({ render: () => h(MapPage, { catalog }) })
  app.use(i18n)
  app.use(router)
  return renderToString(app)
}

describe('MapPage below 700 px (UI-SPEC 5.0)', () => {
  it('renders the route list inside the bottom sheet with the theme and count in the peek row', async () => {
    const theme = catalog.themes[0]!
    const html = await renderMobile(`/fi/${theme.id}/`)
    expect(html).not.toContain('class="sidebar"')
    const sheet = /<aside[^>]*class="sheet open"[\s\S]*<\/aside>/.exec(html)?.[0] ?? ''
    expect(sheet).toContain('aria-expanded="true"')
    expect(sheet).toContain('class="list-page"')
    const total = catalog.routes.filter((r) => r.themes.includes(theme.id)).length
    expect(text(sheet)).toContain(`${theme.name.fi} · ${total} / ${total} reittiä`)
  })

  it('peeks when the query says so', async () => {
    const html = await renderMobile(`/fi/${catalog.themes[0]!.id}/?sheet=peek`)
    expect(html).toContain('class="sheet peek"')
    expect(html).toContain('aria-expanded="false"')
  })
})
