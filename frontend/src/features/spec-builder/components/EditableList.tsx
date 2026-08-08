import type { LucideIcon } from "lucide-react"
import { useViewMode } from "@/features/spec-builder/hooks/view-mode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Section } from "@/features/spec-builder/components/Section"
import { EditableBlock } from "@/features/spec-builder/components/EditableBlock"
import { X, Plus } from "lucide-react"

interface EditableListProps {
  // When id + icon are provided, the list renders as its own collapsible
  // Section (top-level spec sections). Without them it renders as a plain
  // inline list (e.g. acceptance criteria nested inside a story card).
  id?: string
  icon?: LucideIcon
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}

export function EditableList({ id, icon, label, items, onChange, placeholder }: EditableListProps) {
  const mode = useViewMode()

  function updateItem(index: number, value: string) {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function addItem() {
    onChange([...items, ""])
  }

  const body = (
    <>
      {items.map((item, i) => (
        <EditableBlock
          key={i}
          label={`${label} item ${i + 1}`}
          read={
            <p className="py-0.5 pl-4 text-sm leading-relaxed before:mr-2 before:content-['•']">
              {item || <span className="text-muted-foreground italic">(empty)</span>}
            </p>
          }
        >
          <div className="flex items-center gap-2">
            <Input
              value={item}
              placeholder={placeholder}
              onChange={(e) => updateItem(i, e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(i)}
              aria-label={`Remove ${label} item`}
            >
              <X className="size-4" />
            </Button>
          </div>
        </EditableBlock>
      ))}
      {mode === "edit" && (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={addItem}>
          <Plus className="size-4" /> Add
        </Button>
      )}
    </>
  )

  if (id && icon) {
    return (
      <Section id={id} title={label} icon={icon} count={items.length}>
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No {label.toLowerCase()} yet. These are drafted automatically when a spec is generated.
          </p>
        )}
        {body}
      </Section>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {body}
    </div>
  )
}
