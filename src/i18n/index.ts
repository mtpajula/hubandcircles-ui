import { createI18n } from 'vue-i18n'
import fi from '../locales/fi.json'
import en from '../locales/en.json'

/** Languages the frontend has a locale file for. Offered are those also listed in the catalog (chapter 9). */
export const TRANSLATED_LANGUAGES = ['fi', 'en'] as const

export const i18n = createI18n({
  legacy: false,
  locale: 'fi',
  fallbackLocale: 'fi',
  messages: { fi, en },
})

export function availableLanguages(catalogLanguages: readonly string[]): string[] {
  return TRANSLATED_LANGUAGES.filter((l) => catalogLanguages.includes(l))
}

export function setLanguage(lang: string): void {
  i18n.global.locale.value = lang as 'fi' | 'en'
  document.documentElement.lang = lang
}
