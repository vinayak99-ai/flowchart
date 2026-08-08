import type { PositioningStatementSlide } from '../../infographicTypes'
import { EditableText } from './EditableText'

// Cycled across the sentence's filled-in slots, matching the backend PPTX,
// so each one reads as a distinct piece of the pitch rather than a wall of
// bold text.
const RUN_COLORS = ['#00754a', '#c9a227', '#14b0a0', '#8a5a0a']

interface PositioningStatementPreviewProps {
  positioning: PositioningStatementSlide
  onChange: (positioning: PositioningStatementSlide) => void
}

// The Geoffrey Moore positioning statement, assembled as one sentence with
// the filled slots color-emphasized -- deliberately a single flowing
// narrative, not a form of labeled fields, since the point is that it
// reads aloud as a pitch.
export function PositioningStatementPreview({ positioning, onChange }: PositioningStatementPreviewProps) {
  const updateTargetCustomer = (target_customer: string) => onChange({ ...positioning, target_customer })
  const updateNeed = (need: string) => onChange({ ...positioning, need })
  const updateProductName = (product_name: string) => onChange({ ...positioning, product_name })
  const updateCategory = (category: string) => onChange({ ...positioning, category })
  const updateKeyBenefit = (key_benefit: string) => onChange({ ...positioning, key_benefit })
  const updatePrimaryAlternative = (primary_alternative: string) => onChange({ ...positioning, primary_alternative })
  const updateDifferentiator = (differentiator: string) => onChange({ ...positioning, differentiator })

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-16">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          Positioning Statement
        </span>
        <div className="rounded-2xl border border-neutral-200 bg-white px-10 py-8 shadow-sm">
          <p className="text-center text-xl leading-relaxed text-neutral-800">
            For{' '}
            <EditableText
              value={positioning.target_customer}
              onCommit={updateTargetCustomer}
              as="span"
              className="font-bold"
              style={{ color: RUN_COLORS[0] }}
            />
            {' who '}
            <EditableText
              value={positioning.need}
              onCommit={updateNeed}
              as="span"
              className="font-bold"
              style={{ color: RUN_COLORS[1] }}
            />
            {', '}
            <EditableText
              value={positioning.product_name}
              onCommit={updateProductName}
              as="span"
              className="font-bold"
              style={{ color: RUN_COLORS[3] }}
            />
            {' is a '}
            <EditableText
              value={positioning.category}
              onCommit={updateCategory}
              as="span"
              className="font-bold"
              style={{ color: RUN_COLORS[0] }}
            />
            {' that '}
            <EditableText
              value={positioning.key_benefit}
              onCommit={updateKeyBenefit}
              as="span"
              className="font-bold"
              style={{ color: RUN_COLORS[1] }}
            />
            {'. Unlike '}
            <EditableText
              value={positioning.primary_alternative}
              onCommit={updatePrimaryAlternative}
              as="span"
              className="font-bold"
              style={{ color: RUN_COLORS[2] }}
            />
            {', we '}
            <EditableText
              value={positioning.differentiator}
              onCommit={updateDifferentiator}
              as="span"
              className="font-bold"
              style={{ color: RUN_COLORS[3] }}
            />
            {'.'}
          </p>
        </div>
      </div>
      <div className="h-2 w-full shrink-0" style={{ backgroundColor: RUN_COLORS[0] }} />
    </div>
  )
}
