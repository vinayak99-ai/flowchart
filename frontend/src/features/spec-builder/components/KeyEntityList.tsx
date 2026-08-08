import type { KeyEntity } from "@/features/spec-builder/lib/types"
import type { LucideIcon } from "lucide-react"
import { useViewMode } from "@/features/spec-builder/hooks/view-mode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Section } from "@/features/spec-builder/components/Section"
import { EditableBlock } from "@/features/spec-builder/components/EditableBlock"
import { X, Plus } from "lucide-react"

interface KeyEntityListProps {
  id: string
  icon: LucideIcon
  items: KeyEntity[]
  onChange: (items: KeyEntity[]) => void
}

export function KeyEntityList({ id, icon, items, onChange }: KeyEntityListProps) {
  const mode = useViewMode()

  function updateItem(index: number, field: keyof KeyEntity, value: string) {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function addItem() {
    onChange([...items, { name: "", description: "" }])
  }

  return (
    <Section id={id} title="Key entities" icon={icon} count={items.length}>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No key entities yet. These are drafted automatically when a spec is generated.
        </p>
      )}
      {items.map((entity, i) => (
        <EditableBlock
          key={i}
          label={entity.name || `entity ${i + 1}`}
          read={
            <p className="py-0.5 text-sm leading-relaxed">
              <span className="font-medium">{entity.name || "(unnamed)"}</span>
              {entity.description && <span className="text-muted-foreground"> — {entity.description}</span>}
            </p>
          }
        >
          <div className="flex items-center gap-2">
            <Input
              className="w-40 shrink-0"
              placeholder="Name"
              value={entity.name}
              onChange={(e) => updateItem(i, "name", e.target.value)}
            />
            <Input
              placeholder="Description"
              value={entity.description}
              onChange={(e) => updateItem(i, "description", e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(i)}
              aria-label="Remove key entity"
            >
              <X className="size-4" />
            </Button>
          </div>
        </EditableBlock>
      ))}
      {mode === "edit" && (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={addItem}>
          <Plus className="size-4" /> Add entity
        </Button>
      )}
    </Section>
  )
}
