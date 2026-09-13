import { describe, expect, it } from 'vitest'
import { render, text } from '../test/render'
import GpxButton from './GpxButton.vue'
import ItrsBadge from './ItrsBadge.vue'
import KeyFigures from './KeyFigures.vue'
import MaintenanceNotice from './MaintenanceNotice.vue'
import ShareBar from './ShareBar.vue'

describe('ItrsBadge', () => {
  it('shows the number before the name in the level color', async () => {
    const html = await render(ItrsBadge, { level: 'red' })
    expect(text(html)).toBe('3 punainen')
    expect(html).toContain('var(--itrs-red)')
    expect(html).toContain('aria-label="3 punainen"')
  })

  it('renders Not rated for null', async () => {
    const html = await render(ItrsBadge, { level: null, size: 'sm' }, 'en')
    expect(text(html)).toBe('Not rated')
    expect(html).toContain('var(--itrs-none)')
  })
})

describe('ShareBar', () => {
  const shares = { unknown: 0.04, asphalt: 0.22, gravel: 0.66, trail: 0.08 }

  it('draws the shares largest first with unknown last and a text legend', async () => {
    const html = await render(ShareBar, { shares, kind: 'surface', lang: 'fi' })
    expect(text(html)).toBe('sora 66 % asfaltti 22 % polku 8 % tuntematon 4 %')
    expect(html).toContain('var(--surface-trail)')
    expect(html).toContain('var(--surface-unknown)')
    expect(html).toContain('flex:0.66')
  })

  it('labels ITRS shares with number and name', async () => {
    const html = await render(
      ShareBar,
      {
        shares: { green: 0.2, red: 0.8 },
        kind: 'itrs',
        lang: 'en',
      },
      'en',
    )
    expect(text(html)).toBe('3 red 80% 1 green 20%')
    expect(html).toContain('var(--itrs-red)')
  })

  it('skips ids outside the fixed list', async () => {
    const html = await render(ShareBar, {
      shares: { lava: 1, gravel: 0 },
      kind: 'surface',
      lang: 'fi',
    })
    expect(text(html)).toBe('')
  })
})

describe('GpxButton', () => {
  it('links the file for download with its size', async () => {
    const html = await render(GpxButton, { href: 'data/r/route.gpx', bytes: 1_234_567, lang: 'fi' })
    expect(html).toContain('href="data/r/route.gpx"')
    expect(html).toContain('download')
    expect(text(html)).toBe('Lataa GPX 1,2 Mt')
  })

  it('renders nothing without a file (P11)', async () => {
    expect(text(await render(GpxButton, { href: null, bytes: null, lang: 'fi' }))).toBe('')
  })
})

describe('MaintenanceNotice', () => {
  const route = {
    maintainer: 'non_municipal',
    non_municipal_reasons: ['unmarked', 'bogus', 'seasonal'],
    maintenance_note: { fi: 'Yksityistie km 12–17.' },
  }

  it('renders the pill only for non_municipal routes', async () => {
    expect(text(await render(MaintenanceNotice, { route, variant: 'pill' }))).toBe(
      'i Ei kunnan ylläpitämä',
    )
    for (const maintainer of ['municipal', null, undefined]) {
      expect(
        text(await render(MaintenanceNotice, { route: { maintainer }, variant: 'pill' })),
      ).toBe('')
    }
  })

  it('is a button only when interactive', async () => {
    expect(await render(MaintenanceNotice, { route, variant: 'pill' })).not.toContain('<button')
    expect(
      await render(MaintenanceNotice, { route, variant: 'pill', interactive: true }),
    ).toContain('<button')
  })

  it('lists the known reasons and the note in the panel', async () => {
    const html = await render(
      MaintenanceNotice,
      { route, variant: 'panel', lang: 'en', defaultLang: 'fi' },
      'en',
    )
    expect(html).toContain('id="maintenance-notice"')
    const t = text(html)
    expect(t).toContain('Not a municipally maintained route')
    expect(t).toContain('The route is not marked on the ground.')
    expect(t).toContain('Passable only part of the year.')
    expect(t).not.toContain('bogus')
    expect(t).toContain('Yksityistie km 12–17.')
  })
})

describe('KeyFigures', () => {
  const route = {
    length_km: 21.3,
    ascent_m: null,
    itrs: { endurance: 'blue', exposure: 1, assessed_by: 'M. Pajula', assessed_on: '2026-08-14' },
    surface_shares: { gravel: 0.66, asphalt: 0.34 },
  }

  it('renders tiles in theme order with badges, bars and the footnote', async () => {
    const html = await render(KeyFigures, {
      figures: ['itrs_technical', 'length', 'ascent', 'surface_shares', 'itrs_endurance'],
      route,
      lang: 'fi',
    })
    expect(text(html)).toBe(
      'Tekninen vaikeus (ITRS) Ei luokiteltu Pituus 21,3 km Pinta sora 66 % asfaltti 34 % ' +
        'Kestävyys (ITRS) 2 sininen Altistus 1 | Arvioija M. Pajula, 14.8.2026',
    )
  })

  it('limits the tiles and drops the footnote in the compact list form', async () => {
    const html = await render(
      KeyFigures,
      {
        figures: ['length', 'ascent', 'surface_shares', 'itrs_endurance'],
        route,
        lang: 'en',
        limit: 2,
        compact: true,
      },
      'en',
    )
    expect(text(html)).toBe('Length 21.3 km Surface gravel 66% asphalt 34%')
  })

  it('renders nothing when no figure has data', async () => {
    expect(text(await render(KeyFigures, { figures: ['ascent'], route, lang: 'fi' }))).toBe('')
  })
})
