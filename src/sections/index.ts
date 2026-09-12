import type { Component } from 'vue'
import Text from './Text.vue'

/** Section types are code (P4): one component per type. V0: text only. */
const SECTIONS: Readonly<Record<string, Component>> = { text: Text }

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
