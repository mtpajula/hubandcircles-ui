import { describe, expect, it } from 'vitest'
import { shouldLoadVideo } from './video'

const desktop = { width: 1440, reducedMotion: false, saveData: false, effectiveType: '4g' }

describe('shouldLoadVideo', () => {
  it('loads on a wide viewport with a good connection', () => {
    expect(shouldLoadVideo(desktop)).toBe(true)
    expect(shouldLoadVideo({ ...desktop, effectiveType: undefined })).toBe(true)
  })
  it('never loads below 700 px', () => {
    expect(shouldLoadVideo({ ...desktop, width: 699 })).toBe(false)
    expect(shouldLoadVideo({ ...desktop, width: 700 })).toBe(true)
  })
  it('honors prefers-reduced-motion', () => {
    expect(shouldLoadVideo({ ...desktop, reducedMotion: true })).toBe(false)
  })
  it('skips the video on metered or slow connections', () => {
    expect(shouldLoadVideo({ ...desktop, saveData: true })).toBe(false)
    expect(shouldLoadVideo({ ...desktop, effectiveType: '3g' })).toBe(false)
    expect(shouldLoadVideo({ ...desktop, effectiveType: '2g' })).toBe(false)
  })
})
