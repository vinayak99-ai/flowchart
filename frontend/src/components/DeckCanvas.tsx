import { useState } from 'react'
import { exportDeckPptx } from '../lib/api'
import type { GenerateDeckResponse, InfographicDiagram } from '../infographicTypes'
import { TEMPLATE_LABEL, renderInfographicPreview } from './infographic/previewRegistry'
import { EmptyCanvasState } from './EmptyCanvasState'
import { InfographicIcon } from './icons/ToolIcons'

interface DeckCanvasProps {
  deck: GenerateDeckResponse | null
  onDeckChange: (deck: GenerateDeckResponse) => void
}

function slideTitle(diagram: InfographicDiagram): string {
  if (diagram.template === 'vision_pyramid') return diagram.vision || 'Vision'
  if (diagram.template === 'feature_story') return diagram.headline || 'Feature Story'
  if (diagram.template === 'positioning_statement') return diagram.product_name || 'Positioning Statement'
  if (diagram.template === 'north_star_metric') return diagram.north_star || 'North Star Metric'
  return diagram.title || 'Untitled'
}

export function DeckCanvas({ deck, onDeckChange }: DeckCanvasProps) {
  const [selected, setSelected] = useState(0)
  const [busy, setBusy] = useState(false)

  const slide = deck?.slides[Math.min(selected, deck.slides.length - 1)] ?? null

  const handleDownload = async () => {
    if (!deck) return
    setBusy(true)
    try {
      await exportDeckPptx(deck.slides)
    } finally {
      setBusy(false)
    }
  }

  const updateSlide = (updated: InfographicDiagram) => {
    if (!deck) return
    const slides = deck.slides.slice()
    slides[Math.min(selected, deck.slides.length - 1)] = updated
    onDeckChange({ ...deck, slides })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-neutral-900">{deck?.title ?? 'Deck'}</h1>
          {deck ? (
            <>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                {deck.slides.length} slides
              </span>
              <span className="text-[11px] text-neutral-400">Click any text to edit it</span>
            </>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!deck || busy}
          onClick={handleDownload}
          className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Exporting…' : 'Download Deck PPTX'}
        </button>
      </div>
      <div className="flex min-h-0 flex-1">
        {deck ? (
          <>
            <aside className="flex w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r border-neutral-200 bg-white p-3">
              {deck.slides.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={`flex flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors ${
                    i === selected ? 'bg-primary/10 text-primary' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                    Slide {i + 1} · {TEMPLATE_LABEL[s.template]}
                  </span>
                  <span className="line-clamp-2 text-xs font-medium">{slideTitle(s)}</span>
                </button>
              ))}
            </aside>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-neutral-50 p-8">
              {slide ? renderInfographicPreview(slide, updateSlide) : null}
            </div>
          </>
        ) : (
          <div className="flex flex-1 bg-neutral-50">
            <EmptyCanvasState
              icon={InfographicIcon}
              title="No deck yet"
              description="Turn a full document (a PRD, plan, or strategy doc) into a multi-slide deck, one template per section."
              tips={[
                'Switch to "Full deck (PRD)" mode and paste the whole document',
                'The planner opens with a title + agenda, then picks a template per section',
                'Build — every slide stays editable, and exports as one .pptx',
              ]}
            />
          </div>
        )}
      </div>
    </div>
  )
}
