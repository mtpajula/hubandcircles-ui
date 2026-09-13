import { describe, expect, it } from 'vitest'
import fixture from '../test/fixtures/catalog.json'
import type { Theme } from '../types/catalog'
import { cardTheme, DEFAULT_PRESENTATION, presentationOf } from './presentation'

const themes = fixture.themes as Theme[]
const mtb = themes.find((t) => t.id === 'mtb')!

describe('presentationOf', () => {
  it('returns the theme lists in their order', () => {
    expect(presentationOf(mtb).key_figures).toEqual([
      'itrs_technical',
      'itrs_endurance',
      'length',
      'ascent',
    ])
    expect(presentationOf(mtb).hero_image).toBe('hardest_section')
  })

  it('falls back to length, ascent, elevation and cover image (5.2)', () => {
    expect(presentationOf(null)).toEqual(DEFAULT_PRESENTATION)
    expect(presentationOf({ ...mtb, presentation: null })).toEqual(DEFAULT_PRESENTATION)
    expect(presentationOf({ ...mtb, presentation: undefined })).toEqual(DEFAULT_PRESENTATION)
  })

  it('fills only the missing lists', () => {
    const p = presentationOf({ ...mtb, presentation: { band: ['elevation', 'surface'] } })
    expect(p.band).toEqual(['elevation', 'surface'])
    expect(p.key_figures).toEqual(['length', 'ascent'])
  })
})

describe('cardTheme', () => {
  it('keeps the current theme', () => {
    expect(cardTheme(themes, mtb, ['gravel'])?.id).toBe('mtb')
  })

  it("uses the route's first theme under all, and null when unknown", () => {
    expect(cardTheme(themes, null, ['gravel', 'touring'])?.id).toBe('gravel')
    expect(cardTheme(themes, null, ['unknown'])).toBeNull()
    expect(cardTheme(themes, null, [])).toBeNull()
  })
})
