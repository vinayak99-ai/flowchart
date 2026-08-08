import type { FeatureStory, StoryAct } from '../../infographicTypes'
import { EditableText } from './EditableText'

// Muted bronze (friction) -> brand green (the product, building the fix) ->
// gold (the payoff), matching the backend PPTX -- the color progression
// reinforces the arc even before the text is read, while staying inside
// the brand's green/gold family.
const STORY_COLORS: Record<'problem' | 'solution' | 'impact', string> = {
  problem: '#8a5a0a',
  solution: '#00754a',
  impact: '#c9a227',
}

interface StoryPreviewProps {
  story: FeatureStory
  onChange: (story: FeatureStory) => void
}

function ActPanel({
  act,
  color,
  onChange,
}: {
  act: StoryAct
  color: string
  onChange: (act: StoryAct) => void
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <EditableText
        value={act.heading}
        onCommit={(heading) => onChange({ ...act, heading })}
        as="div"
        className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white"
        style={{ backgroundColor: color }}
      />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <EditableText
          value={act.body}
          onCommit={(body) => onChange({ ...act, body })}
          as="p"
          multiline
          className="text-sm font-bold text-neutral-900"
        />
        <div className="mt-auto">
          <EditableText
            value={act.detail}
            onCommit={(detail) => onChange({ ...act, detail })}
            as="p"
            className="text-xs italic"
            style={{ color }}
          />
        </div>
      </div>
    </div>
  )
}

export function StoryPreview({ story, onChange }: StoryPreviewProps) {
  const updateHeadline = (headline: string) => onChange({ ...story, headline })
  const updateProblem = (problem: StoryAct) => onChange({ ...story, problem })
  const updateSolution = (solution: StoryAct) => onChange({ ...story, solution })
  const updateImpact = (impact: StoryAct) => onChange({ ...story, impact })

  return (
    <div className="flex h-full w-full flex-col gap-6 bg-white p-8">
      <EditableText
        value={story.headline}
        onCommit={updateHeadline}
        as="p"
        multiline
        className="text-center text-lg font-extrabold text-neutral-900"
      />
      <div className="flex flex-1 items-stretch gap-2">
        <ActPanel act={story.problem} color={STORY_COLORS.problem} onChange={updateProblem} />
        <div className="flex items-center text-2xl font-bold text-neutral-300">→</div>
        <ActPanel act={story.solution} color={STORY_COLORS.solution} onChange={updateSolution} />
        <div className="flex items-center text-2xl font-bold text-neutral-300">→</div>
        <ActPanel act={story.impact} color={STORY_COLORS.impact} onChange={updateImpact} />
      </div>
    </div>
  )
}
