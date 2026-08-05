import { TOOLS, type ToolId } from '../lib/tools'

interface TopBarProps {
  activeTool: ToolId
}

export function TopBar({ activeTool }: TopBarProps) {
  const tool = TOOLS.find((t) => t.id === activeTool)

  return (
    <div className="flex h-14 shrink-0 items-center border-b border-neutral-200 bg-white px-5">
      <span className="text-sm text-neutral-600">
        Studio <span className="mx-1.5 text-neutral-300">/</span>
        <span className="font-semibold text-neutral-900">{tool?.label}</span>
      </span>
    </div>
  )
}
