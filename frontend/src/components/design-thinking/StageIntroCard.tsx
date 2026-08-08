interface StageIntroCardProps {
  title: string
  steps: string[]
}

// Fills the space below a stage's action bar before it has any output --
// what the RACI-shaped void used to look like in every generation tool
// before this pass, now replaced with a concrete preview of what's about
// to happen instead of empty gray.
export function StageIntroCard({ title, steps }: StageIntroCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white/60 p-4">
      <p className="text-xs font-semibold text-neutral-700">{title}</p>
      <ol className="mt-2 flex flex-col gap-1.5">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2 text-xs text-neutral-500">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
