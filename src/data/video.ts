/** Viewports narrower than this get the poster only (UI-SPEC 2.2, 2.3). */
export const VIDEO_MIN_WIDTH = 700

export interface VideoConditions {
  width: number
  reducedMotion: boolean
  saveData: boolean
  effectiveType?: string
}

/**
 * Whether the hero `<video>` is rendered at all (UI-SPEC 2.3). Only phones and the data-saver
 * setting get the poster alone; connection-type guesses were dropped because wired office
 * networks are routinely misreported. Reduced motion does not block loading – see `shouldAutoplay`.
 */
export function shouldLoadVideo(c: VideoConditions): boolean {
  return c.width >= VIDEO_MIN_WIDTH && !c.saveData
}

/** With reduced motion the video is loaded but starts only from the play button. */
export function shouldAutoplay(c: VideoConditions): boolean {
  return shouldLoadVideo(c) && !c.reducedMotion
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

/**
 * Privacy-friendly embed address of a video section url (UI-SPEC 4.2 item 8): YouTube through
 * `youtube-nocookie.com`, Vimeo through `player.vimeo.com`. Anything else is `null` and shown as
 * a plain link. Pure string matching, no network.
 */
export function embedUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^www\.|^m\./, '')
  const id = /^[\w-]+$/
  if (host === 'youtu.be') {
    const v = parsed.pathname.slice(1)
    return id.test(v) ? `https://www.youtube-nocookie.com/embed/${v}` : null
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v =
      parsed.searchParams.get('v') ??
      /^\/(?:shorts|embed)\/([\w-]+)/.exec(parsed.pathname)?.[1] ??
      ''
    return id.test(v) ? `https://www.youtube-nocookie.com/embed/${v}` : null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const v = /(\d+)\/?$/.exec(parsed.pathname)?.[1] ?? ''
    return v ? `https://player.vimeo.com/video/${v}` : null
  }
  return null
}
