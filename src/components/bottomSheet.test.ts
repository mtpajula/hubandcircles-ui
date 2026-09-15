import { describe, expect, it } from 'vitest'
import { render, text } from '../test/render'
import BottomSheet from './BottomSheet.vue'

describe('BottomSheet', () => {
  it('renders the open state with an expanded handle button and a scrolling body', async () => {
    const html = await render(BottomSheet, { state: 'open', title: 'Maasto · 3 / 5 reittiä' })
    expect(html).toMatch(/<aside[^>]*class="sheet open"/)
    expect(html).toMatch(/<button[^>]*type="button"[^>]*aria-expanded="true"/)
    expect(html).toMatch(/<div class="scroll content"/)
    expect(text(html)).toBe('Maasto · 3 / 5 reittiä Näytä tai pienennä')
  })

  it('renders the peek state collapsed', async () => {
    const html = await render(BottomSheet, { state: 'peek', title: 'Rollo' }, 'en')
    expect(html).toMatch(/<aside[^>]*class="sheet peek"/)
    expect(html).toContain('aria-expanded="false"')
    expect(html).toMatch(/<div class="content"/)
    expect(text(html)).toBe('Rollo Show or collapse')
  })
})
