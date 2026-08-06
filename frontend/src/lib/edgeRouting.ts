import type { Box, Waypoint } from './elkLayout'

interface BuildRoutedPathArgs {
  waypoints: Waypoint[]
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  rounded: boolean
  nodeBoxes?: Box[]
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
  nodeBoxes,
}: BuildRoutedPathArgs): [path: string, labelX: number, labelY: number] {
  const points: Waypoint[] = [
    { x: sourceX, y: sourceY },
    ...waypoints.slice(1, -1),
    { x: targetX, y: targetY },
  ]

  const path = rounded ? roundedPolyline(points) : sharpPolyline(points)
  const [labelX, labelY] = labelPositionAlongPath(points, nodeBoxes)

  return [path, labelX, labelY]
}

// Half-extent of the label chip used only to decide whether a candidate
// point is "clear" of a node -- doesn't need to be exact, just enough that
// the chip's actual rendered size (which varies with label text) won't
// still be grazing the node edge at that point.
const LABEL_HALF_WIDTH = 46
const LABEL_HALF_HEIGHT = 12

/**
 * How far (x, y) sits inside a node's padded box -- 0 if it's outside (or
 * there's no box). Used instead of a plain in/out test because on a genuinely
 * cramped layout (a decision node so wide its two branch targets are only a
 * layer-spacing's width away) NO point along the path may clear every box
 * at once -- picking the least-bad candidate by this score beats blindly
 * falling back to the raw midpoint, which is often the *most* overlapped
 * point on the whole path.
 */
function penetrationDepth(x: number, y: number, box: Box): number {
  const minX = box.x - LABEL_HALF_WIDTH
  const maxX = box.x + box.width + LABEL_HALF_WIDTH
  const minY = box.y - LABEL_HALF_HEIGHT
  const maxY = box.y + box.height + LABEL_HALF_HEIGHT
  if (x < minX || x > maxX || y < minY || y > maxY) return 0
  return Math.min(x - minX, maxX - x, y - minY, maxY - y)
}

// Checked against every node on the canvas, not just this edge's own
// source/target -- a long routed edge (a row-wrap transition in Compact, or
// any edge that skips past an intermediate node) can run right alongside a
// node it has nothing to do with, and the label shouldn't land on that
// either.
function overlapScore(x: number, y: number, boxes: Box[] | undefined): number {
  if (!boxes) return 0
  let total = 0
  for (const box of boxes) total += penetrationDepth(x, y, box)
  return total
}

// Search outward from the true midpoint alternating short/long sides so the
// chosen point stays as close to "the middle of the run" as possible while
// still preferring to clear the boxes.
const SEARCH_FRACTIONS = [0.5, 0.4, 0.6, 0.3, 0.7, 0.22, 0.78, 0.12, 0.88]

function bestOf(candidates: Waypoint[], boxes: Box[] | undefined): Waypoint {
  let best = candidates[0]
  let bestScore = overlapScore(best.x, best.y, boxes)
  for (let i = 1; i < candidates.length && bestScore > 0; i++) {
    const c = candidates[i]
    const score = overlapScore(c.x, c.y, boxes)
    if (score < bestScore) {
      best = c
      bestScore = score
    }
  }
  return best
}

/**
 * Places the label at 50% of the path's actual travelled distance by
 * default -- not at the midpoint *waypoint index*, which degenerates badly
 * on the common 3-point route (source -> one bend -> target, typical for a
 * short decision-branch edge): floor/ceil of (3-1)/2 both land on index 1,
 * putting the label chip on the bend itself, right next to the node the
 * edge just left. If that (or any candidate along the search fractions)
 * still falls inside a node's actual box, tries other points along the same
 * path and keeps whichever overlaps the least -- some genuinely cramped
 * edges have no point that clears every nearby box at once.
 */
function labelPositionAlongPath(points: Waypoint[], nodeBoxes?: Box[]): [number, number] {
  if (points.length < 2) {
    const p = points[0] ?? { x: 0, y: 0 }
    return [p.x, p.y]
  }

  const segmentLengths = points.slice(1).map((p, i) => distance(points[i], p))
  const totalLength = segmentLengths.reduce((sum, len) => sum + len, 0)
  if (totalLength === 0) return [points[0].x, points[0].y]

  const pointAtFraction = (frac: number): Waypoint => {
    let travelled = 0
    const targetDist = totalLength * frac
    for (let i = 0; i < segmentLengths.length; i++) {
      const segLen = segmentLengths[i]
      if (travelled + segLen >= targetDist) {
        const t = segLen === 0 ? 0 : (targetDist - travelled) / segLen
        const from = points[i]
        const to = points[i + 1]
        return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
      }
      travelled += segLen
    }
    return points[points.length - 1]
  }

  const best = bestOf(SEARCH_FRACTIONS.map(pointAtFraction), nodeBoxes)
  return [best.x, best.y]
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

/**
 * Same box-clearance search as labelPositionAlongPath, but for the native
 * React Flow path helpers (getBezierPath/getSmoothStepPath/getStraightPath)
 * used when ELK gave a direct 2-point route with no bend -- those have no
 * obstacle awareness at all. Approximates the curve as the straight line
 * between the two handles, which stays close enough to a bezier/smoothstep
 * curve for this purpose.
 */
export function clampLabelToBoxes(
  x: number,
  y: number,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  nodeBoxes?: Box[],
): [number, number] {
  if (overlapScore(x, y, nodeBoxes) === 0) return [x, y]

  const candidates: Waypoint[] = SEARCH_FRACTIONS.map((frac) => ({
    x: sourceX + (targetX - sourceX) * frac,
    y: sourceY + (targetY - sourceY) * frac,
  }))
  const best = bestOf(candidates, nodeBoxes)
  return [best.x, best.y]
}

function pointTowards(from: Waypoint, to: Waypoint, distanceFromStart: number): Waypoint {
  const total = distance(from, to)
  if (total === 0) return from
  const t = distanceFromStart / total
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
}
