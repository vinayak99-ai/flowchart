import type { ComponentType, SVGProps } from 'react'

interface EmptyCanvasStateProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  description: string
  tips?: string[]
}

// A shared, denser replacement for the old "one gray sentence floating in
// a sea of empty gray" placeholder every generation tool used before its
// first result -- same idea everywhere (icon, short headline, a few
// concrete next steps) so the void reads as guidance, not dead space.
export function EmptyCanvasState({ icon: Icon, title, description, tips }: EmptyCanvasStateProps) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white/70 px-8 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{title}</p>
          <p className="mt-1 text-xs text-neutral-500">{description}</p>
        </div>
        {tips && tips.length > 0 ? (
          <ul className="mt-1 flex flex-col gap-1.5 self-stretch text-left">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-xs text-neutral-600">
                <span className="mt-0.5 shrink-0 text-primary">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
