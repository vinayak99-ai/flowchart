import { useState } from 'react'
import { exportWheelPptx } from '../lib/api'
import type { InfographicWheel } from '../infographicTypes'
import { WheelPreview } from './infographic/WheelPreview'

interface InfographicCanvasProps {
  wheel: InfographicWheel | null
}

export function InfographicCanvas({ wheel }: InfographicCanvasProps) {
  const [busy, setBusy] = useState(false)

  const handleDownload = async () => {
    if (!wheel) return
    setBusy(true)
    try {
      await exportWheelPptx(wheel)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
        <h1 className="text-sm font-semibold text-neutral-900">Infographic</h1>
        <button
          type="button"
          disabled={!wheel || busy}
          onClick={handleDownload}
          className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Exporting…' : 'Download PPTX'}
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center bg-neutral-50 p-8">
        {wheel ? (
          <div className="aspect-[31/30] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-lg">
            <WheelPreview wheel={wheel} />
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Generate an infographic to see it here.</p>
        )}
      </div>
    </div>
  )
}
