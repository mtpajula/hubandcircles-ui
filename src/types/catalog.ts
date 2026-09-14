/* eslint-disable */
/**
 * GENERATED FILE - do not edit by hand.
 * Source: catalog.schema.json (repo A, hubandcircles-manager/schema).
 * Regenerate with: npm run types
 */

export type GeneratedAt = string
export type Attribution = string
export type DefaultOn = boolean
export type FetchedAt = string | null
export type Id = string
export type Color = string
export type Legend = LegendEntry[]
export type Maplibre = {
  [k: string]: unknown
} | null
export type Maxzoom = number | null
export type Minzoom = number | null
export type Opacity = number | null
export type Slot = 'base' | 'raster' | 'area' | 'routes' | 'points'
export type Color1 = string | null
export type Dashed = boolean | null
export type Icon = string | null
export type Opacity1 = number | null
export type Width = number | null
export type Type = 'xyz' | 'pmtiles' | 'geojson' | 'wms'
export type Url = string
export type Routes = string[]
export type Themes = '*' | string[]
export type Format = string
export type Layers1 = string
export type Srs = string
export type Version = string
export type Layers = PublishedLayer[]
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
export type Id1 = string
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
export type Themes1 = string[]
export type WinterMaintenance = ('plowed' | 'groomed' | 'none') | null
export type Routes1 = RouteSummary[]
export type SchemaVersion = 1
export type Services = string | null
export type Basemap = string | null
export type Highlight = string
export type Primary = string
export type Route = string
export type Dark = boolean
export type DefaultLayers = string[]
export type Icon1 = string | null
export type Id2 = string
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
export type Themes2 = Theme[]

export interface Catalog {
  coverage?: Coverage
  generated_at: GeneratedAt
  layers?: Layers
  overview: Overview
  project: CatalogProject
  routes: Routes1
  schema_version?: SchemaVersion
  services?: Services
  themes: Themes2
}
export interface Coverage {
  [k: string]: string
}
/**
 * A layer as listed in catalog.json (5.4): the frontend side of the card. `source` and
 * `publish_format` are gone; `type`, `url`, `legend` and `fetched_at` come from the build.
 */
export interface PublishedLayer {
  attribution: Attribution
  default_on?: DefaultOn
  fetched_at?: FetchedAt
  id: Id
  legend?: Legend
  maplibre?: Maplibre
  maxzoom?: Maxzoom
  minzoom?: Minzoom
  name: Name
  opacity?: Opacity
  slot: Slot
  style?: VectorStyle | null
  type: Type
  url: Url
  visible_in: VisibleIn
  wms?: Wms | null
}
/**
 * One row of a raster legend (5.4): the colour and its label.
 */
export interface LegendEntry {
  color: Color
  label: Label
}
export interface Label {
  [k: string]: string
}
export interface Name {
  [k: string]: string
}
/**
 * Simplified vector style (5.4); the frontend adapter turns it into MapLibre paint.
 */
export interface VectorStyle {
  color?: Color1
  dashed?: Dashed
  icon?: Icon
  opacity?: Opacity1
  width?: Width
}
/**
 * Where the layer is offered (5.4): every theme or the listed ones, plus open routes.
 */
export interface VisibleIn {
  routes?: Routes
  themes?: Themes
}
/**
 * GetMap parameters of a `wms` layer.
 */
export interface Wms {
  format?: Format
  layers: Layers1
  srs?: Srs
  version?: Version
}
export interface CatalogProject {
  area?: Area
  default_language: DefaultLanguage
  default_theme: DefaultTheme
  feedback?: Feedback | null
  languages: Languages
  name: Name1
  subtitle: Subtitle
}
export interface Feedback {
  github_repo: GithubRepo
  issue_form: IssueForm
}
export interface Name1 {
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
  id: Id1
  itrs?: Itrs | null
  length_km: LengthKm
  maintainer?: Maintainer
  name: Name2
  seasons: Seasons
  separated_share?: SeparatedShare
  surface_shares?: SurfaceShares
  themes: Themes1
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
export interface Name2 {
  [k: string]: string
}
export interface Theme {
  basemap?: Basemap
  colors: Colors
  dark?: Dark
  default_layers?: DefaultLayers
  icon?: Icon1
  id: Id2
  name: Name3
  order: Order
  presentation?: Presentation | null
  tagline?: Tagline
}
export interface Colors {
  highlight: Highlight
  primary: Primary
  route: Route
}
export interface Name3 {
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
