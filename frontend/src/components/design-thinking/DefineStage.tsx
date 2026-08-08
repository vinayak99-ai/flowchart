import { useState } from 'react'
import { generateProblemStatements } from '../../lib/designThinkingApi'
import type { Persona, ProblemStatement } from '../../designThinkingTypes'
import { EditableText } from '../infographic/EditableText'
import { GenerateBar } from './GenerateBar'
import { StageIntroCard } from './StageIntroCard'

interface DefineStageProps {
  personas: Persona[]
  statements: ProblemStatement[]
  onChange: (statements: ProblemStatement[]) => void
  onContinue: () => void
}

export function DefineStage({ personas, statements, onChange, onContinue }: DefineStageProps) {
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setError(null)
    setBusy(true)
    try {
      const { problem_statements } = await generateProblemStatements(personas, prompt)
      onChange(problem_statements)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const updateStatement = (i: number, assembled: string) => {
    const next = statements.slice()
    next[i] = { ...next[i], assembled }
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <GenerateBar
        prompt={prompt}
        onPromptChange={setPrompt}
        placeholder="Optional nudge, e.g. 'Weight the reliability pain more heavily.'"
        onGenerate={handleGenerate}
        busy={busy}
        hasResult={statements.length > 0}
        disabled={personas.length === 0}
        error={error}
      />

      {statements.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {statements.map((s, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  {s.persona_name}
                </span>
                <EditableText
                  value={s.assembled}
                  onCommit={(text) => updateStatement(i, text)}
                  as="p"
                  multiline
                  className="mt-1.5 border-l-2 border-primary pl-3 text-sm font-medium italic text-neutral-800"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="self-start rounded-md border border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-primary-light"
          >
            Continue to Ideate →
          </button>
        </>
      ) : (
        <StageIntroCard
          title="What Define produces"
          steps={[
            'One POV problem statement per persona, synthesized from their goals and pains',
            'Assembled as one sentence — a claim, not a filled-in form',
            'Deliberately no solution here — that comes in Ideate',
          ]}
        />
      )}
    </div>
  )
}
