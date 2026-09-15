import { describe, expect, it } from 'vitest'
import { nextState, sheetInset, sheetQuery, sheetStateFromQuery } from './sheet'

describe('sheetStateFromQuery', () => {
  it('peeks only on ?sheet=peek and defaults to open', () => {
    expect(sheetStateFromQuery({ sheet: 'peek' })).toBe('peek')
    expect(sheetStateFromQuery({})).toBe('open')
    expect(sheetStateFromQuery({ sheet: 'open' })).toBe('open')
    expect(sheetStateFromQuery({ sheet: 'closed' })).toBe('open')
  })
})

describe('sheetQuery', () => {
  it('writes peek next to the other parameters and removes it for open', () => {
    expect(sheetQuery({ length: 'under20' }, 'peek')).toEqual({ length: 'under20', sheet: 'peek' })
    expect(sheetQuery({ length: 'under20', sheet: 'peek' }, 'open')).toEqual({ length: 'under20' })
    expect(sheetQuery({}, 'open')).toEqual({})
  })
})

describe('nextState', () => {
  it('toggles on a tap or a drag below the threshold', () => {
    expect(nextState('open')).toBe('peek')
    expect(nextState('peek')).toBe('open')
    expect(nextState('open', 10, 24)).toBe('peek')
    expect(nextState('peek', -10, 24)).toBe('open')
  })

  it('follows the drag direction past the threshold', () => {
    expect(nextState('open', 60, 24)).toBe('peek')
    expect(nextState('peek', 60, 24)).toBe('peek')
    expect(nextState('peek', -60, 24)).toBe('open')
    expect(nextState('open', -60, 24)).toBe('open')
  })
})

describe('sheetInset', () => {
  it('covers the viewport below 45 dvh when open and 64 px when peeking', () => {
    expect(sheetInset('open', 844)).toBeCloseTo(844 * 0.55)
    expect(sheetInset('peek', 844)).toBe(64)
  })

  it('leaves at least 200 px of map on short viewports', () => {
    expect(sheetInset('open', 320)).toBe(120)
    expect(sheetInset('open', 100)).toBe(0)
  })
})
