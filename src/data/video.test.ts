import { describe, expect, it } from 'vitest'
import { embedUrl, shouldAutoplay, shouldLoadVideo } from './video'

const desktop = { width: 1440, reducedMotion: false, saveData: false, effectiveType: '4g' }

describe('shouldLoadVideo', () => {
  // UI-SPEC 2.3 gating table: only narrow viewports and save-data stop the load; connection
  // type is ignored and reduced motion only stops the autoplay.
  it.each([
    ['wide viewport, 4g', desktop, true],
    ['unknown connection type', { ...desktop, effectiveType: undefined }, true],
    ['3g (wired networks are misreported as 3g)', { ...desktop, effectiveType: '3g' }, true],
    ['2g (connection guesses are ignored)', { ...desktop, effectiveType: '2g' }, true],
    ['699 px', { ...desktop, width: 699 }, false],
    ['700 px', { ...desktop, width: 700 }, true],
    [
      'prefers-reduced-motion (loads, does not autoplay)',
      { ...desktop, reducedMotion: true },
      true,
    ],
    ['save-data', { ...desktop, saveData: true }, false],
  ])('%s → %s', (_name, conditions, expected) => {
    expect(shouldLoadVideo(conditions)).toBe(expected)
  })

  it('autoplays only without reduced motion', () => {
    expect(shouldAutoplay(desktop)).toBe(true)
    expect(shouldAutoplay({ ...desktop, reducedMotion: true })).toBe(false)
    expect(shouldAutoplay({ ...desktop, width: 600 })).toBe(false)
  })
})

describe('embedUrl', () => {
  it('maps YouTube addresses to the nocookie embed', () => {
    const embed = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    expect(embedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toBe(embed)
    expect(embedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(embed)
    expect(embedUrl('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe(embed)
  })
  it('maps Vimeo addresses to the player', () => {
    expect(embedUrl('https://vimeo.com/123456')).toBe('https://player.vimeo.com/video/123456')
  })
  it('returns null for anything else', () => {
    expect(embedUrl('https://example.com/video.mp4')).toBeNull()
    expect(embedUrl('not a url')).toBeNull()
    expect(embedUrl('https://www.youtube.com/watch?v=<script>')).toBeNull()
  })
})
