/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_URL?: string
  readonly VITE_BASEMAP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
