/** Numbers formatted for the chosen language with the browser's Intl API (chapter 9). */
export function formatKm(lang: string, km: number): string {
  return new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(km)
}

export function formatM(lang: string, m: number): string {
  return new Intl.NumberFormat(lang, { maximumFractionDigits: 0 }).format(m)
}

/** A share 0…1 as a whole percentage: fi "66 %", en "66%". */
export function formatPercent(lang: string, share: number): string {
  return new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 0 }).format(share)
}

/** File size for the GPX button: fi "12 kt" / "1,2 Mt", en "12 kB" / "1.2 MB". */
export function formatBytes(lang: string, bytes: number): string {
  const mega = bytes >= 1_000_000
  return new Intl.NumberFormat(lang, {
    style: 'unit',
    unit: mega ? 'megabyte' : 'kilobyte',
    maximumFractionDigits: mega ? 1 : 0,
  }).format(mega ? bytes / 1_000_000 : bytes / 1000)
}

/** ISO date (`2026-08-14`) as a numeric date: fi "14.8.2026", en "8/14/2026". Invalid -> as is. */
export function formatDate(lang: string, iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}
