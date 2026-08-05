import { TOOLS, type ToolId } from '../lib/tools'

interface TopBarProps {
  activeTool: ToolId
}

export function TopBar({ activeTool }: TopBarProps) {
  const tool = TOOLS.find((t) => t.id === activeTool)

  return (
    <div className="flex h-14 shrink-0 items-center border-b border-neutral-200 bg-white px-5 dark:border-neutral-800 dark:bg-neutral-950">
      <span className="text-sm text-neutral-600 dark:text-neutral-400">
        Studio <span className="mx-1.5 text-neutral-300 dark:text-neutral-700">/</span>
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{tool?.label}</span>
      </span>
    </div>
  )
}
