import type { TitleSlide } from '../../infographicTypes'
import { EditableText } from './EditableText'

// Brand palette (matches infographic_template.py's BRAND_COLORS), cycled
// across the highlight chips the same way the backend cycles them.
const BRAND_COLORS = ['#00754a', '#c9a227', '#14b0a0', '#8a5a0a', '#4a9020']

interface TitlePreviewProps {
  title: TitleSlide
  onChange: (title: TitleSlide) => void
}

// The deck's cover slide -- deliberately distinct from every content
// template: a thin top bar (content slides carry none), a centered
// headline + gold rule + subtitle, and a row of highlight chips, rather
// than a left-aligned title-and-list shape.
export function TitlePreview({ title, onChange }: TitlePreviewProps) {
  const updateTitle = (value: string) => onChange({ ...title, title: value })
  const updateSubtitle = (subtitle: string) => onChange({ ...title, subtitle })
  const updateHighlight = (i: number, text: string) => {
    const next = title.highlights.slice()
    next[i] = text
    onChange({ ...title, highlights: next })
  }

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="h-2 w-full shrink-0" style={{ backgroundColor: BRAND_COLORS[0] }} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-16 text-center">
        <EditableText
          value={title.title}
          onCommit={updateTitle}
          as="h2"
          className="text-4xl font-extrabold leading-tight text-[#1f2622]"
        />
        <div className="h-[3px] w-24 rounded-full" style={{ backgroundColor: BRAND_COLORS[1] }} />
        <EditableText
          value={title.subtitle}
          onCommit={updateSubtitle}
          as="p"
          multiline
          className="max-w-2xl text-lg text-neutral-600"
        />
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {title.highlights.map((highlight, i) => (
            <div
              key={i}
              className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: BRAND_COLORS[i % BRAND_COLORS.length] }}
            >
              <EditableText value={highlight} onCommit={(text) => updateHighlight(i, text)} as="span" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
