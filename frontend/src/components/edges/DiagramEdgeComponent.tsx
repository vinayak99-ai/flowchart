import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type Edge,
  type EdgeProps,
} from '@xyflow/react'
import { getEdgeTheme, type EdgeShape } from '../../lib/theme'
import { themePalettes, type ThemeName } from '../../lib/themes'
import type { EdgeType } from '../../types'
import type { Box, Waypoint } from '../../lib/elkLayout'
import { buildRoutedPath, clampLabelToBoxes } from '../../lib/edgeRouting'

export type DiagramFlowEdge = Edge<
  {
    type: EdgeType
    edgeShape?: EdgeShape
    themeName?: ThemeName
    waypoints?: Waypoint[]
    nodeBoxes?: Box[]
  },
  'diagramEdge'
>

export function DiagramEdgeComponent({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  markerEnd,
}: EdgeProps<DiagramFlowEdge>) {
  const pathParams = { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition }
  const shape = data?.edgeShape ?? 'bezier'

  // "Straight" means a literal direct line by definition — same as a
  // straight connector in any diagramming tool, it can't bend around a node
  // and stay straight. Every other shape routes through ELK's obstacle-
  // avoiding waypoints (when there are more than just the two endpoints)
  // instead of a naive point-to-point curve that can cut through other nodes.
  const routed =
    shape !== 'straight' && data?.waypoints && data.waypoints.length > 2
      ? buildRoutedPath({
          waypoints: data.waypoints,
          sourceX,
          sourceY,
          targetX,
          targetY,
          rounded: shape === 'bezier' || shape === 'smoothstep',
          nodeBoxes: data?.nodeBoxes,
        })
      : null

  const [edgePath, routedLabelX, routedLabelY] =
    routed ??
    (shape === 'straight'
      ? getStraightPath(pathParams)
      : shape === 'step'
        ? getSmoothStepPath({ ...pathParams, borderRadius: 0 })
        : shape === 'smoothstep'
          ? getSmoothStepPath(pathParams)
          : getBezierPath(pathParams))

  // buildRoutedPath already searched for a box-clear point when `routed` is
  // set. React Flow's own path helpers (used for a direct, bend-free edge)
  // have no such awareness, so their raw midpoint still needs the same
  // clamp against the real node boxes.
  const [labelX, labelY] = routed
    ? [routedLabelX, routedLabelY]
    : clampLabelToBoxes(routedLabelX, routedLabelY, sourceX, sourceY, targetX, targetY, data?.nodeBoxes)

  const palette = themePalettes[data?.themeName ?? 'fidelity-green']
  const style = getEdgeTheme(palette)[data?.type ?? 'default']

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          strokeDasharray: style.strokeDasharray,
        }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            // No border/shadow chip -- with many conditional branches, a bordered
            // box per label reads as clutter competing with the actual node boxes.
            // Color-matching the text to the edge's own stroke ties a label to its
            // line without needing a container to do that job.
            className="absolute rounded bg-white/85 px-1 py-0.5 text-[10px] font-semibold"
            style={{
              color: style.stroke,
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
