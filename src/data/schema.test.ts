import { describe, expect, it } from 'vitest'
import { isSupportedSchemaVersion } from './schema'

describe('isSupportedSchemaVersion', () => {
  it('accepts version 1', () => {
    expect(isSupportedSchemaVersion(1)).toBe(true)
  })
  it('rejects version 2', () => {
    expect(isSupportedSchemaVersion(2)).toBe(false)
  })
  it('rejects the string "1"', () => {
    expect(isSupportedSchemaVersion('1')).toBe(false)
  })
  it('rejects a missing value', () => {
    expect(isSupportedSchemaVersion(undefined)).toBe(false)
    expect(isSupportedSchemaVersion(null)).toBe(false)
  })
})
