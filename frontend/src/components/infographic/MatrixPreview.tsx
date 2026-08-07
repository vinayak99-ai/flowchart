import type { InfographicMatrix } from '../../infographicTypes'
import { EditableText } from './EditableText'

// Flexible enough for both a prioritization matrix (continuous axes like
// Impact/Effort) and a SWOT analysis (categorical axes) -- same layout,
// only the axis labels and quadrant content differ.
const QUADRANT_COLORS = ['#3d5a80', '#6b9b52', '#c9457a', '#e8a33d']

interface MatrixPreviewProps {
  matrix: InfographicMatrix
  onChange: (matrix: InfographicMatrix) => void
}

export function MatrixPreview({ matrix, onChange }: MatrixPreviewProps) {
  const quadrants = matrix.quadrants.slice(0, 4)

  const updateTitle = (title: string) => onChange({ ...matrix, title })
  const updateXAxis = (x_axis_label: string) => onChange({ ...matrix, x_axis_label })
  const updateYAxis = (y_axis_label: string) => onChange({ ...matrix, y_axis_label })
  const updateQuadrantLabel = (i: number, label: string) => {
    const next = matrix.quadrants.slice()
    next[i] = { ...next[i], label }
    onChange({ ...matrix, quadrants: next })
  }
  const updateItem = (i: number, j: number, text: string) => {
    const next = matrix.quadrants.slice()
    const items = next[i].items.slice()
    items[j] = text
    next[i] = { ...next[i], items }
    onChange({ ...matrix, quadrants: next })
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 bg-white p-8">
      <EditableText
        value={matrix.title}
        onCommit={updateTitle}
        as="h2"
        className="text-center text-2xl font-extrabold uppercase tracking-wide text-neutral-900"
      />
      <div className="flex flex-1 items-stretch gap-2">
        <div className="flex w-8 shrink-0 items-center justify-center">
          <div className="rotate-180 [writing-mode:vertical-rl]">
            <EditableText
              value={matrix.y_axis_label}
              onCommit={updateYAxis}
              as="span"
              className="text-xs font-bold uppercase tracking-wide text-neutral-500"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="grid flex-1 grid-cols-2 gap-2">
            {quadrants.map((q, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
              >
                <EditableText
                  value={q.label || `Quadrant ${i + 1}`}
                  onCommit={(label) => updateQuadrantLabel(i, label)}
                  as="div"
                  className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: QUADRANT_COLORS[i % QUADRANT_COLORS.length] }}
                />
                <ul className="flex flex-1 flex-col gap-1.5 p-3">
                  {q.items.slice(0, 4).map((item, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-[11px] text-neutral-700">
                      <span
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: QUADRANT_COLORS[i % QUADRANT_COLORS.length] }}
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
            ))}
          </div>
          <div className="text-center">
            <EditableText
              value={matrix.x_axis_label}
              onCommit={updateXAxis}
              as="span"
              className="text-xs font-bold uppercase tracking-wide text-neutral-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
