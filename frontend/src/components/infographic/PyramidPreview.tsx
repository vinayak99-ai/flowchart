import type { InfographicPyramid } from '../../infographicTypes'
import { EditableText } from './EditableText'

// Matches the backend's freeform band geometry (apex/base width ratio),
// expressed as CSS clip-path polygons instead of literal shape corners --
// the pyramid silhouette without any autoshape-adjustment math on either side.
const APEX_FRACTION = 1.8 / 8.5
const PILLAR_COLORS = ['#3d5a80', '#6b9b52', '#c9457a', '#e8a33d']

function widthFraction(j: number, totalBands: number): number {
  return APEX_FRACTION + (1 - APEX_FRACTION) * (j / totalBands)
}

interface PyramidPreviewProps {
  pyramid: InfographicPyramid
  onChange: (pyramid: InfographicPyramid) => void
}

export function PyramidPreview({ pyramid, onChange }: PyramidPreviewProps) {
  const pillars = pyramid.pillars.slice(0, 4)
  const totalBands = Math.max(1 + pillars.length, 2)

  const updateVision = (vision: string) => onChange({ ...pyramid, vision })
  const updatePillarLabel = (i: number, label: string) => {
    const next = pyramid.pillars.slice()
    next[i] = { ...next[i], label }
    onChange({ ...pyramid, pillars: next })
  }
  const updatePillarDescription = (i: number, description: string) => {
    const next = pyramid.pillars.slice()
    next[i] = { ...next[i], description }
    onChange({ ...pyramid, pillars: next })
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 bg-white p-8">
      <EditableText
        value={pyramid.vision}
        onCommit={updateVision}
        as="p"
        className="text-center text-xl font-extrabold text-neutral-900"
      />
      <div className="flex flex-1 flex-col gap-1">
        {Array.from({ length: totalBands }).map((_, i) => {
          const w0 = widthFraction(i, totalBands) * 100
          const w1 = widthFraction(i + 1, totalBands) * 100
          const clipPath = `polygon(${(100 - w0) / 2}% 0%, ${(100 + w0) / 2}% 0%, ${(100 + w1) / 2}% 100%, ${(100 - w1) / 2}% 100%)`
          const isVision = i === 0
          const pillar = pillars[i - 1]

          return (
            <div key={i} className="relative flex-1">
              <div
                className="absolute inset-0"
                style={{
                  clipPath,
                  backgroundColor: isVision ? '#1b1f1c' : PILLAR_COLORS[(i - 1) % PILLAR_COLORS.length],
                }}
              />
              <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
                {isVision ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                    Vision
                  </span>
                ) : (
                  <>
                    <EditableText
                      value={pillar?.label ?? ''}
                      onCommit={(label) => updatePillarLabel(i - 1, label)}
                      as="span"
                      className="text-sm font-bold uppercase text-white"
                    />
                    <EditableText
                      value={pillar?.description ?? ''}
                      onCommit={(description) => updatePillarDescription(i - 1, description)}
                      as="span"
                      className="mt-0.5 text-[11px] text-white/85"
                    />
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
