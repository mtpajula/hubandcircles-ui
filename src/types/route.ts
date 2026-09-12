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
export type Difficulty = string | null
export type Id = string
export type LengthKm = number
export type LipasId = number | null
export type Maintainer = ('municipal' | 'non_municipal') | null
export type Author = string
export type License = string
export type Location = [number, number] | null
export type NearbyServices = string[]
export type Profile = [number, number][]
export type Seasons = string[]
export type Type = 'text'
export type Media1 = string[]
export type Type1 = 'gallery'
export type Type2 = 'video'
export type Url = string
export type Type3 = 'elevation_profile'
export type Sections = (TextSection | GallerySection | VideoSection | ElevationProfileSection)[]
export type Themes = string[]
export type Track = string

export interface PublishedRoute {
  ascent_m?: AscentM
  bbox: Bbox
  cover_image?: CoverImage
  difficulty?: Difficulty
  id: Id
  length_km: LengthKm
  lipas_id?: LipasId
  maintainer?: Maintainer
  media?: Media
  name: Name
  nearby_services?: NearbyServices
  profile: Profile
  seasons: Seasons
  sections: Sections
  themes: Themes
  track: Track
}
export interface Media {
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
  media: Media1
  type: Type1
}
export interface VideoSection {
  type: Type2
  url: Url
}
export interface ElevationProfileSection {
  type: Type3
}
