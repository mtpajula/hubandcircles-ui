import { describe, expect, it } from 'vitest'
import type { PublishedRoute } from '../types/route'
import { coverKey, heroImage, mediaPath } from './media'

const route = {
  id: 'r',
  cover_image: 'routes/r/media/cover-ab-400.webp',
  hardest_section: { media: 'media/rock.jpg', km: 1 },
  media: {
    'media/cover.jpg': {
      author: 'A',
      license: 'CC BY 4.0',
      sizes: { '400': 'media/cover-ab-400.webp', '1600': 'media/cover-ab-1600.webp' },
    },
    'media/rock.jpg': {
      author: 'A',
      license: 'CC BY 4.0',
      sizes: { '400': 'media/rock-cd-400.webp', '1600': 'media/rock-cd-1600.webp' },
    },
  },
} as unknown as PublishedRoute

describe('media paths', () => {
  it('resolves a size relative to the data root and null for unknown keys', () => {
    expect(mediaPath(route, 'media/rock.jpg', '1600')).toBe('routes/r/media/rock-cd-1600.webp')
    expect(mediaPath(route, 'media/nope.jpg', '400')).toBeNull()
  })
  it('finds the cover key from the cover_image path', () => {
    expect(coverKey(route)).toBe('media/cover.jpg')
    expect(coverKey({ ...route, cover_image: null })).toBeNull()
  })
  it('picks the hero per theme and falls back to the other picture', () => {
    expect(heroImage(route, 'hardest_section')?.small).toBe('routes/r/media/rock-cd-400.webp')
    expect(heroImage(route, 'cover_image')).toEqual({
      small: 'routes/r/media/cover-ab-400.webp',
      large: 'routes/r/media/cover-ab-1600.webp',
    })
    expect(heroImage({ ...route, hardest_section: null }, 'hardest_section')?.small).toBe(
      'routes/r/media/cover-ab-400.webp',
    )
    expect(
      heroImage({ ...route, cover_image: null, hardest_section: null }, 'cover_image'),
    ).toBeNull()
  })
})
