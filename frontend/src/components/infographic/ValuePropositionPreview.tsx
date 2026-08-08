import type { ValuePropositionSlide } from '../../infographicTypes'
import { EditableText } from './EditableText'

// Bronze for the customer side, brand green for the product side -- matches
// the backend PPTX and the "problem is warm, solution is green" convention
// used elsewhere (StoryPreview).
const CUSTOMER_COLOR = '#8a5a0a'
const PRODUCT_COLOR = '#00754a'
const BADGE_COLOR = '#c9a227'

interface ListSectionProps {
  label: string
  items: string[]
  color: string
  onUpdate: (items: string[]) => void
}

function ListSection({ label, items, color, onUpdate }: ListSectionProps) {
  const updateItem = (i: number, text: string) => {
    const next = items.slice()
    next[i] = text
    onUpdate(next)
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color }}>
        {label}
      </span>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-neutral-700">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <EditableText value={item} onCommit={(text) => updateItem(i, text)} as="span" className="flex-1" />
          </li>
        ))}
      </ul>
    </div>
  )
}

interface Section {
  key: string
  label: string
  items: string[]
  onUpdate: (items: string[]) => void
}

function Panel({ label, color, sections }: { label: string; color: string; sections: Section[] }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div
        className="px-3 py-2 text-center text-sm font-bold uppercase tracking-wide text-white"
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2 p-3">
        {sections.map((s) => (
          <ListSection key={s.key} label={s.label} items={s.items} color={color} onUpdate={s.onUpdate} />
        ))}
      </div>
    </div>
  )
}

interface ValuePropositionPreviewProps {
  value: ValuePropositionSlide
  onChange: (value: ValuePropositionSlide) => void
}

// A Value Proposition Canvas (Osterwalder): the customer's jobs/pains/gains
// on the left, mapped to the product's offerings/relievers/creators on the
// right -- makes the business-value case by showing which need each part
// of the product answers, rather than asserting value with a metric alone.
export function ValuePropositionPreview({ value, onChange }: ValuePropositionPreviewProps) {
  const updateTitle = (title: string) => onChange({ ...value, title })

  return (
    <div className="flex h-full w-full flex-col gap-4 bg-white p-8">
      <EditableText
        value={value.title}
        onCommit={updateTitle}
        as="h2"
        className="text-center text-2xl font-extrabold uppercase tracking-wide text-neutral-900"
      />
      <div className="flex flex-1 items-stretch gap-6">
        <Panel
          label="Customer"
          color={CUSTOMER_COLOR}
          sections={[
            {
              key: 'jobs',
              label: 'Jobs',
              items: value.customer_jobs,
              onUpdate: (items) => onChange({ ...value, customer_jobs: items }),
            },
            {
              key: 'pains',
              label: 'Pains',
              items: value.customer_pains,
              onUpdate: (items) => onChange({ ...value, customer_pains: items }),
            },
            {
              key: 'gains',
              label: 'Gains',
              items: value.customer_gains,
              onUpdate: (items) => onChange({ ...value, customer_gains: items }),
            },
          ]}
        />
        <div className="flex shrink-0 items-center justify-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-xs font-bold text-white shadow"
            style={{ backgroundColor: BADGE_COLOR }}
          >
            FIT
          </div>
        </div>
        <Panel
          label="Our Product"
          color={PRODUCT_COLOR}
          sections={[
            {
              key: 'products',
              label: 'Products & Services',
              items: value.products_services,
              onUpdate: (items) => onChange({ ...value, products_services: items }),
            },
            {
              key: 'relievers',
              label: 'Pain Relievers',
              items: value.pain_relievers,
              onUpdate: (items) => onChange({ ...value, pain_relievers: items }),
            },
            {
              key: 'creators',
              label: 'Gain Creators',
              items: value.gain_creators,
              onUpdate: (items) => onChange({ ...value, gain_creators: items }),
            },
          ]}
        />
      </div>
    </div>
  )
}
