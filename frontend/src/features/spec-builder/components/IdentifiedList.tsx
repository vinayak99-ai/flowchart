import { useRef } from "react"
import type { LucideIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useViewMode } from "@/features/spec-builder/hooks/view-mode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Section } from "@/features/spec-builder/components/Section"
import { EditableBlock } from "@/features/spec-builder/components/EditableBlock"
import { X, Plus } from "lucide-react"

interface Identified {
  id: string
  text: string
  kind?: string
}

interface IdentifiedListProps<T extends Identified> {
  id: string
  icon: LucideIcon
  label: string
  prefix: string
  items: T[]
  onChange: (items: T[]) => void
  defaultItem?: Partial<T>
}

function nextId(items: Identified[], prefix: string): string {
  const numbers = items
    .map((item) => {
      const match = item.id.match(/(\d+)\s*$/)
      return match ? parseInt(match[1], 10) : 0
    })
    .filter((n) => !Number.isNaN(n))
  const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1
  return `${prefix}-${String(next).padStart(3, "0")}`
}

export function IdentifiedList<T extends Identified>({
  id: sectionId,
  icon,
  label,
  prefix,
  items,
  onChange,
  defaultItem,
}: IdentifiedListProps<T>) {
  const toast = useToast()
  const mode = useViewMode()
  // Latest items/onChange, so a toast's Undo (which fires seconds later)
  // restores into the list as it is *then*, not as it was at deletion time.
  const latest = useRef({ items, onChange })
  latest.current = { items, onChange }

  function updateItem(index: number, patch: Partial<T>) {
    const next = [...items]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  function removeItem(index: number) {
    const removed = items[index]
    onChange(items.filter((_, i) => i !== index))
    toast({
      title: `${removed.id} removed`,
      description: removed.text || undefined,
      action: {
        label: "Undo",
        onClick: () => {
          const { items: current, onChange: change } = latest.current
          const next = [...current]
          next.splice(Math.min(index, next.length), 0, removed)
          change(next)
        },
      },
    })
  }

  function addItem() {
    const id = nextId(items, prefix)
    onChange([...items, { ...defaultItem, id, text: "" } as T])
  }

  function toggleKind(index: number) {
    const current = items[index].kind
    if (!current) return
    updateItem(index, { kind: current === "functional" ? "non_functional" : "functional" } as Partial<T>)
  }

  function kindBadge(item: T, index: number) {
    if (!item.kind) return null
    return (
      <Badge
        role="button"
        tabIndex={0}
        variant={item.kind === "non_functional" ? "secondary" : "outline"}
        className="shrink-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          toggleKind(index)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation()
            toggleKind(index)
          }
        }}
      >
        {item.kind.replace("_", "-")}
      </Badge>
    )
  }

  return (
    <Section id={sectionId} title={label} icon={icon} count={items.length}>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No {label.toLowerCase()} yet. These are drafted automatically when a spec is generated.
        </p>
      )}
      {items.map((item, i) => (
        <EditableBlock
          key={i}
          label={item.id}
          read={
            <div className="flex items-baseline gap-2 py-0.5">
              <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{item.id}</span>
              {kindBadge(item, i)}
              <span className="min-w-0 text-sm leading-relaxed">
                {item.text || <span className="text-muted-foreground italic">(empty)</span>}
              </span>
            </div>
          }
        >
          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{item.id}</span>
            {kindBadge(item, i)}
            <Input value={item.text} onChange={(e) => updateItem(i, { text: e.target.value } as Partial<T>)} />
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
    </Section>
  )
}
