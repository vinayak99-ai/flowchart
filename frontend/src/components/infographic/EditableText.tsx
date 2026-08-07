import { useRef } from 'react'
import type { CSSProperties, ClipboardEvent, ElementType, FocusEvent, KeyboardEvent } from 'react'

interface EditableTextProps {
  value: string
  onCommit: (value: string) => void
  as?: 'span' | 'div' | 'p' | 'h2'
  className?: string
  style?: CSSProperties
  multiline?: boolean
}

// contentEditable, committed on blur (not on every keystroke) so React
// re-rendering with the just-typed value never fights the DOM mid-edit --
// the classic "cursor jumps to the start" bug that a live-controlled
// contentEditable would hit.
export function EditableText({
  value,
  onCommit,
  as = 'span',
  className,
  style,
  multiline = false,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null)
  const Tag = as as ElementType

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    const text = (event.currentTarget.textContent ?? '').trim()
    if (text !== value) onCommit(text)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!multiline && event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    } else if (event.key === 'Escape') {
      if (ref.current) ref.current.textContent = value
      event.currentTarget.blur()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLElement>) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  return (
    <Tag
      ref={ref as never}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      style={style}
      className={`${className ?? ''} cursor-text rounded-sm outline-none transition-colors hover:bg-black/[0.04] focus:bg-black/[0.06] focus:ring-1 focus:ring-inset focus:ring-primary/50`}
    >
      {value}
    </Tag>
  )
}
