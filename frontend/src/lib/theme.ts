import type { EdgeType, NodeType } from '../types'
import type { DiagramPalette } from './themes'

export interface NodeStyle {
  shape: 'pill' | 'rect' | 'diamond' | 'parallelogram' | 'subprocess'
  container: string
  label: string
}

export const nodeTheme: Record<NodeType, NodeStyle> = {
  start: {
    shape: 'pill',
    container: 'bg-primary border border-primary-dark text-white shadow-sm',
    label: 'font-semibold text-white',
  },
  end: {
    shape: 'pill',
    container: 'bg-neutral-900 border border-neutral-900 text-white shadow-sm',
    label: 'font-semibold text-white',
  },
  process: {
    shape: 'rect',
    container: 'bg-white border border-neutral-200 text-neutral-900 shadow-sm',
    label: 'font-medium',
  },
  decision: {
    shape: 'diamond',
    container: 'bg-accent-light border border-accent text-neutral-900 shadow-sm',
    label: 'font-medium',
  },
  io: {
    shape: 'parallelogram',
    container: 'bg-primary-light border border-primary text-neutral-900 shadow-sm',
    label: 'font-medium',
  },
  subprocess: {
    shape: 'subprocess',
    container: 'bg-white border-2 border-neutral-600 text-neutral-900 shadow-sm',
    label: 'font-medium',
  },
}

export type EdgeShape = 'bezier' | 'straight' | 'step' | 'smoothstep'

export const edgeShapeLabels: Record<EdgeShape, string> = {
  bezier: 'Curved',
  straight: 'Straight',
  step: 'Right-angle',
  smoothstep: 'Rounded right-angle',
}

export interface EdgeStyle {
  stroke: string
  strokeWidth: number
  strokeDasharray?: string
}

// Edge colors come from the active palette (not a static Tailwind class) because
// they're passed as raw SVG stroke props, not className.
export function getEdgeTheme(palette: DiagramPalette): Record<EdgeType, EdgeStyle> {
  return {
    default: { stroke: palette.neutral600, strokeWidth: 1.5 },
    conditional: { stroke: palette.accent, strokeWidth: 1.5, strokeDasharray: '4 3' },
  }
}

export const nodeTypeLabels: Record<NodeType, string> = {
  start: 'Start',
  end: 'End',
  process: 'Process',
  decision: 'Decision',
  io: 'Input / Output',
  subprocess: 'Subprocess',
}
