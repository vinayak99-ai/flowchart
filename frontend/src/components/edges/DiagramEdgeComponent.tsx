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

export type DiagramFlowEdge = Edge<
  { type: EdgeType; edgeShape?: EdgeShape; themeName?: ThemeName },
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

  const [edgePath, labelX, labelY] =
    shape === 'straight'
      ? getStraightPath(pathParams)
      : shape === 'step'
        ? getSmoothStepPath({ ...pathParams, borderRadius: 0 })
        : shape === 'smoothstep'
          ? getSmoothStepPath(pathParams)
          : getBezierPath(pathParams)

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
