export type Bbox = [number, number, number, number]

/** Union of bboxes [west, south, east, north]; null for an empty list. */
export function unionBboxes(bboxes: readonly Bbox[]): Bbox | null {
  if (bboxes.length === 0) return null
  return bboxes.reduce<Bbox>(
    (u, b) => [
      Math.min(u[0], b[0]),
      Math.min(u[1], b[1]),
      Math.max(u[2], b[2]),
      Math.max(u[3], b[3]),
    ],
    [Infinity, Infinity, -Infinity, -Infinity],
  )
}
