import { describe, expect, it } from 'vitest'
import { render, text } from '../test/render'
import type { PublishedSegment } from '../types/route'
import RouteBand from './RouteBand.vue'
import RouteFilters from './RouteFilters.vue'

const profile: [number, number][] = [
  [0, 100],
  [0.65, 150],
  [1.3, 120],
]
const segments: PublishedSegment[] = [
  { start_km: 0, end_km: 0.4, surface: 'asphalt', traffic: 'separated' },
  { start_km: 0.4, end_km: 0.9, surface: 'gravel', traffic: 'quiet', itrs_technical: 'green' },
  { start_km: 0.9, end_km: 1.0 },
  { start_km: 1.0, end_km: 1.3, surface: 'trail', itrs_technical: 'red' },
]

describe('RouteBand', () => {
  it('draws the theme lanes with data, the axis, the legend and the cursor tooltip', async () => {
    const html = await render(RouteBand, {
      profile,
      segments,
      lanes: ['elevation', 'itrs_technical', 'surface', 'traffic'],
      lengthKm: 1.3,
      lang: 'fi',
      cursorKm: 1.1,
    })
    expect(html).toContain('role="slider"')
    expect(html).toContain('aria-valuenow="1.1"')
    expect(html).toContain('var(--itrs-red)')
    expect(html).toContain('var(--surface-trail)')
    expect(html).toContain('var(--surface-unknown)')
    expect(html).toContain('km 1,1 · 129 m / 3 punainen · polku')
    const visible = text(html)
    expect(visible).toContain('0 km')
    expect(visible).toContain('1,3 km')
    expect(visible).toContain('Ei luokiteltu')
    expect(visible).toContain('tuntematon')
  })
  it('hides lanes without data and renders nothing without profile and lanes (P11)', async () => {
    const bare = [{ start_km: 0, end_km: 1.3 }]
    const html = await render(RouteBand, {
      profile,
      segments: bare,
      lanes: ['elevation', 'surface'],
      lengthKm: 1.3,
      lang: 'en',
    })
    expect(html).not.toContain('class="lane"')
    expect(html).toContain('<svg')
    const empty = await render(RouteBand, {
      profile: [],
      segments: bare,
      lanes: ['elevation', 'surface'],
      lengthKm: 1.3,
      lang: 'en',
    })
    expect(text(empty)).toBe('')
  })
})

describe('RouteFilters', () => {
  const routes = [
    { id: 'a', length_km: 12, itrs: { technical: 'green' }, separated_share: 0.5 },
    { id: 'b', length_km: 30 },
  ]
  it('renders the theme filters in order with pressed chips and the info box', async () => {
    const html = await render(RouteFilters, {
      themeName: 'Maasto',
      shown: 1,
      total: 2,
      filters: ['itrs_technical', 'length', 'separated_share'],
      routes,
      lang: 'fi',
      modelValue: { length: 'under20', itrs_technical: 'blue', hideUnknown: ['itrs_technical'] },
    })
    const visible = text(html)
    expect(visible).toContain('Maasto 1 / 2 reittiä')
    expect(visible.indexOf('Tekninen vaikeus')).toBeLessThan(visible.indexOf('Pituus'))
    expect(visible).toContain('Rajaus jätti 1 reitin pois.')
    expect(html).toMatch(/aria-pressed="true"[^>]*>(<!---->)? alle 20 km/)
    expect(html).toMatch(/aria-pressed="false"[^>]*>(<!---->)? 20–40 km/)
    expect(html).toContain('type="range"')
    expect(html.match(/ei tietoa/g)).toHaveLength(2)
    expect(html.match(/class="outlined level"/g)).toHaveLength(3)
  })
})
