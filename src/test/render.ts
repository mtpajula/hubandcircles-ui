import { createSSRApp, h, type Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { i18n } from '../i18n'

/**
 * Renders a component to an HTML string with the real i18n messages, for component tests whose
 * logic cannot be extracted to a function (SKILL: tests). Server rendering needs no DOM.
 */
export async function render(
  component: Component,
  props: Record<string, unknown>,
  locale: 'fi' | 'en' = 'fi',
): Promise<string> {
  i18n.global.locale.value = locale
  const app = createSSRApp({ render: () => h(component, props) })
  app.use(i18n)
  return renderToString(app)
}

/** Visible text of rendered HTML: tags dropped, whitespace collapsed. */
export function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
