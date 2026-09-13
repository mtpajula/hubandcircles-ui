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
export type Difficulty = ('easy' | 'moderate' | 'demanding') | null
export type DominantSurface = string | null
export type HardestImage = string | null
export type Id = string
export type AssessedBy = string | null
export type AssessedOn = string | null
export type Endurance = ('green' | 'blue' | 'red' | 'black' | 'orange') | null
export type Exposure = number | null
export type Technical = ('green' | 'blue' | 'red' | 'black' | 'orange') | null
export type Wilderness = number | null
export type LengthKm = number
export type Maintainer = ('municipal' | 'non_municipal') | null
export type Seasons = string[]
export type SeparatedShare = number | null
export type SurfaceShares = {
  [k: string]: number
} | null
export type Themes = string[]
export type WinterMaintenance = ('plowed' | 'groomed' | 'none') | null
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
export type Band = ('elevation' | 'surface' | 'traffic' | 'itrs_technical')[]
export type Filters = (
  | 'length'
  | 'ascent'
  | 'difficulty'
  | 'itrs_technical'
  | 'dominant_surface'
  | 'separated_share'
  | 'winter_maintenance'
)[]
export type HeroImage = 'cover_image' | 'hardest_section'
export type KeyFigures = (
  | 'length'
  | 'ascent'
  | 'difficulty'
  | 'itrs_technical'
  | 'itrs_endurance'
  | 'itrs_exposure'
  | 'itrs_wilderness'
  | 'dominant_surface'
  | 'surface_shares'
  | 'separated_share'
  | 'winter_maintenance'
  | 'longest_service_gap'
)[]
export type ServiceCategoriesFirst = string[]
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
/**
 * The route as listed in catalog.json: what the list card and the filters need (5.6).
 */
export interface RouteSummary {
  ascent_m?: AscentM
  bbox: Bbox
  cover_image?: CoverImage
  difficulty?: Difficulty
  dominant_surface?: DominantSurface
  hardest_image?: HardestImage
  id: Id
  itrs?: Itrs | null
  length_km: LengthKm
  maintainer?: Maintainer
  name: Name1
  seasons: Seasons
  separated_share?: SeparatedShare
  surface_shares?: SurfaceShares
  themes: Themes
  winter_maintenance?: WinterMaintenance
}
/**
 * ITRS assessment of the whole route (5.3). Every sub-field is optional (P11).
 */
export interface Itrs {
  assessed_by?: AssessedBy
  assessed_on?: AssessedOn
  endurance?: Endurance
  exposure?: Exposure
  technical?: Technical
  wilderness?: Wilderness
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
  presentation?: Presentation | null
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
/**
 * Which route facts come first in this theme (5.2). Lists hold 5.7 identifiers only,
 * in display order; the frontend falls back to length, ascent, elevation and cover image.
 */
export interface Presentation {
  band?: Band
  filters?: Filters
  hero_image?: HeroImage
  key_figures?: KeyFigures
  service_categories_first?: ServiceCategoriesFirst
}
