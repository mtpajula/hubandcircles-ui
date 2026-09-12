import { computed, ref } from 'vue'
import { dataPath } from '../data/paths'
import { isSupportedSchemaVersion } from '../data/schema'
import type { Catalog, Theme } from '../types/catalog'

export type CatalogState = 'loading' | 'ready' | 'error'

const state = ref<CatalogState>('loading')
const catalog = ref<Catalog | null>(null)
/** Translation key shown in the error state (`error.*`). */
const errorKey = ref<string | null>(null)
let loadPromise: Promise<void> | null = null

async function load(): Promise<void> {
  try {
    const response = await fetch(dataPath('catalog.json'))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data: unknown = await response.json()
    const version = (data as { schema_version?: unknown } | null)?.schema_version
    if (!isSupportedSchemaVersion(version)) {
      errorKey.value = 'error.schemaVersion'
      state.value = 'error'
      return
    }
    catalog.value = data as Catalog
    state.value = 'ready'
  } catch (e) {
    console.warn('catalog.json could not be loaded', e)
    errorKey.value = 'error.load'
    state.value = 'error'
  }
}

/** Shared catalog state. Loading starts on the first call, exactly once. */
export function useCatalog() {
  loadPromise ??= load()
  const themesInOrder = computed<Theme[]>(() =>
    [...(catalog.value?.themes ?? [])].sort((a, b) => a.order - b.order),
  )
  return { state, catalog, errorKey, ready: loadPromise, themesInOrder }
}
