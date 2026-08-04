import { useState, type RefObject } from 'react'
import { exportPdf, exportPng } from '../lib/export'

interface ExportControlsProps {
  targetRef: RefObject<HTMLDivElement | null>
  disabled: boolean
}

export function ExportControls({ targetRef, disabled }: ExportControlsProps) {
  const [busy, setBusy] = useState<'png' | 'pdf' | null>(null)

  const handleExport = async (kind: 'png' | 'pdf') => {
    const node = targetRef.current
    if (!node) return
    setBusy(kind)
    try {
      if (kind === 'png') {
        await exportPng(node)
      } else {
        await exportPdf(node)
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
    </div>
  )
}
