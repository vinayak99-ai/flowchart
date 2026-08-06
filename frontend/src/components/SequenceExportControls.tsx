import { useState, type RefObject } from 'react'
import { exportPng } from '../lib/export'
import type { SequenceCanvasHandle } from './SequenceCanvas'

interface SequenceExportControlsProps {
  targetRef: RefObject<SequenceCanvasHandle | null>
  disabled: boolean
}

export function SequenceExportControls({ targetRef, disabled }: SequenceExportControlsProps) {
  const [busy, setBusy] = useState(false)

  const handleExport = async () => {
    const domNode = targetRef.current?.domNode
    if (!domNode) return
    setBusy(true)
    try {
      await exportPng(domNode, 'sequence-diagram.png')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={handleExport}
      className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? 'Exporting…' : 'Export PNG'}
    </button>
  )
}
