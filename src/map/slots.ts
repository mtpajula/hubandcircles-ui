/**
 * Fixed layer slots from bottom to top (ARKKITEHTUURI.md chapter 8). The basemap is always below
 * these. A layer card's `slot` refers to these names. The order lives in code only here.
 */
export const LAYER_SLOTS = ['base', 'raster', 'area', 'routes', 'points'] as const
export type LayerSlot = (typeof LAYER_SLOTS)[number]

/** Id of the MapLibre layer that anchors the slot (`beforeId`). */
export function slotAnchor(slot: LayerSlot): string {
  return `slot-${slot}`
}
