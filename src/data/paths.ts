import { DATA_URL } from '../config'

/** Joins a path relative to the data root onto DATA_URL without producing double slashes. */
export function dataPath(relative: string, root: string = DATA_URL): string {
  return `${root.replace(/\/+$/, '')}/${relative.replace(/^\/+/, '')}`
}
