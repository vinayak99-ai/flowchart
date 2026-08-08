import type { InfographicComparison } from '../../infographicTypes'
import { EditableText } from './EditableText'

// Column count is variable (2-4, driven by content), so this uses plain
// flex/CSS rather than a fixed-geometry SVG like WheelPreview -- text
// naturally reflows instead of needing per-box height math to avoid
// clipping, and the column count doesn't need separate SVG layouts.
const COLUMN_COLORS = ['#00754a', '#c9a227', '#14b0a0', '#8a5a0a']

interface ComparisonPreviewProps {
  comparison: InfographicComparison
  onChange: (comparison: InfographicComparison) => void
}

export function ComparisonPreview({ comparison, onChange }: ComparisonPreviewProps) {
  const columns = comparison.columns.slice(0, 4)

  const updateTitle = (title: string) => onChange({ ...comparison, title })
  const updateHeading = (i: number, heading: string) => {
    const next = comparison.columns.slice()
    next[i] = { ...next[i], heading }
    onChange({ ...comparison, columns: next })
  }
  const updatePoint = (i: number, j: number, text: string) => {
    const next = comparison.columns.slice()
    const points = next[i].points.slice()
    points[j] = text
    next[i] = { ...next[i], points }
    onChange({ ...comparison, columns: next })
  }

  return (
    <div className="flex h-full w-full flex-col gap-6 bg-white p-8">
      <EditableText
        value={comparison.title}
        onCommit={updateTitle}
        as="h2"
        className="text-center text-2xl font-extrabold uppercase tracking-wide text-neutral-900"
      />
      <div className="flex flex-1 items-stretch justify-center gap-4">
        {columns.map((col, i) => (
          <div
            key={i}
            className="flex w-full max-w-xs flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
          >
            <EditableText
              value={col.heading || `Option ${i + 1}`}
              onCommit={(heading) => updateHeading(i, heading)}
              as="div"
              className="px-3 py-3 text-center text-sm font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: COLUMN_COLORS[i % COLUMN_COLORS.length] }}
            />
            <ul className="flex flex-1 flex-col gap-3 p-4">
              {col.points.slice(0, 4).map((point, j) => (
                <li key={j} className="flex items-start gap-2 text-xs text-neutral-700">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: COLUMN_COLORS[i % COLUMN_COLORS.length] }}
                  />
                  <EditableText
                    value={point}
                    onCommit={(text) => updatePoint(i, j, text)}
                    as="span"
                    className="flex-1"
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
