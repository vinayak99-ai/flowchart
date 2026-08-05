import { useState, type RefObject } from 'react'
import { exportPdf, exportPng } from '../lib/export'
import { exportPptx } from '../lib/exportPptx'
import type { LayoutAlgorithm } from '../lib/elkLayout'
import type { FlowchartCanvasHandle } from './FlowchartCanvas'

interface ExportControlsProps {
  targetRef: RefObject<FlowchartCanvasHandle | null>
  disabled: boolean
  layoutAlgorithm: LayoutAlgorithm
}

export function ExportControls({ targetRef, disabled, layoutAlgorithm }: ExportControlsProps) {
  const [busy, setBusy] = useState<'png' | 'pdf' | 'pptx' | null>(null)
  const pptxAvailable = layoutAlgorithm === 'rectpacking'

  const handleExport = async (kind: 'png' | 'pdf' | 'pptx') => {
    const handle = targetRef.current
    if (!handle) return
    setBusy(kind)
    try {
      if (kind === 'png' && handle.domNode) {
        await exportPng(handle.domNode)
      } else if (kind === 'pdf' && handle.domNode) {
        await exportPdf(handle.domNode)
      } else if (kind === 'pptx') {
        const { nodes, edges } = handle.getFlow()
        await exportPptx(nodes, edges)
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={disabled || busy !== null}
        onClick={() => handleExport('png')}
        className="rounded-md border border-fidelity-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-fidelity-gray-900 hover:border-fidelity-green hover:text-fidelity-green disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy === 'png' ? 'Exporting…' : 'Export PNG'}
      </button>
      <button
        type="button"
        disabled={disabled || busy !== null}
        onClick={() => handleExport('pdf')}
        className="rounded-md border border-fidelity-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-fidelity-gray-900 hover:border-fidelity-green hover:text-fidelity-green disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy === 'pdf' ? 'Exporting…' : 'Export PDF'}
      </button>
      <button
        type="button"
        disabled={disabled || busy !== null || !pptxAvailable}
        onClick={() => handleExport('pptx')}
        title={pptxAvailable ? undefined : 'Switch to the Compact (rectpacking) layout to export PowerPoint'}
        className="rounded-md border border-fidelity-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-fidelity-gray-900 hover:border-fidelity-green hover:text-fidelity-green disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy === 'pptx' ? 'Exporting…' : 'Export PPTX'}
      </button>
    </div>
  )
}
