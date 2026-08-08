import type { InfographicRoadmap } from '../../infographicTypes'
import { EditableText } from './EditableText'

// Same hue (brand primary green), fading light, matching the backend PPTX:
// closer horizons read visually "stronger" than farther-out ones.
const ROADMAP_COLORS = ['#0a4a30', '#00754a', '#5cae82']
const ROADMAP_TEXT_COLORS = ['#ffffff', '#ffffff', '#1f2622']
const ROADMAP_DEFAULT_HEADINGS = ['Now', 'Next', 'Later']

interface RoadmapPreviewProps {
  roadmap: InfographicRoadmap
  onChange: (roadmap: InfographicRoadmap) => void
}

export function RoadmapPreview({ roadmap, onChange }: RoadmapPreviewProps) {
  const columns = roadmap.columns.slice(0, 3)

  const updateTitle = (title: string) => onChange({ ...roadmap, title })
  const updateHeading = (i: number, heading: string) => {
    const next = roadmap.columns.slice()
    next[i] = { ...next[i], heading }
    onChange({ ...roadmap, columns: next })
  }
  const updateItem = (i: number, j: number, text: string) => {
    const next = roadmap.columns.slice()
    const items = next[i].items.slice()
    items[j] = text
    next[i] = { ...next[i], items }
    onChange({ ...roadmap, columns: next })
  }

  return (
    <div className="flex h-full w-full flex-col gap-6 bg-white p-8">
      <EditableText
        value={roadmap.title}
        onCommit={updateTitle}
        as="h2"
        className="text-center text-2xl font-extrabold uppercase tracking-wide text-neutral-900"
      />
      <div className="flex flex-1 items-stretch justify-center gap-4">
        {columns.map((col, i) => (
          <div key={i} className="flex w-full max-w-xs flex-col items-center gap-2">
            {/* A dot per column, sitting inside each column's own flow so it
                never needs cross-row alignment against a separate rail. */}
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: ROADMAP_COLORS[i] }}
            />
            <div className="flex w-full flex-1 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <EditableText
                value={col.heading || ROADMAP_DEFAULT_HEADINGS[i]}
                onCommit={(heading) => updateHeading(i, heading)}
                as="div"
                className="px-3 py-3 text-center text-sm font-bold uppercase tracking-wide"
                style={{ backgroundColor: ROADMAP_COLORS[i], color: ROADMAP_TEXT_COLORS[i] }}
              />
              <ul className="flex flex-1 flex-col gap-3 p-4">
                {col.items.slice(0, 5).map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-neutral-700">
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: ROADMAP_COLORS[i] }}
                    />
                    <EditableText
                      value={item}
                      onCommit={(text) => updateItem(i, j, text)}
                      as="span"
                      className="flex-1"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
