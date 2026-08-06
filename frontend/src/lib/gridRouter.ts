import type { Waypoint } from './elkLayout'

interface RoutableNode {
  id: string
  x: number
  y: number
  width: number
  height: number
}

interface RoutableEdge {
  id: string
  source: string
  target: string
}

// Tuned for tightly packed layouts with as little as ~32px between nodes, so
// CELL/NODE_MARGIN have to leave a comfortably resolvable gap: 32 - 2*6 =
// 20px of free space at 4px resolution (5 cells), not lost to grid rounding
// the way an 8px cell with a 10px margin was (see gridRouter fix history --
// that combination left zero free rows between adjacent packed rows).
const CELL = 4
const NODE_MARGIN = 6
const TURN_PENALTY = 4
// Deliberately much larger than TURN_PENALTY: in a tightly packed layout the
// free gutter between rows is only ~1-2 cells wide, so a weak congestion
// penalty lets many edges converge on the exact same cells (reads as one
// thick "duplicated" line) rather than spreading into adjacent, visually
// distinct lanes even at the cost of an extra turn.
const CONGESTION_PENALTY = 40

/**
 * Fallback edge router for any layout algorithm ELK doesn't compute routing
 * for at all -- ELK's pure `rectpacking` algorithm never returns edge
 * sections regardless of the elk.edgeRouting option (verified directly
 * against elkjs), which is why the app's "Compact" layout no longer uses it
 * (see elkLayout.ts's buildLayoutOptions). Kept as a safety net for any
 * future algorithm with the same gap. Routes edges orthogonally through
 * free space on a coarse grid, treating node boxes as obstacles and cells
 * used by earlier edges as a soft penalty so edges that would otherwise
 * overlap spread into separate lanes instead of drawing on top of each other.
 */
export function routeEdgesOnGrid(
  nodes: RoutableNode[],
  edges: RoutableEdge[],
): Map<string, Waypoint[]> {
  const nodesById = new Map(nodes.map((n) => [n.id, n]))
  const maxX = Math.max(...nodes.map((n) => n.x + n.width))
  const maxY = Math.max(...nodes.map((n) => n.y + n.height))
  const pad = 60
  const originX = -pad
  const originY = -pad
  const cols = Math.ceil((maxX + pad * 2) / CELL)
  const rows = Math.ceil((maxY + pad * 2) / CELL)

  const blocked = new Uint8Array(cols * rows)
  const congestion = new Uint16Array(cols * rows)
  const cellIndex = (col: number, row: number) => row * cols + col
  const toCol = (x: number) => Math.round((x - originX) / CELL)
  const toRow = (y: number) => Math.round((y - originY) / CELL)
  const cellCenterX = (col: number) => originX + col * CELL
  const cellCenterY = (row: number) => originY + row * CELL

  for (const node of nodes) {
    const c0 = Math.max(0, toCol(node.x - NODE_MARGIN))
    const c1 = Math.min(cols - 1, toCol(node.x + node.width + NODE_MARGIN))
    const r0 = Math.max(0, toRow(node.y - NODE_MARGIN))
    const r1 = Math.min(rows - 1, toRow(node.y + node.height + NODE_MARGIN))
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) blocked[cellIndex(c, r)] = 1
    }
  }

  const results = new Map<string, Waypoint[]>()

  for (const edge of edges) {
    const source = nodesById.get(edge.source)
    const target = nodesById.get(edge.target)
    if (!source || !target) continue

    const startPoint: Waypoint = { x: source.x + source.width / 2, y: source.y + source.height }
    const endPoint: Waypoint = { x: target.x + target.width / 2, y: target.y }

    // Search from the free cell just outside each node's *expanded* (margin-
    // padded) boundary, not the raw node edge -- stepping only one grid cell
    // past the raw edge can still land inside the margin band, where every
    // neighbor is also blocked and the search is trapped before it starts.
    const startCol = toCol(startPoint.x)
    const startRow = Math.min(rows - 1, toRow(startPoint.y + NODE_MARGIN) + 1)
    const endCol = toCol(endPoint.x)
    const endRow = Math.max(0, toRow(endPoint.y - NODE_MARGIN) - 1)

    const path = findPath(
      { col: startCol, row: startRow },
      { col: endCol, row: endRow },
      cols,
      rows,
      blocked,
      congestion,
      cellIndex,
    )

    const waypoints: Waypoint[] = [startPoint]
    if (path) {
      for (const { col, row } of path) {
        congestion[cellIndex(col, row)] += 1
        waypoints.push({ x: cellCenterX(col), y: cellCenterY(row) })
      }
    }
    waypoints.push(endPoint)

    results.set(edge.id, simplifyCollinear(waypoints))
  }

  return results
}

interface Cell {
  col: number
  row: number
}

// Dial's algorithm (bucket queue) -- all step costs are small bounded
// integers, so this is simpler and just as fast as a binary heap here.
function findPath(
  start: Cell,
  end: Cell,
  cols: number,
  rows: number,
  blocked: Uint8Array,
  congestion: Uint16Array,
  cellIndex: (c: number, r: number) => number,
): Cell[] | null {
  const inBounds = (c: number, r: number) => c >= 0 && c < cols && r >= 0 && r < rows
  if (!inBounds(start.col, start.row) || !inBounds(end.col, end.row)) return null

  const dist = new Float64Array(cols * rows).fill(Infinity)
  const prevDir = new Int8Array(cols * rows).fill(-1)
  const prevIndex = new Int32Array(cols * rows).fill(-1)
  const startIdx = cellIndex(start.col, start.row)
  dist[startIdx] = 0

  const directions = [
    { dc: 0, dr: -1 },
    { dc: 0, dr: 1 },
    { dc: -1, dr: 0 },
    { dc: 1, dr: 0 },
  ]

  const buckets: number[][] = []
  const push = (cost: number, idx: number) => {
    ;(buckets[cost] ??= []).push(idx)
  }
  push(0, startIdx)

  const endIdx = cellIndex(end.col, end.row)
  let visited = 0
  const maxVisits = cols * rows

  for (let cost = 0; cost < buckets.length && visited < maxVisits; cost++) {
    const bucket = buckets[cost]
    if (!bucket) continue
    for (const idx of bucket) {
      if (dist[idx] !== cost) continue // stale entry
      visited++
      if (idx === endIdx) {
        return reconstruct(idx, prevIndex, cols)
      }
      const col = idx % cols
      const row = Math.floor(idx / cols)

      for (let d = 0; d < 4; d++) {
        const nc = col + directions[d].dc
        const nr = row + directions[d].dr
        if (!inBounds(nc, nr)) continue
        const nIdx = cellIndex(nc, nr)
        if (blocked[nIdx] && nIdx !== endIdx) continue

        const turning = prevDir[idx] !== -1 && prevDir[idx] !== d
        const stepCost = 1 + (turning ? TURN_PENALTY : 0) + congestion[nIdx] * CONGESTION_PENALTY
        const newDist = dist[idx] + stepCost
        if (newDist < dist[nIdx]) {
          dist[nIdx] = newDist
          prevDir[nIdx] = d
          prevIndex[nIdx] = idx
          push(Math.round(newDist), nIdx)
        }
      }
    }
  }
  return null
}

function reconstruct(endIdx: number, prevIndex: Int32Array, cols: number): Cell[] {
  const path: Cell[] = []
  let cur = endIdx
  while (cur !== -1) {
    path.push({ col: cur % cols, row: Math.floor(cur / cols) })
    cur = prevIndex[cur]
  }
  return path.reverse()
}

/** Collapses consecutive collinear points so long straight runs become one
 *  segment instead of a staircase of tiny grid-aligned steps. */
function simplifyCollinear(points: Waypoint[]): Waypoint[] {
  if (points.length <= 2) return points
  const result: Waypoint[] = [points[0]]
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1]
    const cur = points[i]
    const next = points[i + 1]
    const collinearX = prev.x === cur.x && cur.x === next.x
    const collinearY = prev.y === cur.y && cur.y === next.y
    if (collinearX || collinearY) continue
    result.push(cur)
  }
  result.push(points[points.length - 1])
  return result
}
