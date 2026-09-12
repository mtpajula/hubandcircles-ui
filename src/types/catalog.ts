/* eslint-disable */
/**
 * GENERATED FILE - do not edit by hand.
 * Source: catalog.schema.json (repo A, hubandcircles-manager/schema).
 * Regenerate with: npm run types
 */

export type GeneratedAt = string
export type Layers = {
  [k: string]: unknown
}[]
export type Overview = string
export type Area = [number, number, number, number] | null
export type DefaultLanguage = string
export type DefaultTheme = string
export type GithubRepo = string
export type IssueForm = string
export type Languages = string[]
export type AscentM = number | null
/**
 * @minItems 4
 * @maxItems 4
 */
export type Bbox = [number, number, number, number]
export type CoverImage = string | null
export type Id = string
export type LengthKm = number
export type Maintainer = ('municipal' | 'non_municipal') | null
export type Seasons = string[]
export type Themes = string[]
export type Routes = RouteSummary[]
export type SchemaVersion = 1
export type Services = string | null
export type Basemap = string | null
export type Highlight = string
export type Primary = string
export type Route = string
export type Dark = boolean
export type DefaultLayers = string[]
export type Icon = string | null
export type Id1 = string
export type Order = number
export type Tagline = {
  [k: string]: string
} | null
export type Themes1 = Theme[]

export interface Catalog {
  coverage?: Coverage
  generated_at: GeneratedAt
  layers?: Layers
  overview: Overview
  project: CatalogProject
  routes: Routes
  schema_version?: SchemaVersion
  services?: Services
  themes: Themes1
}
export interface Coverage {
  [k: string]: string
}
export interface CatalogProject {
  area?: Area
  default_language: DefaultLanguage
  default_theme: DefaultTheme
  feedback?: Feedback | null
  languages: Languages
  name: Name
  subtitle: Subtitle
}
export interface Feedback {
  github_repo: GithubRepo
  issue_form: IssueForm
}
export interface Name {
  [k: string]: string
}
export interface Subtitle {
  [k: string]: string
}
export interface RouteSummary {
  ascent_m?: AscentM
  bbox: Bbox
  cover_image?: CoverImage
  id: Id
  length_km: LengthKm
  maintainer?: Maintainer
  name: Name1
  seasons: Seasons
  themes: Themes
}
export interface Name1 {
  [k: string]: string
}
export interface Theme {
  basemap?: Basemap
  colors: Colors
  dark?: Dark
  default_layers?: DefaultLayers
  icon?: Icon
  id: Id1
  name: Name2
  order: Order
  tagline?: Tagline
}
export interface Colors {
  highlight: Highlight
  primary: Primary
  route: Route
}
export interface Name2 {
  [k: string]: string
}
