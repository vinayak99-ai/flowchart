import { BaseEdge, EdgeLabelRenderer, type Edge, type EdgeProps } from '@xyflow/react'
import { themePalettes, type ThemeName } from '../../lib/themes'
import type { MessageType } from '../../sequenceTypes'

export type MessageFlowEdge = Edge<
  { type: MessageType; stepNumber: number; isSelf: boolean; themeName?: ThemeName },
  'messageEdge'
>

// How far a self-message's loop bulges out from its own lifeline.
const SELF_LOOP_WIDTH = 44

export function MessageEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  label,
  markerEnd,
}: EdgeProps<MessageFlowEdge>) {
  const isSelf = data?.isSelf ?? false
  const isReturn = data?.type === 'return'
  const palette = themePalettes[data?.themeName ?? 'fidelity-green']

  let path: string
  let labelX: number
  let labelY: number
  let labelAlign: 'center' | 'left'

  if (isSelf) {
    // Loop out to the right and back down onto the same lifeline, instead
    // of a straight line (which would be invisible when source === target).
    // Ends a few px short of the lifeline's exact center, not on top of it --
    // an activation bar (rendered inside the lifeline node, which sits above
    // the edge layer) is centered on that exact point and would otherwise
    // hide the arrowhead completely underneath its opaque background.
    const loopEndX = targetX + 6
    path = `M ${sourceX} ${sourceY} C ${sourceX + SELF_LOOP_WIDTH} ${sourceY}, ${sourceX + SELF_LOOP_WIDTH} ${targetY}, ${loopEndX} ${targetY}`
    labelX = sourceX + SELF_LOOP_WIDTH + 8
    labelY = (sourceY + targetY) / 2
    labelAlign = 'left'
  } else {
    path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
    labelX = (sourceX + targetX) / 2
    labelY = sourceY
    labelAlign = 'center'
  }

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={{
          // Solid = a call/request, dashed = a reply -- the standard visual
          // grammar for a sequence diagram, so direction of intent reads at
          // a glance without following the arrowhead alone.
          stroke: isReturn ? palette.neutral600 : palette.neutral900,
          strokeWidth: isReturn ? 1.4 : 1.7,
          strokeDasharray: isReturn ? '5 4' : undefined,
        }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="absolute flex items-center gap-1 whitespace-nowrap rounded bg-white/90 px-1 py-0.5 text-[10px] font-medium text-neutral-900 shadow-sm"
            style={{
              transform:
                labelAlign === 'left'
                  ? `translate(0, -50%) translate(${labelX}px, ${labelY}px)`
                  : `translate(-50%, -100%) translate(${labelX}px, ${labelY - 6}px)`,
              pointerEvents: 'all',
              // A message landing right where a new activation bar opens
              // (rendered inside the lifeline node) would otherwise have
              // its own label clipped underneath that opaque background --
              // nodes render above the edge layer by default.
              zIndex: 10,
            }}
          >
            {data ? (
              <span
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                style={{ background: isReturn ? palette.neutral600 : palette.primary }}
              >
                {data.stepNumber}
              </span>
            ) : null}
            <span>{label}</span>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
