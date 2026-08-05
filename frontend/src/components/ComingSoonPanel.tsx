import type { ToolDef } from '../lib/tools'

interface ComingSoonPanelProps {
  tool: ToolDef
}

export function ComingSoonPanel({ tool }: ComingSoonPanelProps) {
  const Icon = tool.icon

  return (
    <div className="flex min-h-0 flex-1 items-start p-12">
      <div className="flex max-w-md flex-col gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">{tool.label}</h3>
        <p className="max-w-[46ch] text-sm leading-relaxed text-neutral-600">{tool.description}</p>
        <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-neutral-600">
          <span className="rounded-full border border-accent/40 bg-accent-light px-2 py-0.5 uppercase tracking-wide text-accent">
            Soon
          </span>
          {tool.sharedWith}
        </div>
      </div>
    </div>
  )
}
