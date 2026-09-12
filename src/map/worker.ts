import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

/**
 * MapLibre 6 loads its worker from a separate file resolved against import.meta.url at runtime.
 * Vite cannot see that reference, so the production build ships without the worker and no
 * GeoJSON source ever finishes loading. `?worker&url` makes Vite bundle and emit the worker.
 */
setWorkerUrl(workerUrl)
