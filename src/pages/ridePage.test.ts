import { afterEach, describe, expect, it, vi } from 'vitest'
import fixture from '../test/fixtures/catalog.json'
import { render, text } from '../test/render'
import type { Catalog } from '../types/catalog'
import RidePage from './RidePage.vue'

// The map needs WebGL and the theme writes to `document`; neither exists in the test process.
// The data loaders stay pending: the tests cover the state before any file has arrived.
vi.mock('../theme', () => ({ applyTheme: () => undefined, cssVar: () => '#000000' }))
vi.mock('../map/worker', () => ({}))
vi.mock('../data/route', () => ({ loadRoute: () => new Promise(() => {}) }))
vi.mock('../data/track', () => ({ loadTrack: () => new Promise(() => {}) }))

const catalog = fixture as unknown as Catalog
const route = catalog.routes[0]!
const path = `/fi/${route.themes[0]}/route/${route.id}/ride`

afterEach(() => vi.unstubAllGlobals())

describe('RidePage (UI-SPEC 5.2)', () => {
  it('asks for the location with a button first and never calls geolocation on load', async () => {
    const watchPosition = vi.fn()
    vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch: vi.fn() } })
    const html = await render(RidePage, { catalog }, 'fi', path)
    const body = text(html)
    expect(body).toContain(route.name.fi)
    expect(body).toContain('Salli sijainti')
    expect(body).toContain('Lopeta')
    expect(body).not.toContain('Keskitä sijaintiin')
    expect(body).not.toContain('Sijaintia ei saatu')
    expect(watchPosition).not.toHaveBeenCalled()
    expect(html.match(/<button/g)).toHaveLength(2)
  })

  it('shows the message instead of the button when geolocation is absent', async () => {
    vi.stubGlobal('navigator', {})
    const html = await render(RidePage, { catalog }, 'en', path)
    const body = text(html)
    expect(body).toContain('Location is not available')
    expect(body).not.toContain('Allow location')
    expect(body).toContain('Stop')
    expect(body).toContain('The screen stays on if the browser supports it.')
  })
})
