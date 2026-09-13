/* eslint-disable */
/**
 * GENERATED FILE - do not edit by hand.
 * Source: publishedroute.schema.json (repo A, hubandcircles-manager/schema).
 * Regenerate with: npm run types
 */

export type AscentM = number | null
/**
 * @minItems 4
 * @maxItems 4
 */
export type Bbox = [number, number, number, number]
export type CoverImage = string | null
export type Difficulty = ('easy' | 'moderate' | 'demanding') | null
export type DominantSurface = string | null
export type Gpx = string | null
export type GpxBytes = number | null
export type Description = {
  [k: string]: string
} | null
export type Km = number | null
export type Media = string
export type Id = string
export type AssessedBy = string | null
export type AssessedOn = string | null
export type Endurance = ('green' | 'blue' | 'red' | 'black' | 'orange') | null
export type Exposure = number | null
export type Technical = ('green' | 'blue' | 'red' | 'black' | 'orange') | null
export type Wilderness = number | null
export type ItrsTechnicalShares = {
  [k: string]: number
} | null
export type LengthKm = number
export type LipasId = number | null
export type Maintainer = ('municipal' | 'non_municipal') | null
export type MaintenanceNote = {
  [k: string]: string
} | null
export type MaintenanceUrl = string | null
export type Author = string
export type License = string
export type Location = [number, number] | null
export type NearbyServices = string[]
export type NonMunicipalReasons = (
  | 'private_road_no_permission'
  | 'unmarked'
  | 'unmaintained'
  | 'everymans_rights_terrain'
  | 'seasonal'
)[]
export type Profile = [number, number][]
export type Seasons = string[]
export type Type = 'text'
export type Media2 = string[]
export type Type1 = 'gallery'
export type Type2 = 'video'
export type Url = string
export type Type3 = 'elevation_profile'
export type Sections = (TextSection | GallerySection | VideoSection | ElevationProfileSection)[]
export type EndKm = number
export type ItrsTechnical = ('green' | 'blue' | 'red' | 'black' | 'orange') | null
export type StartKm = number
export type Surface = ('asphalt' | 'paving' | 'gravel' | 'trail' | 'boardwalk' | 'snow') | null
export type Traffic = ('separated' | 'quiet' | 'busy') | null
export type Segments = PublishedSegment[]
export type SeparatedShare = number | null
export type SurfaceShares = {
  [k: string]: number
} | null
export type Themes = string[]
export type Track = string
export type TrafficShares = {
  [k: string]: number
} | null
export type WinterMaintenance = ('plowed' | 'groomed' | 'none') | null

export interface PublishedRoute {
  ascent_m?: AscentM
  bbox: Bbox
  cover_image?: CoverImage
  difficulty?: Difficulty
  dominant_surface?: DominantSurface
  gpx?: Gpx
  gpx_bytes?: GpxBytes
  hardest_section?: HardestSection | null
  id: Id
  itrs?: Itrs | null
  itrs_technical_shares?: ItrsTechnicalShares
  length_km: LengthKm
  lipas_id?: LipasId
  maintainer?: Maintainer
  maintenance_note?: MaintenanceNote
  maintenance_url?: MaintenanceUrl
  media?: Media1
  name: Name
  nearby_services?: NearbyServices
  non_municipal_reasons?: NonMunicipalReasons
  profile: Profile
  seasons: Seasons
  sections: Sections
  segments?: Segments
  separated_share?: SeparatedShare
  surface_shares?: SurfaceShares
  themes: Themes
  track: Track
  traffic_shares?: TrafficShares
  winter_maintenance?: WinterMaintenance
}
export interface HardestSection {
  description?: Description
  km?: Km
  media: Media
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
export interface Media1 {
  [k: string]: PublishedMedia
}
export interface PublishedMedia {
  author: Author
  license: License
  location?: Location
  sizes?: Sizes
}
export interface Sizes {
  [k: string]: string
}
export interface Name {
  [k: string]: string
}
export interface TextSection {
  content: Content
  type: Type
}
export interface Content {
  [k: string]: string
}
export interface GallerySection {
  media: Media2
  type: Type1
}
export interface VideoSection {
  type: Type2
  url: Url
}
export interface ElevationProfileSection {
  type: Type3
}
/**
 * Normalised segment (5.3): a gap is a segment whose attributes are all None.
 */
export interface PublishedSegment {
  end_km: EndKm
  itrs_technical?: ItrsTechnical
  start_km: StartKm
  surface?: Surface
  traffic?: Traffic
}
