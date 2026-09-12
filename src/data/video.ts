/** Viewports narrower than this get the poster only (UI-SPEC 2.2, 2.3). */
export const VIDEO_MIN_WIDTH = 700

/** Connection types on which the hero video is not worth its bytes (UI-SPEC 2.3). */
const SLOW_CONNECTIONS = ['slow-2g', '2g', '3g']

export interface VideoConditions {
  width: number
  reducedMotion: boolean
  saveData: boolean
  effectiveType?: string
}

/**
 * Whether the hero `<video>` is rendered at all. Anything else shows the poster, so no video bytes
 * are fetched on phones, with reduced motion, or on slow or metered connections.
 */
export function shouldLoadVideo(c: VideoConditions): boolean {
  if (c.width < VIDEO_MIN_WIDTH) return false
  if (c.reducedMotion || c.saveData) return false
  return !SLOW_CONNECTIONS.includes(c.effectiveType ?? '')
}

/** Reads the conditions from the browser. Only called in the browser, from a component. */
export function browserVideoConditions(): VideoConditions {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection
  return {
    width: window.innerWidth,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: connection?.saveData === true,
    effectiveType: connection?.effectiveType,
  }
}
