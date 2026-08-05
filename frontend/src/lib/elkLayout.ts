import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js'
import type { Edge, Node } from '@xyflow/react'
import type { DiagramEdge, DiagramNode, FlowchartDiagram } from '../types'

const elk = new ELK()

export const NODE_WIDTH = 200
export const NODE_HEIGHT = 72

// 16:9 — matches the PPTX slide aspect ratio, so a rectpacking layout is already
// slide-shaped before export ever touches it.
const SLIDE_ASPECT_RATIO = '1.7778'

export type LayoutAlgorithm = 'layered' | 'rectpacking'

const layoutOptionsByAlgorithm: Record<LayoutAlgorithm, Record<string, string>> = {
  layered: {
    'elk.algorithm': 'layered',
    'elk.direction': 'DOWN',
    'elk.layered.spacing.nodeNodeBetweenLayers': '70',
    'elk.spacing.nodeNode': '48',
    'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  },
  rectpacking: {
    'elk.algorithm': 'rectpacking',
    'elk.aspectRatio': SLIDE_ASPECT_RATIO,
    'elk.spacing.nodeNode': '32',
    'elk.contentAlignment': 'V_CENTER H_CENTER',
  },
}

export type DiagramNodeData = DiagramNode & { groupLabel?: string } & Record<string, unknown>

export async function layoutDiagram(
  diagram: FlowchartDiagram,
  algorithm: LayoutAlgorithm = 'layered',
): Promise<{ nodes: Node<DiagramNodeData, 'diagramNode'>[]; edges: Edge<{ type: string }, 'diagramEdge'>[] }> {
  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: layoutOptionsByAlgorithm[algorithm],
    children: diagram.nodes.map((node) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: diagram.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  }

  const result = await elk.layout(elkGraph)
  const nodesById = new Map(diagram.nodes.map((node) => [node.id, node]))
  const groupsById = new Map(diagram.groups.map((group) => [group.id, group]))

  const nodes: Node<DiagramNodeData, 'diagramNode'>[] = (result.children ?? []).map((child) => {
    const diagramNode = nodesById.get(child.id)!
    const groupLabel = diagramNode.group_id ? groupsById.get(diagramNode.group_id)?.label : undefined
    return {
      id: child.id,
      type: 'diagramNode',
      position: { x: child.x ?? 0, y: child.y ?? 0 },
      data: { ...diagramNode, groupLabel },
      draggable: true,
    }
  })

  const edges: Edge<{ type: string }, 'diagramEdge'>[] = diagram.edges.map((edge: DiagramEdge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label ?? undefined,
    type: 'diagramEdge',
    data: { type: edge.type },
  }))

  return { nodes, edges }
}
