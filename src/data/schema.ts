/** Supported catalog.json schema version (ARKKITEHTUURI.md chapter 11). */
export const SUPPORTED_SCHEMA_VERSION = 1 as const

export function isSupportedSchemaVersion(n: unknown): n is 1 {
  return n === SUPPORTED_SCHEMA_VERSION
}
