// Build-time configuration (ARKKITEHTUURI.md 4.4). The only network addresses the frontend uses.
export const DATA_URL: string = import.meta.env.VITE_DATA_URL ?? './data/'
export const BASEMAP_URL: string =
  import.meta.env.VITE_BASEMAP_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
