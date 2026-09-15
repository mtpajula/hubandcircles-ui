import { createSSRApp, h, type Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n } from '../i18n'

const Stub = { render: () => null }
/** Route names and paths of src/router/index.ts, with stub pages, so that RouterLink resolves hrefs. */
const ROUTES = [
  { path: '/', name: 'landing', component: Stub },
  { path: '/:lang/:page(accessibility|privacy)', name: 'statement', component: Stub },
  { path: '/:lang/:theme/route/:id/ride', name: 'ride', component: Stub },
  {
    path: '/:lang/:theme',
    component: Stub,
    children: [
      { path: '', name: 'theme', component: Stub },
      { path: 'route/:id', name: 'route', component: Stub },
    ],
  },
]

/**
 * Renders a component to an HTML string with the real i18n messages, for component tests whose
 * logic cannot be extracted to a function (SKILL: tests). Server rendering needs no DOM. With
 * `path` the component gets a router positioned at that path (memory history: hrefs have no `#`).
 */
export async function render(
  component: Component,
  props: Record<string, unknown>,
  locale: 'fi' | 'en' = 'fi',
  path?: string,
): Promise<string> {
  i18n.global.locale.value = locale
  const app = createSSRApp({ render: () => h(component, props) })
  app.use(i18n)
  if (path !== undefined) {
    const router = createRouter({ history: createMemoryHistory(), routes: ROUTES })
    await router.push(path)
    app.use(router)
  }
  return renderToString(app)
}

/** Visible text of rendered HTML: tags dropped, whitespace collapsed. */
export function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
