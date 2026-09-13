import { describe, expect, it } from 'vitest'
import { embedUrl, shouldLoadVideo } from './video'

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
