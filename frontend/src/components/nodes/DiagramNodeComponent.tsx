import { useCallback, useState } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { nodeTheme } from '../../lib/theme'
import type { DiagramNodeData } from '../../lib/elkLayout'

export type DiagramFlowNode = Node<
  DiagramNodeData & { onLabelChange?: (id: string, label: string) => void },
  'diagramNode'
>

export function DiagramNodeComponent({ id, data, selected }: NodeProps<DiagramFlowNode>) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const style = nodeTheme[data.type]

  const commit = useCallback(() => {
    setIsEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== data.label) {
      data.onLabelChange?.(id, trimmed)
    } else {
      setDraft(data.label)
    }
  }, [draft, data, id])

  const selectedRing = selected ? 'ring-2 ring-offset-2 ring-primary' : ''

  const labelContent = isEditing ? (
    <input
      autoFocus
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit()
        if (event.key === 'Escape') {
          setDraft(data.label)
          setIsEditing(false)
        }
      }}
      className="w-full rounded border border-primary bg-white px-1 py-0.5 text-center text-xs text-neutral-900 outline-none"
      onClick={(event) => event.stopPropagation()}
    />
  ) : (
    <span
      className={`px-2 text-center text-xs leading-tight ${style.label}`}
      onDoubleClick={() => setIsEditing(true)}
    >
      {data.label}
    </span>
  )

  const handles = (
    <>
      <Handle type="target" position={Position.Top} className="!bg-neutral-600" />
      <Handle type="source" position={Position.Bottom} className="!bg-neutral-600" />
    </>
  )

  const groupTag = data.groupLabel ? (
    <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-neutral-900 px-2 py-0.5 text-[9px] font-medium tracking-wide text-white">
      {data.groupLabel}
    </div>
  ) : null

  if (style.shape === 'diamond') {
    return (
      <div className={`relative flex h-[72px] w-[200px] items-center justify-center ${selectedRing}`}>
        {groupTag}
        <div
          className={`absolute left-1/2 top-1/2 h-[62px] w-[62px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm ${style.container}`}
        />
        <div className="relative flex h-full w-full items-center justify-center">{labelContent}</div>
        {handles}
      </div>
    )
  }

  if (style.shape === 'parallelogram') {
    return (
      <div className={`relative flex h-[72px] w-[200px] items-center justify-center ${selectedRing}`}>
        {groupTag}
        <div className={`absolute inset-0 -skew-x-12 rounded-sm ${style.container}`} />
        <div className="relative flex h-full w-full items-center justify-center">{labelContent}</div>
        {handles}
      </div>
    )
  }

  if (style.shape === 'subprocess') {
    return (
      <div
        className={`relative flex h-[72px] w-[200px] items-center justify-center rounded-md ${style.container} ${selectedRing}`}
      >
        {groupTag}
        <div className="pointer-events-none absolute inset-y-0 left-1.5 w-px bg-neutral-600" />
        <div className="pointer-events-none absolute inset-y-0 right-1.5 w-px bg-neutral-600" />
        {labelContent}
        {handles}
      </div>
    )
  }

  const roundedClass = style.shape === 'pill' ? 'rounded-full' : 'rounded-lg'

  return (
    <div
      className={`relative flex h-[72px] w-[200px] items-center justify-center ${roundedClass} ${style.container} ${selectedRing}`}
    >
      {groupTag}
      {labelContent}
      {handles}
    </div>
  )
}
