import { describe, expect, it } from 'vitest'
import type { NearbyEntry, ServiceProperties } from '../data/services'
import { render, text } from '../test/render'
import PoiPopup from './PoiPopup.vue'
import RouteServices from './RouteServices.vue'

const cafe: ServiceProperties = {
  id: 'osm:node/1',
  name: { fi: 'Kahvila Koti', en: 'Cafe Koti' },
  category: 'cafe',
  source: 'osm',
  fetched_at: '2026-09-13T18:20:53Z',
  url: 'https://www.openstreetmap.org/node/1',
}
const issue: ServiceProperties = {
  id: 'manual:fallen-tree',
  category: 'issue',
  source: 'manual',
  severity: 'medium',
  reported_at: '2026-09-01',
  valid_until: '2026-10-01',
}
const entry = (props: ServiceProperties, km: number): NearbyEntry => ({
  id: props.id,
  km,
  feature: {
    type: 'Feature',
    properties: props,
    geometry: { type: 'Point', coordinates: [25.7, 66.5] },
  },
})

describe('PoiPopup', () => {
  it('shows name, category, km, source with fetch date and the source link', async () => {
    const html = await render(PoiPopup, { service: cafe, km: 2.1, lang: 'fi', defaultLang: 'fi' })
    expect(text(html)).toBe(
      'Kahvila Koti kahvila · km 2,1 × Lähde: OpenStreetMap · haettu 13.9.2026 Näytä lähde',
    )
    expect(html).toContain('href="https://www.openstreetmap.org/node/1"')
    expect(html).toContain('rel="noopener"')
  })

  it('falls back to the default language name and hides missing fields (P11)', async () => {
    const html = await render(
      PoiPopup,
      {
        service: { ...cafe, name: { fi: 'Vain suomeksi' }, url: null, fetched_at: null },
        lang: 'en',
        defaultLang: 'fi',
      },
      'en',
    )
    expect(text(html)).toBe('Vain suomeksi café × Source: OpenStreetMap')
    expect(html).not.toContain('href=')
  })

  it('titles an unnamed issue by its category and lists severity and dates', async () => {
    const html = await render(PoiPopup, { service: issue, lang: 'fi', defaultLang: 'fi' })
    expect(text(html)).toBe(
      'ongelmakohta × Vakavuus medium Ilmoitettu 1.9.2026 Voimassa 1.10.2026 Lähde: ylläpitäjän merkintä',
    )
  })
})

describe('RouteServices', () => {
  const gap = { km: 9.7, start_km: 12.7, end_km: 22.4 }

  it('renders the caption, one row per entry and the longest gap', async () => {
    const html = await render(RouteServices, {
      entries: [
        entry(cafe, 2.1),
        entry({ ...cafe, id: 'osm:node/2', name: null, category: 'water' }, 8.7),
      ],
      categoriesFirst: ['water', 'lean_to'],
      gap,
      lang: 'fi',
      defaultLang: 'fi',
    })
    expect(text(html)).toBe(
      'Palvelut reitillä vesipiste ja laavu ensin Kahvila Koti km 2,1 vesipiste km 8,7 ' +
        'Pisin väli ilman palveluja 9,7 km km 12,7 → 22,4',
    )
    expect(html).toContain('aria-label="Kahvila Koti, km 2,1"')
  })

  it('joins three priority categories with commas in English', async () => {
    const html = await render(
      RouteServices,
      {
        entries: [entry(cafe, 1)],
        categoriesFirst: ['cafe', 'water', 'shop'],
        gap: null,
        lang: 'en',
        defaultLang: 'fi',
      },
      'en',
    )
    expect(text(html)).toBe('Services on the route café, water point and shop first Cafe Koti km 1')
  })

  it('renders nothing without entries and gap (P11)', async () => {
    const html = await render(RouteServices, {
      entries: [],
      categoriesFirst: ['water'],
      gap: null,
      lang: 'fi',
      defaultLang: 'fi',
    })
    expect(text(html)).toBe('')
  })
})
