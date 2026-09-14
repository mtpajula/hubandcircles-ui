import { describe, expect, it } from 'vitest'
import { render, text } from '../test/render'
import LayerPicker from './LayerPicker.vue'
import Legend from './Legend.vue'
import type { PublishedLayer } from '../types/catalog'

const guide: PublishedLayer = {
  id: 'guide-map',
  name: { fi: 'Opaskartta', en: 'Guide map' },
  slot: 'base',
  type: 'wms',
  url: 'https://example/wms',
  wms: { layers: 'Opaskartta' },
  visible_in: { themes: '*' },
  attribution: '© Rovaniemen kaupunki',
}
const shelters: PublishedLayer = {
  id: 'shelters',
  name: { fi: 'Laavut ja tuvat', en: 'Shelters and huts' },
  slot: 'points',
  type: 'geojson',
  url: 'layers/shelters.geojson',
  visible_in: { themes: '*' },
  attribution: '© OpenStreetMap contributors',
  fetched_at: '2026-09-13T18:20:53Z',
}
const bilberry: PublishedLayer = {
  id: 'bilberry',
  name: { fi: 'Mustikkasato', en: 'Bilberry yield' },
  slot: 'raster',
  type: 'wms',
  url: 'https://example/wms',
  wms: { layers: 'b' },
  visible_in: { themes: '*' },
  attribution: '© Luke',
  legend: [
    { color: '#f1eef6', label: { fi: 'Heikko', en: 'Poor' } },
    { color: '#0570b0', label: { fi: 'Erinomainen', en: 'Excellent' } },
  ],
}

describe('LayerPicker', () => {
  it('lists base layers as radios with "no base map" and the others as checkboxes', async () => {
    const html = await render(LayerPicker, {
      layers: [guide, shelters],
      state: { base: 'guide-map', on: new Set<string>() },
      lang: 'fi',
      defaultLang: 'fi',
    })
    expect(text(html)).toBe(
      'Pohjakartta Opaskartta © Rovaniemen kaupunki Ei pohjakarttaa Tasot Laavut ja tuvat ' +
        '© OpenStreetMap contributors · haettu 13.9.2026',
    )
    expect(html.match(/type="radio"/g)).toHaveLength(2)
    expect(html).toMatch(/type="radio"[^>]*value="guide-map"[^>]*checked/)
    expect(html).toMatch(/type="checkbox"[^>]*value="shelters"(?![^>]*checked)/)
    expect(html).toContain('id="layer-picker"')
  })

  it('hides an empty section and reads names in the chosen language', async () => {
    const html = await render(
      LayerPicker,
      {
        layers: [shelters],
        state: { base: null, on: new Set(['shelters']) },
        lang: 'en',
        defaultLang: 'fi',
      },
      'en',
    )
    expect(text(html)).toBe(
      'Layers Shelters and huts © OpenStreetMap contributors · fetched 9/13/2026',
    )
    expect(html).toMatch(/type="checkbox"[^>]*checked/)
  })
})

describe('Legend with raster layers', () => {
  it('lists the legend entries of raster layers that are on', async () => {
    const html = await render(Legend, {
      theme: null,
      layers: [guide, bilberry],
      lang: 'fi',
      defaultLang: 'fi',
    })
    expect(text(html)).toContain('Mustikkasato Heikko Erinomainen')
    expect(html).toContain('background:#0570b0')
    expect(text(html)).not.toContain('Opaskartta')
  })
})
