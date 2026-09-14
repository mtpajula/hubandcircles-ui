import { describe, expect, it } from 'vitest'
import { itrsFootnote, keyFigures, type KeyFigureSource } from './keyFigures'

const full: KeyFigureSource = {
  length_km: 21.3,
  ascent_m: 410,
  difficulty: 'demanding',
  itrs: {
    technical: 'red',
    endurance: 'blue',
    exposure: 1,
    wilderness: 2,
    assessed_by: 'M. Pajula',
    assessed_on: '2026-08-14',
  },
  dominant_surface: 'gravel',
  surface_shares: { gravel: 0.66, asphalt: 0.22, trail: 0.08, unknown: 0.04 },
  separated_share: 0.22,
  winter_maintenance: 'groomed',
}
const bare: KeyFigureSource = { length_km: 5 }

describe('keyFigures', () => {
  it('keeps the theme order and maps every id', () => {
    const ids = [
      'itrs_technical',
      'itrs_endurance',
      'length',
      'ascent',
      'difficulty',
      'itrs_exposure',
      'itrs_wilderness',
      'dominant_surface',
      'surface_shares',
      'separated_share',
      'winter_maintenance',
      'longest_service_gap',
    ] as const
    expect(keyFigures(ids, full)).toEqual([
      { id: 'itrs_technical', kind: 'itrs', level: 'red' },
      { id: 'itrs_endurance', kind: 'itrs', level: 'blue' },
      { id: 'length', kind: 'km', value: 21.3 },
      { id: 'ascent', kind: 'm', value: 410 },
      { id: 'difficulty', kind: 'term', group: 'difficulty', value: 'demanding' },
      { id: 'itrs_exposure', kind: 'number', value: 1 },
      { id: 'itrs_wilderness', kind: 'number', value: 2 },
      { id: 'dominant_surface', kind: 'term', group: 'surface', value: 'gravel' },
      { id: 'surface_shares', kind: 'shares', shares: full.surface_shares },
      { id: 'separated_share', kind: 'percent', value: 0.22 },
      { id: 'winter_maintenance', kind: 'term', group: 'winterMaintenance', value: 'groomed' },
    ])
  })

  it('hides missing data except ITRS technical/endurance, which read Not rated (P11)', () => {
    expect(
      keyFigures(
        ['itrs_technical', 'itrs_endurance', 'length', 'ascent', 'surface_shares', 'itrs_exposure'],
        bare,
      ),
    ).toEqual([
      { id: 'itrs_technical', kind: 'itrs', level: null },
      { id: 'itrs_endurance', kind: 'itrs', level: null },
      { id: 'length', kind: 'km', value: 5 },
    ])
    expect(keyFigures(['ascent'], { ...bare, ascent_m: null })).toEqual([])
    expect(keyFigures(['surface_shares'], { ...bare, surface_shares: {} })).toEqual([])
  })

  it('shows the longest service gap of the given theme only (5.3)', () => {
    const route = {
      ...bare,
      longest_service_gap: { mtb: { km: 9.7, start_km: 12.7, end_km: 22.4 } },
    }
    expect(keyFigures(['longest_service_gap'], route, Infinity, 'mtb')).toEqual([
      { id: 'longest_service_gap', kind: 'km', value: 9.7 },
    ])
    expect(keyFigures(['longest_service_gap'], route, Infinity, 'gravel')).toEqual([])
    expect(keyFigures(['longest_service_gap'], route)).toEqual([])
    expect(keyFigures(['longest_service_gap'], bare, Infinity, 'mtb')).toEqual([])
  })

  it('limits the number of shown tiles, not of theme ids', () => {
    const ids = ['length', 'ascent', 'surface_shares', 'itrs_endurance'] as const
    expect(keyFigures(ids, full, 3).map((f) => f.id)).toEqual([
      'length',
      'ascent',
      'surface_shares',
    ])
    expect(keyFigures(ids, { ...full, ascent_m: null }, 3).map((f) => f.id)).toEqual([
      'length',
      'surface_shares',
      'itrs_endurance',
    ])
  })
})

describe('itrsFootnote', () => {
  it('collects exposure, wilderness and the assessor', () => {
    expect(itrsFootnote(['length'], full)).toEqual({
      exposure: 1,
      wilderness: 2,
      assessedBy: 'M. Pajula',
      assessedOn: '2026-08-14',
    })
  })

  it('leaves out dimensions already shown as tiles', () => {
    expect(itrsFootnote(['itrs_wilderness'], full)?.wilderness).toBeNull()
    expect(itrsFootnote(['itrs_wilderness'], full)?.exposure).toBe(1)
  })

  it('is null without any ITRS data', () => {
    expect(itrsFootnote(['length'], bare)).toBeNull()
    expect(itrsFootnote(['itrs_exposure'], { itrs: { exposure: 3 } })).toBeNull()
  })
})
