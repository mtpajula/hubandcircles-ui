/** Browser language tag (`en-US`) -> base language (`en`). */
function baseLanguage(tag: string): string {
  return tag.toLowerCase().split('-')[0] ?? tag
}

/**
 * Language resolution in the order of ARKKITEHTUURI.md chapter 9:
 * URL language -> browser language if supported -> default language.
 */
export function resolveLanguage(
  urlLanguage: string | undefined,
  browserLanguages: readonly string[],
  supported: string[],
  fallback: string,
): string {
  if (urlLanguage && supported.includes(urlLanguage)) return urlLanguage
  for (const tag of browserLanguages) {
    const base = baseLanguage(tag)
    if (supported.includes(base)) return base
  }
  return fallback
}

/** Text of a content language object in the chosen language; missing -> default language -> first available. */
export function langText(obj: Record<string, string>, lang: string, defaultLang: string): string {
  return obj[lang] ?? obj[defaultLang] ?? Object.values(obj)[0] ?? ''
}
