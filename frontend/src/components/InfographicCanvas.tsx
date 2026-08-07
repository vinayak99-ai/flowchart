import { useState } from 'react'
import { exportInfographicPptx } from '../lib/api'
import type { InfographicDiagram } from '../infographicTypes'
import { WheelPreview } from './infographic/WheelPreview'
import { ComparisonPreview } from './infographic/ComparisonPreview'
import { RoadmapPreview } from './infographic/RoadmapPreview'
import { PyramidPreview } from './infographic/PyramidPreview'
import { TimelinePreview } from './infographic/TimelinePreview'

interface InfographicCanvasProps {
  diagram: InfographicDiagram | null
}

const TEMPLATE_LABEL: Record<InfographicDiagram['template'], string> = {
  radial_wheel: 'Radial wheel',
  comparison_columns: 'Comparison columns',
  now_next_later: 'Now/Next/Later roadmap',
  vision_pyramid: 'Vision pyramid',
  quarterly_timeline: 'Quarterly timeline',
}

function renderPreview(diagram: InfographicDiagram) {
  switch (diagram.template) {
    case 'radial_wheel':
      return (
        <div className="aspect-[31/30] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-lg">
          <WheelPreview wheel={diagram} />
        </div>
      )
    case 'comparison_columns':
      return (
        <div className="aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
          <ComparisonPreview comparison={diagram} />
        </div>
      )
    case 'now_next_later':
      return (
        <div className="aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
          <RoadmapPreview roadmap={diagram} />
        </div>
      )
    case 'vision_pyramid':
      return (
        <div className="aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
          <PyramidPreview pyramid={diagram} />
        </div>
      )
    case 'quarterly_timeline':
      return (
        <div className="aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
          <TimelinePreview timeline={diagram} />
        </div>
      )
  }
}

export function InfographicCanvas({ diagram }: InfographicCanvasProps) {
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
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              Detected: {TEMPLATE_LABEL[diagram.template]}
            </span>
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
        {diagram ? renderPreview(diagram) : (
          <p className="text-sm text-neutral-500">Generate an infographic to see it here.</p>
        )}
      </div>
    </div>
  )
}
