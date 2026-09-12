import type { PublishedRoute } from '../types/route'

/** Loads one route.json written by the build. */
export async function loadRoute(url: string): Promise<PublishedRoute> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as PublishedRoute
}
