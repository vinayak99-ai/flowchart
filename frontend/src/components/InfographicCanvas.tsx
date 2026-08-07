import { useState } from 'react'
import { exportInfographicPptx } from '../lib/api'
import type { InfographicDiagram } from '../infographicTypes'
import { TEMPLATE_LABEL, renderInfographicPreview } from './infographic/previewRegistry'

interface InfographicCanvasProps {
  diagram: InfographicDiagram | null
  onDiagramChange: (diagram: InfographicDiagram) => void
}

export function InfographicCanvas({ diagram, onDiagramChange }: InfographicCanvasProps) {
  const [busy, setBusy] = useState(false)

  const handleDownload = async () => {
    if (!diagram) return
    setBusy(true)
    try {
      await exportInfographicPptx(diagram)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-neutral-900">Infographic</h1>
          {diagram ? (
            <>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                Detected: {TEMPLATE_LABEL[diagram.template]}
              </span>
              <span className="text-[11px] text-neutral-400">Click any text to edit it</span>
            </>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!diagram || busy}
          onClick={handleDownload}
          className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Exporting…' : 'Download PPTX'}
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center bg-neutral-50 p-8">
        {diagram ? renderInfographicPreview(diagram, onDiagramChange) : (
          <p className="text-sm text-neutral-500">Generate an infographic to see it here.</p>
        )}
      </div>
    </div>
  )
}
