import type { InfographicComparison } from '../../infographicTypes'

// Column count is variable (2-4, driven by content), so this uses plain
// flex/CSS rather than a fixed-geometry SVG like WheelPreview -- text
// naturally reflows instead of needing per-box height math to avoid
// clipping, and the column count doesn't need separate SVG layouts.
const COLUMN_COLORS = ['#3d5a80', '#6b9b52', '#c9457a', '#e8a33d']

interface ComparisonPreviewProps {
  comparison: InfographicComparison
}

export function ComparisonPreview({ comparison }: ComparisonPreviewProps) {
  const columns = comparison.columns.slice(0, 4)

  return (
    <div className="flex h-full w-full flex-col gap-6 bg-white p-8">
      <h2 className="text-center text-2xl font-extrabold uppercase tracking-wide text-neutral-900">
        {comparison.title || 'Title'}
      </h2>
      <div className="flex flex-1 items-stretch justify-center gap-4">
        {columns.map((col, i) => (
          <div
            key={i}
            className="flex w-full max-w-xs flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
          >
            <div
              className="px-3 py-3 text-center text-sm font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: COLUMN_COLORS[i % COLUMN_COLORS.length] }}
            >
              {col.heading || `Option ${i + 1}`}
            </div>
            <ul className="flex flex-1 flex-col gap-3 p-4">
              {col.points.slice(0, 4).map((point, j) => (
                <li key={j} className="flex items-start gap-2 text-xs text-neutral-700">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: COLUMN_COLORS[i % COLUMN_COLORS.length] }}
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
