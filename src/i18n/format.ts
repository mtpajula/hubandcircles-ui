/** Numbers formatted for the chosen language with the browser's Intl API (chapter 9). */
export function formatKm(lang: string, km: number): string {
  return new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(km)
}

export function formatM(lang: string, m: number): string {
  return new Intl.NumberFormat(lang, { maximumFractionDigits: 0 }).format(m)
}
