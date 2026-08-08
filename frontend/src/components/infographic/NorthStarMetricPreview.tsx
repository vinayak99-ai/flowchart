import type { MetricDriver, NorthStarMetricSlide } from '../../infographicTypes'
import { EditableText } from './EditableText'

const DRIVER_COLORS = ['#00754a', '#c9a227', '#14b0a0', '#8a5a0a']

interface NorthStarMetricPreviewProps {
  northStar: NorthStarMetricSlide
  onChange: (northStar: NorthStarMetricSlide) => void
}

// Hero panel naming the one metric that captures core product value, with
// connector lines fanning down to the 3-5 driver metrics a team actually
// tracks to move it -- a literal metric tree rather than a bare list.
export function NorthStarMetricPreview({ northStar, onChange }: NorthStarMetricPreviewProps) {
  const drivers = northStar.drivers.slice(0, 5)

  const updateNorthStar = (north_star: string) => onChange({ ...northStar, north_star })
  const updateDefinition = (definition: string) => onChange({ ...northStar, definition })
  const updateDriver = (i: number, field: keyof MetricDriver, text: string) => {
    const next = northStar.drivers.slice()
    next[i] = { ...next[i], [field]: text }
    onChange({ ...northStar, drivers: next })
  }

  return (
    <div className="flex h-full w-full flex-col gap-0 bg-white p-6">
      <div className="rounded-xl bg-[#00754a] px-6 py-5 text-center shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-100">
          North Star Metric
        </span>
        <EditableText
          value={northStar.north_star}
          onCommit={updateNorthStar}
          as="p"
          className="mt-1 text-2xl font-extrabold text-white"
        />
        <EditableText
          value={northStar.definition}
          onCommit={updateDefinition}
          as="p"
          multiline
          className="mx-auto mt-2 max-w-xl text-xs text-emerald-50/90"
        />
      </div>

      <div className="mx-auto h-4 w-px bg-neutral-300" />

      <div className="flex flex-1 items-stretch gap-3 border-t border-neutral-300 pt-4">
        {drivers.map((driver, i) => {
          const color = DRIVER_COLORS[i % DRIVER_COLORS.length]
          return (
            <div
              key={i}
              className="relative flex flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
            >
              <div className="absolute -top-4 left-1/2 h-4 w-px -translate-x-1/2 bg-neutral-300" />
              <div className="h-1.5" style={{ backgroundColor: color }} />
              <div className="flex flex-1 flex-col items-center gap-1.5 px-3 py-3 text-center">
                <EditableText
                  value={driver.label}
                  onCommit={(text) => updateDriver(i, 'label', text)}
                  as="span"
                  className="text-[11px] font-bold uppercase tracking-wide text-neutral-800"
                />
                <EditableText
                  value={driver.metric}
                  onCommit={(text) => updateDriver(i, 'metric', text)}
                  as="span"
                  className="text-sm font-bold"
                  style={{ color }}
                />
                <EditableText
                  value={driver.description}
                  onCommit={(text) => updateDriver(i, 'description', text)}
                  as="span"
                  multiline
                  className="text-[10px] leading-snug text-neutral-500"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
