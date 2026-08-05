import { useEffect, useRef, useState, type ReactNode } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ViewModeProvider, useViewMode } from "@/hooks/view-mode"

interface EditableBlockProps {
  // Document-styled rendering shown in read mode. Interactive elements
  // inside it (e.g. click-to-cycle badges) must stopPropagation so they
  // don't open the editor.
  read: ReactNode
  // Used for the accessible "Edit <label>" name of the clickable region.
  label?: string
  // The existing form controls; rendered as-is in global edit mode, and
  // inside an edit-scoped provider while this block is being edited.
  children: ReactNode
}

export function EditableBlock({ read, label, children }: EditableBlockProps) {
  const mode = useViewMode()
  const [editing, setEditing] = useState(false)
  const editRef = useRef<HTMLDivElement | null>(null)

  // Focus the editor wrapper when it opens, so Escape-to-close works
  // immediately (the clicked read view unmounts, dropping focus to <body>).
  useEffect(() => {
    if (editing) editRef.current?.focus()
  }, [editing])

  if (mode === "edit") return <>{children}</>

  if (!editing) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={label ? `Edit ${label}` : "Edit"}
        title="Click to edit"
        onClick={() => setEditing(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setEditing(true)
          }
        }}
        className="cursor-text rounded-md transition-colors hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {read}
      </div>
    )
  }

  return (
    <div
      ref={editRef}
      tabIndex={-1}
      className="flex flex-col gap-2 rounded-md p-2 ring-2 ring-ring/40 outline-none"
      onKeyDown={(e) => {
        if (e.key === "Escape") setEditing(false)
      }}
    >
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          <Check className="size-4" /> Done
        </Button>
      </div>
      {/* Everything inside an actively-edited block is fully editable,
          including nested lists that otherwise follow the page mode. */}
      <ViewModeProvider mode="edit">{children}</ViewModeProvider>
    </div>
  )
}
