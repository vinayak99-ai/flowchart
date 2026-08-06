import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js'
import type { Edge, Node } from '@xyflow/react'
import type { DiagramEdge, DiagramNode, FlowchartDiagram } from '../types'
import { routeEdgesOnGrid } from './gridRouter'
import { measureNodeSize, BASE_HEIGHT } from './nodeSizing'

const elk = new ELK()

// Fallback size only — actual node dimensions are measured per-label in
// measureNodeSize() so a box fits its content instead of every node getting
// an identical fixed size regardless of label length.
export const NODE_WIDTH = 200
export const NODE_HEIGHT = BASE_HEIGHT

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
        // Wider than the other algorithms' node-node spacing on purpose: ELK
        // never routes edges for rectpacking at all (see gridRouter.ts), so
        // our own router has to fit real lanes for many edges through the
        // gutter between packed rows -- 32px left ~20px of free space after
        // margins, not enough room to visually separate edges that share a
        // row-to-row crossing.
        'elk.spacing.nodeNode': '48',
        'elk.contentAlignment': 'V_CENTER H_CENTER',
      }
  }
}

export type DiagramNodeData = DiagramNode & {
  groupLabel?: string
  handleDirection?: LayoutDirection
  width?: number
  height?: number
} & Record<string, unknown>

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
  const sizesById = new Map(diagram.nodes.map((node) => [node.id, measureNodeSize(node.label, node.type)]))

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: buildLayoutOptions(algorithm, direction),
    children: diagram.nodes.map((node) => {
      const size = sizesById.get(node.id)!
      return {
        id: node.id,
        width: size.width,
        height: size.height,
      }
    }),
    edges: diagram.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  }

  const result = await elk.layout(elkGraph)
  const nodesById = new Map(diagram.nodes.map((node) => [node.id, node]))
  const groupsById = new Map(diagram.groups.map((group) => [group.id, group]))

  // Rectpacking has no real "flow" direction (it's a packed grid, not a
  // chain), so its nodes keep the default top/bottom handles rather than
  // rotating to match whatever direction was last selected on another algorithm.
  const handleDirection = DIRECTION_SUPPORTED[algorithm] ? direction : undefined

  const nodes: Node<DiagramNodeData, 'diagramNode'>[] = (result.children ?? []).map((child) => {
    const diagramNode = nodesById.get(child.id)!
    const groupLabel = diagramNode.group_id ? groupsById.get(diagramNode.group_id)?.label : undefined
    const size = sizesById.get(child.id)!
    return {
      id: child.id,
      type: 'diagramNode',
      position: { x: child.x ?? 0, y: child.y ?? 0 },
      // Top-level width/height so React Flow's own viewport/fitView math is
      // correct immediately, not just after the DOM node is first measured.
      width: size.width,
      height: size.height,
      data: { ...diagramNode, groupLabel, handleDirection, width: size.width, height: size.height },
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

  // rectpacking (and potentially other future algorithms) never populates
  // edge sections at all -- verified directly against elkjs, not just this
  // graph -- regardless of elk.edgeRouting. Route those ourselves on a grid
  // so they still avoid node boxes instead of silently falling back to a
  // naive point-to-point line.
  if (routesById.size === 0 && (result.edges?.length ?? 0) > 0) {
    const routableNodes = (result.children ?? []).map((child) => ({
      id: child.id,
      x: child.x ?? 0,
      y: child.y ?? 0,
      width: child.width ?? NODE_WIDTH,
      height: child.height ?? NODE_HEIGHT,
    }))
    const gridRoutes = routeEdgesOnGrid(routableNodes, diagram.edges)
    for (const [id, points] of gridRoutes) routesById.set(id, points)
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
