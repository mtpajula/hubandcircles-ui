import { UNKNOWN } from './identifiers'

export interface Share {
  id: string
  share: number
}

/** Shares as drawn: largest first, `unknown` always last, zero shares dropped (UI-SPEC 4.2 item 6). */
export function orderedShares(shares: Record<string, number>): Share[] {
  return Object.entries(shares)
    .filter(([, share]) => share > 0)
    .map(([id, share]) => ({ id, share }))
    .sort((a, b) => {
      if (a.id === UNKNOWN) return 1
      if (b.id === UNKNOWN) return -1
      return b.share - a.share
    })
}
