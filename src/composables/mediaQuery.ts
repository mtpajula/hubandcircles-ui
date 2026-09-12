import { onScopeDispose, ref, type Ref } from 'vue'

/** Reactive `matchMedia` result, so that mobile-only markup (e.g. the hero image) is never rendered on desktop. */
export function useMediaQuery(query: string): Ref<boolean> {
  const mq = window.matchMedia(query)
  const matches = ref(mq.matches)
  const update = (e: MediaQueryListEvent) => (matches.value = e.matches)
  mq.addEventListener('change', update)
  onScopeDispose(() => mq.removeEventListener('change', update))
  return matches
}
