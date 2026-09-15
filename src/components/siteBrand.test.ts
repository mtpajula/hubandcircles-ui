import { describe, expect, it } from 'vitest'
import fixture from '../test/fixtures/catalog.json'
import { render, text } from '../test/render'
import type { Catalog } from '../types/catalog'
import SiteBrand from './SiteBrand.vue'

const catalog = fixture as unknown as Catalog

describe('SiteBrand', () => {
  it('links the logo, name and subtitle to the landing page with the current language', async () => {
    const html = await render(
      SiteBrand,
      { catalog, lang: 'en', selected: 'gravel' },
      'en',
      '/en/gravel',
    )
    expect(html).toMatch(/<a[^>]*href="\/\?lang=en"[^>]*aria-label="Home"/)
    expect(html).toContain('<svg')
    expect(text(html)).toContain(catalog.project.name.en ?? catalog.project.name.fi)
  })
})
