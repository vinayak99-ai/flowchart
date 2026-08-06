import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { layoutDiagram, type LayoutAlgorithm, type LayoutDirection } from '../lib/elkLayout'
import type { EdgeShape } from '../lib/theme'
import { themePalettes, type ThemeName } from '../lib/themes'
import type { FlowchartDiagram } from '../types'
import { DiagramNodeComponent, type DiagramFlowNode } from './nodes/DiagramNodeComponent'
import { DiagramEdgeComponent, type DiagramFlowEdge } from './edges/DiagramEdgeComponent'

interface FlowchartCanvasProps {
  diagram: FlowchartDiagram | null
  layoutAlgorithm: LayoutAlgorithm
  layoutDirection: LayoutDirection
  edgeShape: EdgeShape
  themeName: ThemeName
  snapToGrid: boolean
}

export interface FlowchartCanvasHandle {
  domNode: HTMLDivElement | null
  getFlow: () => { nodes: DiagramFlowNode[]; edges: DiagramFlowEdge[] }
}

const nodeTypes = { diagramNode: DiagramNodeComponent }
const edgeTypes = { diagramEdge: DiagramEdgeComponent }
const SNAP_GRID: [number, number] = [16, 16]

export const FlowchartCanvas = forwardRef<FlowchartCanvasHandle, FlowchartCanvasProps>(
  ({ diagram, layoutAlgorithm, layoutDirection, edgeShape, themeName, snapToGrid }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [nodes, setNodes, onNodesChange] = useNodesState<DiagramFlowNode>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<DiagramFlowEdge>([])

    useImperativeHandle(
      ref,
      () => ({
        domNode: containerRef.current,
        getFlow: () => ({ nodes, edges }),
      }),
      [nodes, edges],
    )

    // Recomputes positions — only needed when the diagram or layout geometry changes.
    useEffect(() => {
      if (!diagram || diagram.nodes.length === 0) {
        setNodes([])
        setEdges([])
        return
      }

      let cancelled = false
      layoutDiagram(diagram, layoutAlgorithm, layoutDirection).then(({ nodes: laidOutNodes, edges: laidOutEdges }) => {
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
        setEdges(
          laidOutEdges.map((edge) => ({
            ...edge,
            data: { ...edge.data, edgeShape, themeName },
          })) as DiagramFlowEdge[],
        )
      })

      return () => {
        cancelled = true
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [diagram, layoutAlgorithm, layoutDirection])

    // Restyle pass — edge shape/theme are just rendering choices, no need to re-run elk.
    // Keeps the routed waypoints and node boxes from the layout pass so
    // switching edge style doesn't fall back to a naive straight line
    // through other nodes, or lose label placement's box-clearance data.
    useEffect(() => {
      setEdges(
        (current) =>
          current.map((edge) => ({
            ...edge,
            data: {
              type: edge.data?.type ?? 'default',
              waypoints: edge.data?.waypoints,
              nodeBoxes: edge.data?.nodeBoxes,
              edgeShape,
              themeName,
            },
          })) as DiagramFlowEdge[],
      )
    }, [edgeShape, themeName, setEdges])

    const isEmpty = useMemo(() => !diagram || diagram.nodes.length === 0, [diagram])
    const palette = themePalettes[themeName]

    return (
      <div ref={containerRef} className="relative h-full w-full bg-neutral-50">
        {isEmpty ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-neutral-600">
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
            snapToGrid={snapToGrid}
            snapGrid={SNAP_GRID}
            proOptions={{ hideAttribution: true }}
          >
            <Background color={palette.neutral200} gap={20} />
            <Controls />
            <MiniMap
              pannable
              zoomable
              nodeColor={palette.primary}
              maskColor="rgba(237, 239, 236, 0.6)"
              className="!border !border-neutral-200"
            />
          </ReactFlow>
        )}
      </div>
    )
  },
)

FlowchartCanvas.displayName = 'FlowchartCanvas'
