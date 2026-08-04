import { forwardRef, useEffect, useMemo } from 'react'
import { Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { layoutDiagram } from '../lib/elkLayout'
import type { FlowchartDiagram } from '../types'
import { DiagramNodeComponent, type DiagramFlowNode } from './nodes/DiagramNodeComponent'
import { DiagramEdgeComponent, type DiagramFlowEdge } from './edges/DiagramEdgeComponent'

interface FlowchartCanvasProps {
  diagram: FlowchartDiagram | null
}

const nodeTypes = { diagramNode: DiagramNodeComponent }
const edgeTypes = { diagramEdge: DiagramEdgeComponent }

export const FlowchartCanvas = forwardRef<HTMLDivElement, FlowchartCanvasProps>(({ diagram }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<DiagramFlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<DiagramFlowEdge>([])

  useEffect(() => {
    if (!diagram || diagram.nodes.length === 0) {
      setNodes([])
      setEdges([])
      return
    }

    let cancelled = false
    layoutDiagram(diagram).then(({ nodes: laidOutNodes, edges: laidOutEdges }) => {
      if (cancelled) return
      const withCallbacks: DiagramFlowNode[] = laidOutNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onLabelChange: (id: string, label: string) => {
            setNodes((current) =>
              current.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)),
            )
          },
        },
      }))
      setNodes(withCallbacks)
      setEdges(laidOutEdges as DiagramFlowEdge[])
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagram])

  const isEmpty = useMemo(() => !diagram || diagram.nodes.length === 0, [diagram])

  return (
    <div ref={ref} className="relative h-full w-full bg-fidelity-gray-50">
      {isEmpty ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-fidelity-gray-600">
          <p className="text-sm font-medium">No flowchart yet</p>
          <p className="max-w-xs text-xs">
            Add source material and a prompt in the panel on the left, then generate to see your
            flowchart here.
          </p>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#dde1dc" gap={20} />
          <Controls />
          <MiniMap
            pannable
            zoomable
            nodeColor="#00754a"
            maskColor="rgba(237, 239, 236, 0.6)"
            className="!border !border-fidelity-gray-200"
          />
        </ReactFlow>
      )}
    </div>
  )
})

FlowchartCanvas.displayName = 'FlowchartCanvas'
