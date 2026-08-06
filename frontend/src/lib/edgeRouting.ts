import type { Waypoint } from './elkLayout'

interface BuildRoutedPathArgs {
  waypoints: Waypoint[]
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  rounded: boolean
}

const CORNER_RADIUS = 12

/**
 * Turns a list of waypoints (ELK's obstacle-avoiding route) into an SVG path,
 * anchored to React Flow's precise handle coordinates at both ends rather
 * than ELK's own start/endPoint (which is computed from the node's raw box,
 * not the rendered handle position, and can be a pixel or two off).
 */
export function buildRoutedPath({
  waypoints,
  sourceX,
  sourceY,
  targetX,
  targetY,
  rounded,
}: BuildRoutedPathArgs): [path: string, labelX: number, labelY: number] {
  const points: Waypoint[] = [
    { x: sourceX, y: sourceY },
    ...waypoints.slice(1, -1),
    { x: targetX, y: targetY },
  ]

  const path = rounded ? roundedPolyline(points) : sharpPolyline(points)

  const mid = points[Math.floor((points.length - 1) / 2)]
  const midNext = points[Math.ceil((points.length - 1) / 2)]
  const labelX = (mid.x + midNext.x) / 2
  const labelY = (mid.y + midNext.y) / 2

  return [path, labelX, labelY]
}

function sharpPolyline(points: Waypoint[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

/** Straight segments between waypoints, with each interior corner rounded
 *  off by a short quadratic curve — same visual idea as getSmoothStepPath's
 *  borderRadius, applied to an arbitrary multi-point route. */
function roundedPolyline(points: Waypoint[]): string {
  if (points.length <= 2) return sharpPolyline(points)

  const segments: string[] = [`M ${points[0].x} ${points[0].y}`]

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const corner = points[i]
    const next = points[i + 1]

    const inLen = distance(prev, corner)
    const outLen = distance(corner, next)
    const radius = Math.min(CORNER_RADIUS, inLen / 2, outLen / 2)

    const before = pointTowards(corner, prev, radius)
    const after = pointTowards(corner, next, radius)

    segments.push(`L ${before.x} ${before.y}`)
    segments.push(`Q ${corner.x} ${corner.y} ${after.x} ${after.y}`)
  }

  const last = points[points.length - 1]
  segments.push(`L ${last.x} ${last.y}`)

  return segments.join(' ')
}

function distance(a: Waypoint, b: Waypoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function pointTowards(from: Waypoint, to: Waypoint, distanceFromStart: number): Waypoint {
  const total = distance(from, to)
  if (total === 0) return from
  const t = distanceFromStart / total
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
}
