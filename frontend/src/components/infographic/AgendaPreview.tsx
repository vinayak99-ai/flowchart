import type { AgendaSlide } from '../../infographicTypes'
import { EditableText } from './EditableText'

const BRAND_COLORS = ['#00754a', '#c9a227', '#14b0a0', '#8a5a0a', '#4a9020', '#5cc4a8']

interface AgendaPreviewProps {
  agenda: AgendaSlide
  onChange: (agenda: AgendaSlide) => void
}

// A table-of-contents slide: one row per other slide in the deck, each
// with a colored page-number chip (the real page it lands on, not a
// running count) -- close to BulletSummaryPreview's dot-and-text row, but
// the number is real information here, so it replaces the plain dot.
export function AgendaPreview({ agenda, onChange }: AgendaPreviewProps) {
  const updateTitle = (title: string) => onChange({ ...agenda, title })
  const updateLabel = (i: number, label: string) => {
    const next = agenda.items.slice()
    next[i] = { ...next[i], label }
    onChange({ ...agenda, items: next })
  }
  const updatePage = (i: number, text: string) => {
    const page = parseInt(text, 10)
    if (Number.isNaN(page)) return
    const next = agenda.items.slice()
    next[i] = { ...next[i], page }
    onChange({ ...agenda, items: next })
  }

  return (
    <div className="flex h-full w-full flex-col bg-white p-8">
      <EditableText
        value={agenda.title}
        onCommit={updateTitle}
        as="h2"
        className="text-center text-2xl font-extrabold uppercase tracking-wide text-neutral-900"
      />
      <ul className="mx-auto mt-2 flex w-full max-w-3xl flex-1 flex-col justify-center">
        {agenda.items.map((item, i) => {
          const color = BRAND_COLORS[i % BRAND_COLORS.length]
          return (
            <li key={i} className="flex items-center gap-4 border-b border-neutral-200 py-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: color }}
              >
                <EditableText
                  value={String(item.page).padStart(2, '0')}
                  onCommit={(text) => updatePage(i, text)}
                  as="span"
                />
              </div>
              <EditableText
                value={item.label}
                onCommit={(text) => updateLabel(i, text)}
                as="span"
                className="flex-1 text-base font-bold text-neutral-800"
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
