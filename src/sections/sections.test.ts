import { describe, expect, it } from 'vitest'
import { render, text } from '../test/render'
import type { PublishedRoute } from '../types/route'
import Gallery from './Gallery.vue'
import Video from './Video.vue'

const route = {
  id: 'r',
  media: {
    'media/a.jpg': {
      author: 'M. Pajula',
      license: 'CC BY 4.0',
      sizes: { '400': 'media/a-400.webp', '1600': 'media/a-1600.webp' },
    },
  },
} as unknown as PublishedRoute

describe('Gallery', () => {
  it('shows lazy 400 px thumbnails and skips media that was not built', async () => {
    const html = await render(Gallery, {
      section: { type: 'gallery', media: ['media/a.jpg', 'media/missing.jpg'] },
      route,
    })
    expect(html.match(/<img/g)).toHaveLength(1)
    expect(html).toContain('routes/r/media/a-400.webp')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('<dialog')
    expect(text(html)).toContain('Kuvat')
  })
  it('renders nothing when no entry has media (P11)', async () => {
    const html = await render(Gallery, { section: { type: 'gallery', media: ['x'] }, route })
    expect(text(html)).toBe('')
  })
})

describe('Video', () => {
  it('embeds YouTube through the nocookie domain, lazily and titled', async () => {
    const html = await render(
      Video,
      { section: { type: 'video', url: 'https://youtu.be/dQw4w9WgXcQ' } },
      'en',
    )
    expect(html).toContain('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('title="Video player"')
  })
  it('links other addresses instead of embedding them', async () => {
    const html = await render(Video, {
      section: { type: 'video', url: 'https://example.com/clip.mp4' },
    })
    expect(html).not.toContain('<iframe')
    expect(html).toContain('href="https://example.com/clip.mp4"')
    expect(text(html)).toContain('Avaa video')
  })
})
