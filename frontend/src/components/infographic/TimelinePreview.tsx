import type { InfographicTimeline } from '../../infographicTypes'

const TIMELINE_COLORS = ['#3d5a80', '#6b9b52', '#c9457a', '#e8a33d', '#2a9d8f', '#8859a3']

interface TimelinePreviewProps {
  timeline: InfographicTimeline
}

export function TimelinePreview({ timeline }: TimelinePreviewProps) {
  const milestones = timeline.milestones.slice(0, 6)
  const n = milestones.length

  return (
    <div className="flex h-full w-full flex-col bg-white p-8">
      <h2 className="text-center text-2xl font-extrabold uppercase tracking-wide text-neutral-900">
        {timeline.title || 'Title'}
      </h2>
      <div className="relative mt-10 flex-1">
        <div className="absolute left-[6%] right-[6%] top-1/2 h-px -translate-y-1/2 bg-neutral-300" />
        {milestones.map((m, i) => {
          const leftPct = 6 + (n > 1 ? (i / (n - 1)) * 88 : 44)
          const above = i % 2 === 0
          const color = TIMELINE_COLORS[i % TIMELINE_COLORS.length]
          return (
            <div key={i} className="absolute top-1/2" style={{ left: `${leftPct}%` }}>
              <span
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div
                className={`absolute w-32 -translate-x-1/2 text-center ${above ? 'bottom-3' : 'top-3'}`}
              >
                <div className="rounded-lg border-2 bg-white p-2 shadow-sm" style={{ borderColor: color }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color }}>
                    {m.period || 'Period'}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-neutral-900">{m.label || 'Milestone'}</p>
                  {m.description ? (
                    <p className="mt-0.5 text-[10px] text-neutral-600">{m.description}</p>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
