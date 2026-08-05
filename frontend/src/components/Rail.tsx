import { TOOLS, type ToolId } from '../lib/tools'

interface RailProps {
  activeTool: ToolId
  onSelect: (id: ToolId) => void
}

export function Rail({ activeTool, onSelect }: RailProps) {
  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-1.5 border-r border-neutral-200 bg-white py-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mb-4 flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-white">
        S
      </div>
      {TOOLS.map((tool) => {
        const Icon = tool.icon
        const isActive = tool.id === activeTool
        return (
          <div key={tool.id} className="group relative">
            <button
              type="button"
              onClick={() => onSelect(tool.id)}
              aria-label={tool.label}
              className={`relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary-dark dark:bg-primary/20 dark:text-primary'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Icon className="h-[19px] w-[19px]" />
              {tool.status === 'soon' ? (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full border border-white bg-accent dark:border-neutral-950" />
              ) : null}
            </button>
            <div className="pointer-events-none absolute left-14 top-1/2 z-10 -translate-y-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {tool.label}
              {tool.status === 'soon' ? ' — Soon' : ''}
            </div>
          </div>
        )
      })}
    </aside>
  )
}
