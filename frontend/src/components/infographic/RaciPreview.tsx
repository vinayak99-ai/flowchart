import type { RaciChartSlide, RaciRow } from '../../infographicTypes'
import { EditableText } from './EditableText'

const ROLE_LABELS: { key: keyof RaciRow; letter: string; word: string; color: string }[] = [
  { key: 'responsible', letter: 'R', word: 'Responsible', color: '#00754a' },
  { key: 'accountable', letter: 'A', word: 'Accountable', color: '#c9a227' },
  { key: 'consulted', letter: 'C', word: 'Consulted', color: '#14b0a0' },
  { key: 'informed', letter: 'I', word: 'Informed', color: '#8a5a0a' },
]

interface RaciPreviewProps {
  raci: RaciChartSlide
  onChange: (raci: RaciChartSlide) => void
}

// Who owns what: a task column plus 4 fixed RACI role columns, each cell
// holding a name/role rather than a matrix of R/A/C/I letters -- reads
// directly as "who do I talk to" without a legend.
export function RaciPreview({ raci, onChange }: RaciPreviewProps) {
  const updateTitle = (title: string) => onChange({ ...raci, title })
  const updateCell = (i: number, field: keyof RaciRow, text: string) => {
    const next = raci.rows.slice()
    next[i] = { ...next[i], [field]: text }
    onChange({ ...raci, rows: next })
  }

  return (
    <div className="flex h-full w-full flex-col gap-3 bg-white p-6">
      <EditableText
        value={raci.title}
        onCommit={updateTitle}
        as="h2"
        className="text-center text-2xl font-extrabold uppercase tracking-wide text-neutral-900"
      />
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200">
        <div className="flex">
          <div className="flex w-[34%] items-center bg-neutral-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
            Initiative
          </div>
          {ROLE_LABELS.map((role) => (
            <div
              key={role.key}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
              style={{ backgroundColor: role.color }}
            >
              <span className="text-base font-bold text-white">{role.letter}</span>
              <span className="text-[9px] font-medium text-white/90">{role.word}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col">
          {raci.rows.map((row, i) => (
            <div
              key={i}
              className={`flex flex-1 items-center border-t border-neutral-200 ${i % 2 === 0 ? 'bg-neutral-50/60' : 'bg-white'}`}
            >
              <div className="w-[34%] px-3">
                <EditableText
                  value={row.task}
                  onCommit={(text) => updateCell(i, 'task', text)}
                  as="span"
                  className="text-sm font-bold text-neutral-900"
                />
              </div>
              {ROLE_LABELS.map((role) => (
                <div key={role.key} className="flex-1 border-l border-neutral-200 px-2 text-center">
                  <EditableText
                    value={row[role.key]}
                    onCommit={(text) => updateCell(i, role.key, text)}
                    as="span"
                    className="text-xs text-neutral-700"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
