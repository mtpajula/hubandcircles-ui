import { describe, expect, it } from 'vitest'
import fixture from '../test/fixtures/catalog.json'
import { render, text } from '../test/render'
import type { Catalog } from '../types/catalog'
import StatementPage from './StatementPage.vue'

const catalog = fixture as unknown as Catalog
const withRepo = {
  ...catalog,
  project: { ...catalog.project, feedback: { github_repo: 'mtpajula/hubandcircles-data' } },
} as unknown as Catalog

describe('StatementPage', () => {
  it('renders the accessibility statement in Finnish with the issues as a list', async () => {
    const html = await render(
      StatementPage,
      { catalog, lang: 'fi', page: 'accessibility' },
      'fi',
      '/fi/accessibility',
    )
    const t = text(html)
    expect(t).toContain('Saavutettavuusseloste')
    expect(t).toContain('Tunnetut puutteet')
    expect((html.match(/<li[ >]/g) ?? []).length).toBe(3)
    expect(html).toContain('href="/?lang=fi"') // brand and back link lead home, keeping the language
    expect(html).not.toContain('github.com') // no repository in the fixture → no link (P11)
  })

  it('renders the privacy statement in English and links the repository when the catalog names one', async () => {
    const html = await render(
      StatementPage,
      { catalog: withRepo, lang: 'en', page: 'privacy' },
      'en',
      '/en/privacy',
    )
    const t = text(html)
    expect(t).toContain('Privacy statement')
    expect(t).toContain('Third-party services')
    expect(html).not.toMatch(/<li[ >]/)
    expect(html).not.toContain('github.com') // the repository link belongs to the accessibility page only
    const a11y = await render(
      StatementPage,
      { catalog: withRepo, lang: 'en', page: 'accessibility' },
      'en',
      '/en/accessibility',
    )
    expect(a11y).toContain('href="https://github.com/mtpajula/hubandcircles-data"')
    expect(text(a11y)).toContain('Site data on GitHub')
  })

  it('keeps the page when switching language', async () => {
    const html = await render(
      StatementPage,
      { catalog, lang: 'fi', page: 'privacy' },
      'fi',
      '/fi/privacy',
    )
    expect(html).toContain('href="/en/privacy"')
  })
})
