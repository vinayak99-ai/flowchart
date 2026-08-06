import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js'
import type { Edge, Node } from '@xyflow/react'
import type { DiagramEdge, DiagramNode, FlowchartDiagram } from '../types'

const elk = new ELK()

export const NODE_WIDTH = 200
export const NODE_HEIGHT = 72

// 16:9 — matches the PPTX slide aspect ratio, so a rectpacking layout is already
// slide-shaped before export ever touches it.
const SLIDE_ASPECT_RATIO = '1.7778'

export type LayoutAlgorithm = 'layered' | 'mrtree' | 'rectpacking'
export type LayoutDirection = 'DOWN' | 'RIGHT'

// rectpacking has no notion of direction — it packs for a target aspect ratio instead.
export const DIRECTION_SUPPORTED: Record<LayoutAlgorithm, boolean> = {
  layered: true,
  mrtree: true,
  rectpacking: false,
}

function buildLayoutOptions(algorithm: LayoutAlgorithm, direction: LayoutDirection): Record<string, string> {
  switch (algorithm) {
    case 'layered':
      return {
        'elk.algorithm': 'layered',
        'elk.direction': direction,
        'elk.layered.spacing.nodeNodeBetweenLayers': '70',
        'elk.spacing.nodeNode': '48',
        'elk.spacing.edgeNode': '24',
        'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
        // Routes edges in axis-aligned segments around any node in the way,
        // instead of a straight line that can cut through unrelated boxes —
        // load-bearing for edges that skip a layer or loop back to an earlier node.
        'elk.edgeRouting': 'ORTHOGONAL',
      }
    case 'mrtree':
      return {
        'elk.algorithm': 'mrtree',
        'elk.direction': direction,
        'elk.spacing.nodeNode': '48',
        'elk.spacing.edgeNode': '24',
        'elk.mrtree.spacing.nodeNodeBetweenLayers': '70',
        'elk.edgeRouting': 'ORTHOGONAL',
      }
    case 'rectpacking':
      return {
        'elk.algorithm': 'rectpacking',
        'elk.aspectRatio': SLIDE_ASPECT_RATIO,
        'elk.spacing.nodeNode': '32',
        'elk.contentAlignment': 'V_CENTER H_CENTER',
      }
  }
}

export type DiagramNodeData = DiagramNode & { groupLabel?: string } & Record<string, unknown>

export interface Waypoint {
  x: number
  y: number
}

export type DiagramEdgeData = { type: string; waypoints?: Waypoint[] }

export async function layoutDiagram(
  diagram: FlowchartDiagram,
  algorithm: LayoutAlgorithm = 'layered',
  direction: LayoutDirection = 'DOWN',
): Promise<{ nodes: Node<DiagramNodeData, 'diagramNode'>[]; edges: Edge<DiagramEdgeData, 'diagramEdge'>[] }> {
  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: buildLayoutOptions(algorithm, direction),
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

  // ELK computes obstacle-avoiding routes as part of layout (bend points that
  // steer around any node in the way), keyed by edge id. Read those back so
  // rendering can follow the same route instead of drawing a naive straight
  // line between node ports that can cut through unrelated nodes.
  const routesById = new Map<string, Waypoint[]>()
  for (const elkEdge of result.edges ?? []) {
    const section = elkEdge.sections?.[0]
    if (!section) continue
    const points: Waypoint[] = [
      section.startPoint,
      ...(section.bendPoints ?? []),
      section.endPoint,
    ]
    routesById.set(elkEdge.id, points)
  }

  const edges: Edge<DiagramEdgeData, 'diagramEdge'>[] = diagram.edges.map((edge: DiagramEdge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label ?? undefined,
    type: 'diagramEdge',
    data: { type: edge.type, waypoints: routesById.get(edge.id) },
  }))

  return { nodes, edges }
}
