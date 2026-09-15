import { describe, expect, it } from 'vitest'
import css from './tokens.css?raw'

const darkBlock = /\[data-theme-dark\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''

describe('tokens.css dark theme (UI-SPEC 1.1)', () => {
  it.each([
    ['--surface-page', 'var(--color-night)'],
    ['--surface-card', '#1e3243'],
    ['--border-card', '#2c425a'],
    ['--text-strong', 'var(--color-on-night)'],
    ['--text-muted', 'var(--color-on-night-faint)'],
    ['--surface-placeholder', '#22384a'],
    ['--surface-inset', '#22384a'],
    ['--surface-overlay', '#1e3243f2'],
    ['--theme-accent', 'var(--theme-primary-tint)'],
  ])('sets %s to %s under [data-theme-dark]', (token, value) => {
    expect(darkBlock).toContain(`${token}: ${value};`)
  })

  it('declares every semantic token for the light theme too', () => {
    const tokens = [...darkBlock.matchAll(/--[\w-]+(?=:)/g)].map((m) => m[0])
    const light = css.slice(0, css.indexOf('[data-theme-dark]'))
    for (const token of tokens) expect(light).toContain(`${token}:`)
  })
})
