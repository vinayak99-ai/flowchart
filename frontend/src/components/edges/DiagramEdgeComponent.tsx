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
import type { Waypoint } from '../../lib/elkLayout'
import { buildRoutedPath } from '../../lib/edgeRouting'

export type DiagramFlowEdge = Edge<
  { type: EdgeType; edgeShape?: EdgeShape; themeName?: ThemeName; waypoints?: Waypoint[] },
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
        })
      : null

  const [edgePath, labelX, labelY] =
    routed ??
    (shape === 'straight'
      ? getStraightPath(pathParams)
      : shape === 'step'
        ? getSmoothStepPath({ ...pathParams, borderRadius: 0 })
        : shape === 'smoothstep'
          ? getSmoothStepPath(pathParams)
          : getBezierPath(pathParams))

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
            className="absolute rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-900 shadow-sm"
            style={{
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
