import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { ACTIVATION_WIDTH, type ActivationBar, type HandlePoint } from '../../lib/sequenceLayout'

export interface LifelineNodeData {
  label: string
  width: number
  height: number
  activationBars: ActivationBar[]
  sourceHandles: HandlePoint[]
  targetHandles: HandlePoint[]
  [key: string]: unknown
}

export type LifelineFlowNode = Node<LifelineNodeData, 'lifelineNode'>

export function LifelineNode({ data }: NodeProps<LifelineFlowNode>) {
  const headerHeight = 52

  return (
    <div className="relative" style={{ width: data.width, height: data.height }}>
      <div
        className="absolute left-1/2 top-0 flex -translate-x-1/2 items-center justify-center rounded-lg border border-primary bg-primary px-3 text-center text-xs font-semibold leading-tight text-white shadow-sm"
        style={{ width: data.width, height: headerHeight }}
      >
        {data.label}
      </div>

      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 border-l-2 border-dashed border-neutral-300"
        style={{ top: headerHeight, height: data.height - headerHeight }}
      />

      {data.activationBars.map((bar) => (
        <div
          key={bar.id}
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-sm border border-neutral-400 bg-white shadow-sm"
          style={{ width: ACTIVATION_WIDTH, top: bar.startY, height: Math.max(bar.endY - bar.startY, 8) }}
        />
      ))}

      {/* Every handle sits on the lifeline's true center regardless of the
          Position enum's default left/right-edge placement -- required
          since a lifeline can be many rows tall with a handle at each one,
          not just the node's own top/bottom/left/right edges. */}
      {data.targetHandles.map((h) => (
        <Handle
          key={`target-${h.id}`}
          id={h.id}
          type="target"
          position={Position.Left}
          isConnectable={false}
          style={{ left: '50%', top: h.y, transform: 'translate(-50%, -50%)', background: 'transparent', border: 'none' }}
        />
      ))}
      {data.sourceHandles.map((h) => (
        <Handle
          key={`source-${h.id}`}
          id={h.id}
          type="source"
          position={Position.Right}
          isConnectable={false}
          style={{ left: '50%', top: h.y, transform: 'translate(-50%, -50%)', background: 'transparent', border: 'none' }}
        />
      ))}
    </div>
  )
}
