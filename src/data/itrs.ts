import { ITRS_LEVELS } from './identifiers'

export type ItrsLevel = (typeof ITRS_LEVELS)[number]

export function isItrsLevel(value: unknown): value is ItrsLevel {
  return (ITRS_LEVELS as readonly unknown[]).includes(value)
}

/** Level number shown before the name: green 1 … orange 5 (5.7). */
export function itrsNumber(level: ItrsLevel): number {
  return ITRS_LEVELS.indexOf(level) + 1
}
