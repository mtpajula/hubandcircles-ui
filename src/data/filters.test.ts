import { describe, expect, it } from 'vitest'
import type { RouteSummary } from '../types/catalog'
import {
  applyFilters,
  filterOptions,
  filterQuery,
  hasUnknown,
  parseFilterQuery,
  type FilterModel,
} from './filters'

const base = {
  name: { fi: 'x' },
  themes: ['mtb'],
  seasons: [],
  bbox: [0, 0, 1, 1] as [number, number, number, number],
}
const routes: RouteSummary[] = [
  {
    ...base,
    id: 'short',
    length_km: 12,
    ascent_m: 90,
    difficulty: 'easy',
    dominant_surface: 'gravel',
    itrs: { technical: 'green' },
    separated_share: 0.8,
    winter_maintenance: 'groomed',
  },
  {
    ...base,
    id: 'mid',
    length_km: 30,
    ascent_m: 300,
    difficulty: 'moderate',
    dominant_surface: 'asphalt',
    itrs: { technical: 'red' },
    separated_share: 0.4,
    winter_maintenance: 'plowed',
  },
  { ...base, id: 'long', length_km: 55, ascent_m: 800, difficulty: 'demanding' },
  { ...base, id: 'blank', length_km: 40 },
]
const ids = (list: RouteSummary[]) => list.map((r) => r.id)
const model = (partial: Partial<FilterModel>): FilterModel => ({ hideUnknown: [], ...partial })

describe('applyFilters', () => {
  it('applies only the filters the theme lists', () => {
    expect(ids(applyFilters(routes, [], model({ length: 'under20' })))).toHaveLength(4)
  })
  it('filters length by range, 20–40 inclusive', () => {
    expect(ids(applyFilters(routes, ['length'], model({ length: 'under20' })))).toEqual(['short'])
    expect(ids(applyFilters(routes, ['length'], model({ length: '20to40' })))).toEqual([
      'mid',
      'blank',
    ])
    expect(ids(applyFilters(routes, ['length'], model({ length: 'over40' })))).toEqual(['long'])
  })
  it('filters ascent by range and keeps unknown ascent by default', () => {
    expect(ids(applyFilters(routes, ['ascent'], model({ ascent: '200to500' })))).toEqual([
      'mid',
      'blank',
    ])
    expect(ids(applyFilters(routes, ['ascent'], model({ ascent: 'over500' })))).toEqual([
      'long',
      'blank',
    ])
  })
  it('filters difficulty, dominant surface and winter maintenance by equality', () => {
    expect(ids(applyFilters(routes, ['difficulty'], model({ difficulty: 'easy' })))).toEqual([
      'short',
      'blank',
    ])
    expect(
      ids(applyFilters(routes, ['dominant_surface'], model({ dominant_surface: 'asphalt' }))),
    ).toEqual(['mid', 'long', 'blank'])
    expect(
      ids(applyFilters(routes, ['winter_maintenance'], model({ winter_maintenance: 'none' }))),
    ).toEqual(['long', 'blank'])
  })
  it('treats itrs_technical as the highest allowed level', () => {
    expect(
      ids(applyFilters(routes, ['itrs_technical'], model({ itrs_technical: 'blue' }))),
    ).toEqual(['short', 'long', 'blank'])
    expect(
      ids(applyFilters(routes, ['itrs_technical'], model({ itrs_technical: 'orange' }))),
    ).toHaveLength(4)
  })
  it('treats separated_share as the lowest allowed percentage', () => {
    expect(ids(applyFilters(routes, ['separated_share'], model({ separated_share: 40 })))).toEqual([
      'short',
      'mid',
      'long',
      'blank',
    ])
    expect(ids(applyFilters(routes, ['separated_share'], model({ separated_share: 41 })))).toEqual([
      'short',
      'long',
      'blank',
    ])
  })
  it('hides routes without the field only when its "no data" chip is off', () => {
    const off = model({ itrs_technical: 'blue', hideUnknown: ['itrs_technical'] })
    expect(ids(applyFilters(routes, ['itrs_technical'], off))).toEqual(['short'])
    const offOnly = model({ hideUnknown: ['ascent'] })
    expect(ids(applyFilters(routes, ['ascent'], offOnly))).toEqual(['short', 'mid', 'long'])
  })
})

describe('hasUnknown / filterOptions', () => {
  it('reports fields some route lacks', () => {
    expect(hasUnknown(routes, 'length')).toBe(false)
    expect(hasUnknown(routes, 'itrs_technical')).toBe(true)
  })
  it('lists the surfaces present in fixed order and the fixed ranges otherwise', () => {
    expect(filterOptions('dominant_surface', routes)).toEqual(['asphalt', 'gravel'])
    expect(filterOptions('length', routes)).toEqual(['under20', '20to40', 'over40'])
    expect(filterOptions('separated_share', routes)).toEqual([])
  })
})

describe('query string round trip', () => {
  const filters = ['length', 'itrs_technical', 'separated_share', 'dominant_surface'] as const
  it('parses known values and drops unknown ones', () => {
    expect(
      parseFilterQuery(
        {
          length: 'under20',
          itrs_technical: 'purple',
          separated_share: '35.6',
          dominant_surface: 'gravel',
          difficulty: 'easy',
          no_data_off: 'length,separated_share',
        },
        filters,
      ),
    ).toEqual({
      length: 'under20',
      separated_share: 36,
      dominant_surface: 'gravel',
      hideUnknown: ['length', 'separated_share'],
    })
    expect(parseFilterQuery({ length: 'far' }, filters)).toEqual({ hideUnknown: [] })
  })
  it('serialises the state without defaults', () => {
    expect(filterQuery({ hideUnknown: [] })).toEqual({})
    expect(
      filterQuery({ length: '20to40', separated_share: 40, hideUnknown: ['itrs_technical'] }),
    ).toEqual({ length: '20to40', separated_share: '40', no_data_off: 'itrs_technical' })
  })
})
