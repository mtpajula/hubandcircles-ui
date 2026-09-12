/** Parses `#RRGGBB` (or `#RGB`) into channels 0-255; null for anything else. */
export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let s = m[1]!
  if (s.length === 3) s = [...s].map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)) as [number, number, number]
}

function toHex(channels: readonly number[]): string {
  return `#${channels.map((c) => Math.round(c).toString(16).padStart(2, '0').toUpperCase()).join('')}`
}

/**
 * Linear mix of a color towards white; `ratio` 0 keeps the color, 1 gives white.
 * Used for `--theme-route-other` (UI-SPEC 1.2: 50% mix with white). Computed here rather than
 * with CSS `color-mix()` so the result is a plain hex MapLibre paint properties can use.
 * Unparseable input is returned unchanged.
 */
export function mixWithWhite(hex: string, ratio: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return hex
  const r = Math.min(1, Math.max(0, ratio))
  return toHex(rgb.map((c) => c + (255 - c) * r))
}

/** `#RRGGBB` at the given alpha (0-1) as `#RRGGBBAA`; unparseable input is returned unchanged. */
export function withAlpha(hex: string, alpha: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return hex
  return (
    toHex(rgb) +
    Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  )
}
