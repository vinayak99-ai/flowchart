import { useState } from 'react'
import type { Persona, Voice } from '../../designThinkingTypes'
import { EditableText } from '../infographic/EditableText'

interface PersonaCardProps {
  persona: Persona
  onChange: (persona: Persona) => void
}

function BulletList({
  title,
  items,
  onChangeItem,
}: {
  title: string
  items: string[]
  onChangeItem: (i: number, text: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div>
      <h4 className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{title}</h4>
      <ul className="mt-1 space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-1.5 text-xs text-neutral-700">
            <span className="text-neutral-400">•</span>
            <EditableText value={item} onCommit={(text) => onChangeItem(i, text)} as="span" className="flex-1" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PersonaCard({ persona, onChange }: PersonaCardProps) {
  const [addingVoice, setAddingVoice] = useState(false)
  const [voiceDraft, setVoiceDraft] = useState<Voice>({ name: '', role: '', input: '' })

  const updateList = (field: 'goals' | 'pains' | 'behaviors', i: number, text: string) => {
    const next = persona[field].slice()
    next[i] = text
    onChange({ ...persona, [field]: next })
  }

  const commitVoice = () => {
    if (!voiceDraft.name.trim() || !voiceDraft.input.trim()) return
    onChange({ ...persona, voices: [...persona.voices, voiceDraft] })
    setVoiceDraft({ name: '', role: '', input: '' })
    setAddingVoice(false)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div>
        <EditableText
          value={persona.name}
          onCommit={(name) => onChange({ ...persona, name })}
          as="h3"
          className="text-sm font-bold text-neutral-900"
        />
        <EditableText
          value={persona.context}
          onCommit={(context) => onChange({ ...persona, context })}
          as="p"
          multiline
          className="mt-0.5 text-xs text-neutral-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <BulletList title="Goals" items={persona.goals} onChangeItem={(i, t) => updateList('goals', i, t)} />
        <BulletList title="Pains" items={persona.pains} onChangeItem={(i, t) => updateList('pains', i, t)} />
        <BulletList title="Behaviors" items={persona.behaviors} onChangeItem={(i, t) => updateList('behaviors', i, t)} />
      </div>

      {persona.voices.length > 0 ? (
        <div className="rounded-lg bg-neutral-50 p-2.5">
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Contributed by</h4>
          <ul className="mt-1 space-y-1">
            {persona.voices.map((v, i) => (
              <li key={i} className="text-xs text-neutral-700">
                <span className="font-semibold">
                  {v.name} ({v.role}):
                </span>{' '}
                {v.input}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {addingVoice ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-dashed border-neutral-300 p-2.5">
          <div className="flex gap-1.5">
            <input
              value={voiceDraft.name}
              onChange={(e) => setVoiceDraft({ ...voiceDraft, name: e.target.value })}
              placeholder="Name"
              className="w-1/2 rounded border border-neutral-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-primary"
            />
            <input
              value={voiceDraft.role}
              onChange={(e) => setVoiceDraft({ ...voiceDraft, role: e.target.value })}
              placeholder="Role (e.g. Support Lead)"
              className="w-1/2 rounded border border-neutral-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-primary"
            />
          </div>
          <textarea
            value={voiceDraft.input}
            onChange={(e) => setVoiceDraft({ ...voiceDraft, input: e.target.value })}
            placeholder="What did they tell you?"
            className="h-14 w-full resize-none rounded border border-neutral-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-primary"
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={commitVoice}
              className="rounded bg-primary px-2 py-1 text-[11px] font-semibold text-white hover:bg-primary-dark"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAddingVoice(false)}
              className="rounded px-2 py-1 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingVoice(true)}
          className="self-start text-[11px] font-medium text-primary hover:underline"
        >
          + Add a colleague's input
        </button>
      )}
    </div>
  )
}
