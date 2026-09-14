/* eslint-disable */
/**
 * GENERATED FILE - do not edit by hand.
 * Source: service.schema.json (repo A, hubandcircles-manager/schema).
 * Regenerate with: npm run types
 */

export type Category =
  | 'cafe'
  | 'restaurant'
  | 'shop'
  | 'accommodation'
  | 'bike_repair'
  | 'bike_rental'
  | 'water'
  | 'toilet'
  | 'lean_to'
  | 'hut'
  | 'issue'
export type Description = {
  [k: string]: string
} | null
export type FetchedAt = string | null
export type Id = string
/**
 * @minItems 2
 * @maxItems 2
 */
export type Location = [number, number]
export type Name = {
  [k: string]: string
} | null
export type OpeningHours = string | null
export type Report = string | null
export type ReportedAt = string | null
export type Severity = string | null
export type Source = 'osm' | 'visitfinland' | 'manual'
export type Url = string | null
export type ValidUntil = string | null

/**
 * `source:original_id`; a name is absent when the source has none (P11).
 */
export interface Service {
  category: Category
  description?: Description
  fetched_at?: FetchedAt
  id: Id
  location: Location
  name?: Name
  opening_hours?: OpeningHours
  report?: Report
  reported_at?: ReportedAt
  severity?: Severity
  source: Source
  url?: Url
  valid_until?: ValidUntil
}
