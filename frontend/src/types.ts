export type NodeType = 'start' | 'end' | 'process' | 'decision' | 'io' | 'subprocess'
export type EdgeType = 'default' | 'conditional'

export interface DiagramNode {
  id: string
  type: NodeType
  label: string
  group_id?: string | null
}

export interface DiagramEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  label?: string | null
}

export interface DiagramGroup {
  id: string
  label: string
}

export interface FlowchartDiagram {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  groups: DiagramGroup[]
}

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  severity: ValidationSeverity
  code: string
  message: string
  node_id?: string | null
  edge_id?: string | null
}

export interface GenerateResponse {
  diagram: FlowchartDiagram
  issues: ValidationIssue[]
}

export interface ExtractResponse {
  text: string
  filename: string
}

export type WsProgressMessage =
  | { stage: 'calling_llm' }
  | { stage: 'validating' }
  | { stage: 'done'; result: GenerateResponse }
  | { stage: 'error'; message: string }
