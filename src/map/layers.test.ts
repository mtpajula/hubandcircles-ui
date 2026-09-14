import { describe, expect, it, vi } from 'vitest'
import type { PublishedLayer, Theme } from '../types/catalog'
import {
  available,
  availableLayers,
  coverageOn,
  coverageSpecs,
  initialState,
  isOn,
  layerSpecs,
  mergedAttribution,
  onInitially,
  parseNestedProperties,
  readState,
  storageKey,
  wmsTileUrl,
  writeState,
} from './layers'

const guide: PublishedLayer = {
  id: 'guide-map',
  name: { fi: 'Opaskartta', en: 'Guide map' },
  slot: 'base',
  type: 'wms',
  url: 'https://rovaniemi.asiointi.fi/teklaogcweb/WMS.ashx',
  wms: { version: '1.1.1', layers: 'Opaskartta_qgs', format: 'image/png', srs: 'EPSG:3857' },
  visible_in: { themes: ['road', 'gravel'], routes: [] },
  default_on: true,
  attribution: '© Rovaniemen kaupunki',
}
const toner: PublishedLayer = {
  id: 'toner',
  name: { fi: 'Toner', en: 'Toner' },
  slot: 'base',
  type: 'xyz',
  url: 'https://tiles.example/{z}/{x}/{y}.png',
  visible_in: { themes: ['winter'], routes: [] },
  default_on: true,
  minzoom: 0,
  maxzoom: 18,
  attribution: '© Stadia Maps © OpenStreetMap contributors',
}
const aerial: PublishedLayer = {
  id: 'aerial',
  name: { fi: 'Ilmakuva 2025', en: 'Aerial image 2025' },
  slot: 'raster',
  type: 'wms',
  url: 'https://rovaniemi.asiointi.fi/teklaogcweb/WMS.ashx',
  wms: { layers: 'Ilmakuva 2025' },
  visible_in: { themes: '*', routes: [] },
  default_on: false,
  opacity: 0.6,
  attribution: '© Rovaniemen kaupunki',
}
const shelters: PublishedLayer = {
  id: 'shelters',
  name: { fi: 'Laavut', en: 'Shelters' },
  slot: 'points',
  type: 'geojson',
  url: 'layers/shelters-15a68d.geojson',
  visible_in: { themes: ['winter', 'mtb'], routes: ['ounasvaara-gravel'] },
  default_on: false,
  attribution: '© OpenStreetMap contributors',
  fetched_at: '2026-09-13T18:20:53Z',
}
const bilberry: PublishedLayer = {
  id: 'bilberry',
  name: { fi: 'Mustikka', en: 'Bilberry' },
  slot: 'raster',
  type: 'pmtiles',
  url: 'layers/bilberry.pmtiles',
  visible_in: { themes: '*' },
  attribution: '© Luke',
}
const layers = [aerial, guide, shelters, toner, bilberry]

const theme = (overrides: Partial<Theme>): Theme => ({
  id: 'gravel',
  name: { fi: 'Sora' },
  order: 3,
  colors: { primary: '#9A6414', route: '#9A6414', highlight: '#E8A33D' },
  ...overrides,
})

describe('available()', () => {
  it('offers "*" layers everywhere, including the all view', () => {
    expect(available(aerial, 'gravel', null)).toBe(true)
    expect(available(aerial, null, null)).toBe(true)
  })
  it('offers listed themes and the open route only', () => {
    expect(available(guide, 'gravel', null)).toBe(true)
    expect(available(guide, 'mtb', null)).toBe(false)
    expect(available(guide, null, null)).toBe(false)
    expect(available(shelters, 'gravel', 'ounasvaara-gravel')).toBe(true)
    expect(available(shelters, 'gravel', 'other')).toBe(false)
  })
  it('keeps catalog order', () => {
    expect(availableLayers(layers, 'winter', null).map((l) => l.id)).toEqual([
      'aerial',
      'shelters',
      'toner',
      'bilberry',
    ])
  })
})

describe('onInitially() and initialState()', () => {
  it('is on from the theme list or default_on', () => {
    expect(onInitially(shelters, theme({ default_layers: ['shelters'] }))).toBe(true)
    expect(onInitially(shelters, theme({}))).toBe(false)
    expect(onInitially(guide, null)).toBe(true)
  })
  it('prefers the theme basemap, else the first base layer on initially', () => {
    const t = theme({ id: 'winter', basemap: 'toner', default_layers: ['shelters'] })
    const state = initialState(availableLayers(layers, 'winter', null), t)
    expect(state).toEqual({ base: 'toner', on: new Set(['shelters']) })
    expect(initialState([guide, toner], theme({ basemap: 'missing' })).base).toBe('guide-map')
    expect(initialState([aerial], theme({})).base).toBeNull()
  })
  it('isOn reads base and overlays from the right field', () => {
    const state = { base: 'toner', on: new Set(['aerial']) }
    expect(isOn(toner, state)).toBe(true)
    expect(isOn(guide, state)).toBe(false)
    expect(isOn(aerial, state)).toBe(true)
    expect(isOn(shelters, state)).toBe(false)
  })
})

describe('mergedAttribution()', () => {
  it('puts the basemap first and de-duplicates the visible layers', () => {
    const state = { base: 'guide-map', on: new Set(['aerial', 'shelters']) }
    expect(mergedAttribution(layers, state, '© OpenStreetMap-tekijät')).toBe(
      '© OpenStreetMap-tekijät · © Rovaniemen kaupunki · © OpenStreetMap contributors',
    )
  })
  it('is just the basemap when nothing is on', () => {
    expect(mergedAttribution(layers, { base: null, on: new Set() }, 'osm')).toBe('osm')
  })
})

describe('stored state', () => {
  const memory = () => {
    const data = new Map<string, string>()
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    }
  }
  it('round-trips and drops ids that are no longer available', () => {
    const storage = memory()
    writeState(storage, storageKey('winter'), { base: 'toner', on: new Set(['shelters', 'x']) })
    expect(storageKey(null)).toBe('layers:all')
    expect(readState(storage, 'layers:winter', [toner, shelters])).toEqual({
      base: 'toner',
      on: new Set(['shelters']),
    })
    expect(readState(storage, 'layers:winter', [guide, shelters])?.base).toBeNull()
  })
  it('tolerates garbage, a missing store and throwing storage', () => {
    const storage = memory()
    storage.setItem('k', '{not json')
    expect(readState(storage, 'k', layers)).toBeNull()
    expect(readState(null, 'k', layers)).toBeNull()
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    }
    expect(readState(broken, 'k', layers)).toBeNull()
    expect(() => writeState(broken, 'k', { base: null, on: new Set() })).not.toThrow()
  })
})

describe('layerSpecs()', () => {
  it('builds a WMS GetMap tile template with the bbox token', () => {
    expect(wmsTileUrl(guide)).toBe(
      'https://rovaniemi.asiointi.fi/teklaogcweb/WMS.ashx?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap' +
        '&LAYERS=Opaskartta_qgs&STYLES=&FORMAT=image%2Fpng&TRANSPARENT=true&SRS=EPSG%3A3857' +
        '&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}',
    )
    expect(wmsTileUrl(aerial)).toContain('&LAYERS=Ilmakuva%202025&')
    expect(wmsTileUrl({ url: 'https://x/wms?map=a', wms: { layers: 'l' } })).toMatch(
      /^https:\/\/x\/wms\?map=a&SERVICE=WMS/,
    )
  })
  it('makes a raster source and layer for wms and xyz with opacity and zoom range', () => {
    const wms = layerSpecs(aerial, '#000')!
    expect(wms.source).toEqual({ type: 'raster', tiles: [wmsTileUrl(aerial)], tileSize: 256 })
    expect(wms.layers).toEqual([
      {
        id: 'layer-aerial',
        type: 'raster',
        source: 'layer-aerial',
        paint: { 'raster-opacity': 0.6 },
      },
    ])
    const xyz = layerSpecs(toner, '#000')!
    expect(xyz.source).toMatchObject({ tiles: [toner.url], minzoom: 0, maxzoom: 18 })
    // Tool-tiled xyz layers carry a data-relative url (5.6).
    const topo = layerSpecs({ ...toner, url: 'layers/topo/v1/{z}/{x}/{y}.png' }, '#000')!
    expect(topo.source).toMatchObject({ tiles: ['./data/layers/topo/v1/{z}/{x}/{y}.png'] })
  })
  it('makes a geojson source and a white circle with the style or fallback stroke for points', () => {
    const specs = layerSpecs(shelters, '#2f6f7e')!
    expect(specs.source).toEqual({ type: 'geojson', data: './data/layers/shelters-15a68d.geojson' })
    expect(specs.layers).toHaveLength(1)
    expect(specs.layers[0]).toMatchObject({
      id: 'layer-shelters',
      type: 'circle',
      paint: { 'circle-radius': 6, 'circle-stroke-width': 2, 'circle-stroke-color': '#2f6f7e' },
    })
    const styled = layerSpecs({ ...shelters, style: { color: '#123456' } }, '#2f6f7e')!
    expect(styled.layers[0]).toMatchObject({ paint: { 'circle-stroke-color': '#123456' } })
  })
  it('makes fill and dashed line layers for area geojson', () => {
    const area: PublishedLayer = {
      ...shelters,
      id: 'zones',
      slot: 'area',
      style: { color: '#ff0000', width: 3, dashed: true, opacity: 0.5 },
      minzoom: 9,
    }
    const specs = layerSpecs(area, '#000')!
    expect(specs.layers.map((l) => [l.id, l.type])).toEqual([
      ['layer-zones-fill', 'fill'],
      ['layer-zones', 'line'],
    ])
    expect(specs.layers[1]).toMatchObject({
      minzoom: 9,
      paint: {
        'line-color': '#ff0000',
        'line-width': 3,
        'line-dasharray': [2, 2],
        'line-opacity': 0.5,
      },
    })
  })
  it('passes the maplibre dict through over the generated spec', () => {
    const custom = layerSpecs(
      { ...shelters, maplibre: { type: 'symbol', layout: { 'icon-image': 'hut' } } },
      '#000',
    )!
    expect(custom.layers[0]).toMatchObject({ id: 'layer-shelters', type: 'symbol' })
  })
  it('skips pmtiles with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(layerSpecs(bilberry, '#000')).toBeNull()
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})

describe('parseNestedProperties()', () => {
  it('restores flattened language objects and leaves other strings alone', () => {
    expect(
      parseNestedProperties({ id: 'a', name: '{"fi":"Laavu"}', category: 'lean_to', url: '{x' }),
    ).toEqual({ id: 'a', name: { fi: 'Laavu' }, category: 'lean_to', url: '{x' })
  })
})

describe('coverageSpecs()', () => {
  it('makes a dashed ink line per coverage entry whose layer is in the catalog, no fill', () => {
    const catalog = {
      layers: [toner, aerial],
      coverage: { toner: 'layers/toner-coverage.geojson', gone: 'layers/gone-coverage.geojson' },
    }
    const specs = coverageSpecs(catalog, '#101820')
    expect(specs).toHaveLength(1)
    expect(specs[0]!.layerId).toBe('toner')
    expect(specs[0]!.source).toEqual({
      type: 'geojson',
      data: './data/layers/toner-coverage.geojson',
    })
    expect(specs[0]!.layers).toEqual([
      {
        id: 'coverage-toner',
        type: 'line',
        source: 'coverage-toner',
        layout: { 'line-join': 'round' },
        paint: {
          'line-color': '#101820',
          'line-width': 1.5,
          'line-opacity': 0.35,
          'line-dasharray': [7 / 1.5, 7 / 1.5],
        },
      },
    ])
    expect(coverageSpecs({ layers: [toner] }, '#000')).toEqual([])
  })
  it('coverageOn() is true only while a covered layer is on', () => {
    const coverage = { toner: 'layers/toner-coverage.geojson' }
    expect(coverageOn(coverage, [toner, aerial])).toBe(true)
    expect(coverageOn(coverage, [aerial])).toBe(false)
    expect(coverageOn(undefined, [toner])).toBe(false)
  })
})
