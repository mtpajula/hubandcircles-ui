import type { Component } from 'vue'
import Gallery from './Gallery.vue'
import Text from './Text.vue'
import Video from './Video.vue'

/**
 * Section types are code (P4): one component per type. `elevation_profile` is drawn by the route
 * card itself (it is the band's elevation lane), so it is not listed here.
 */
const SECTIONS: Readonly<Record<string, Component>> = { text: Text, gallery: Gallery, video: Video }

const warned = new Set<string>()

/** Unknown or not yet implemented section type -> console warning and skip, never a crash. */
export function sectionComponent(type: string): Component | null {
  const component = SECTIONS[type]
  if (component) return component
  if (!warned.has(type)) {
    warned.add(type)
    console.warn(`Section type "${type}" is not supported, skipping.`)
  }
  return null
}
