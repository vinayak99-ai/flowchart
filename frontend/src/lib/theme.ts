import type { EdgeType, NodeType } from '../types'

export interface NodeStyle {
  shape: 'pill' | 'rect' | 'diamond' | 'parallelogram' | 'subprocess'
  container: string
  label: string
}

export const nodeTheme: Record<NodeType, NodeStyle> = {
  start: {
    shape: 'pill',
    container: 'bg-fidelity-green border border-fidelity-green-dark text-white shadow-sm',
    label: 'font-semibold text-white',
  },
  end: {
    shape: 'pill',
    container: 'bg-fidelity-gray-900 border border-fidelity-gray-900 text-white shadow-sm',
    label: 'font-semibold text-white',
  },
  process: {
    shape: 'rect',
    container: 'bg-white border border-fidelity-gray-200 text-fidelity-gray-900 shadow-sm',
    label: 'font-medium',
  },
  decision: {
    shape: 'diamond',
    container: 'bg-fidelity-gold-light border border-fidelity-gold text-fidelity-gray-900 shadow-sm',
    label: 'font-medium',
  },
  io: {
    shape: 'parallelogram',
    container: 'bg-fidelity-green-light border border-fidelity-green text-fidelity-gray-900 shadow-sm',
    label: 'font-medium',
  },
  subprocess: {
    shape: 'subprocess',
    container: 'bg-white border-2 border-fidelity-gray-600 text-fidelity-gray-900 shadow-sm',
    label: 'font-medium',
  },
}

export const edgeTheme: Record<EdgeType, { stroke: string; strokeWidth: number; strokeDasharray?: string }> = {
  default: { stroke: '#5b6660', strokeWidth: 1.5 },
  conditional: { stroke: '#c9a227', strokeWidth: 1.5, strokeDasharray: '4 3' },
}

export const nodeTypeLabels: Record<NodeType, string> = {
  start: 'Start',
  end: 'End',
  process: 'Process',
  decision: 'Decision',
  io: 'Input / Output',
  subprocess: 'Subprocess',
}
