import type { InfographicRoadmap } from '../../infographicTypes'

// Same hue, fading light, matching the backend PPTX: closer horizons read
// visually "stronger" than farther-out ones.
const ROADMAP_COLORS = ['#1f3a5f', '#3d5a80', '#9db6d1']
const ROADMAP_TEXT_COLORS = ['#ffffff', '#ffffff', '#1b1f1c']

interface RoadmapPreviewProps {
  roadmap: InfographicRoadmap
}

export function RoadmapPreview({ roadmap }: RoadmapPreviewProps) {
  const columns = roadmap.columns.slice(0, 3)

  return (
    <div className="flex h-full w-full flex-col gap-6 bg-white p-8">
      <h2 className="text-center text-2xl font-extrabold uppercase tracking-wide text-neutral-900">
        {roadmap.title || 'Title'}
      </h2>
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
              <div
                className="px-3 py-3 text-center text-sm font-bold uppercase tracking-wide"
                style={{ backgroundColor: ROADMAP_COLORS[i], color: ROADMAP_TEXT_COLORS[i] }}
              >
                {col.heading || ['Now', 'Next', 'Later'][i]}
              </div>
              <ul className="flex flex-1 flex-col gap-3 p-4">
                {col.items.slice(0, 5).map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-neutral-700">
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: ROADMAP_COLORS[i] }}
                    />
                    <span>{item}</span>
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
