interface GenerateBarProps {
  prompt: string
  onPromptChange: (value: string) => void
  placeholder: string
  onGenerate: () => void
  busy: boolean
  hasResult: boolean
  disabled?: boolean
  error?: string | null
}

// One consistent "nudge + generate/regenerate" control reused at the top of
// every stage -- keeps every stage's action bar identical so the PM never
// has to relearn the pattern moving from Empathize to Test.
export function GenerateBar({
  prompt,
  onPromptChange,
  placeholder,
  onGenerate,
  busy,
  hasResult,
  disabled,
  error,
}: GenerateBarProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <input
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-900 outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={onGenerate}
          disabled={busy || disabled}
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Generating…' : hasResult ? 'Regenerate' : 'Generate'}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
