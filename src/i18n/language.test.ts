import { describe, expect, it } from 'vitest'
import { langText, resolveLanguage } from './language'

const supported = ['fi', 'en']

describe('resolveLanguage', () => {
  it('URL language wins', () => {
    expect(resolveLanguage('en', ['fi'], supported, 'fi')).toBe('en')
  })
  it('unknown URL language is ignored', () => {
    expect(resolveLanguage('sv', ['en'], supported, 'fi')).toBe('en')
  })
  it('browser language if supported', () => {
    expect(resolveLanguage(undefined, ['sv', 'en'], supported, 'fi')).toBe('en')
  })
  it('en-US -> en', () => {
    expect(resolveLanguage(undefined, ['en-US'], supported, 'fi')).toBe('en')
  })
  it('otherwise the default', () => {
    expect(resolveLanguage(undefined, ['sv', 'de'], supported, 'fi')).toBe('fi')
    expect(resolveLanguage(undefined, [], supported, 'fi')).toBe('fi')
  })
})

describe('langText', () => {
  const obj = { fi: 'Moi', en: 'Hi' }
  it('chosen language', () => {
    expect(langText(obj, 'en', 'fi')).toBe('Hi')
  })
  it('missing -> default language', () => {
    expect(langText({ fi: 'Moi' }, 'en', 'fi')).toBe('Moi')
  })
  it('both missing -> first available', () => {
    expect(langText({ sv: 'Hej' }, 'en', 'fi')).toBe('Hej')
  })
  it('empty object -> empty string', () => {
    expect(langText({}, 'en', 'fi')).toBe('')
  })
})
