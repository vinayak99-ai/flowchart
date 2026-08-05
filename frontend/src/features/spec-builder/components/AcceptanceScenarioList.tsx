import type { AcceptanceScenario } from "@/features/spec-builder/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus } from "lucide-react"

interface AcceptanceScenarioListProps {
  items: AcceptanceScenario[]
  onChange: (items: AcceptanceScenario[]) => void
}

const emptyScenario: AcceptanceScenario = { given: "", when: "", then: "" }

export function AcceptanceScenarioList({ items, onChange }: AcceptanceScenarioListProps) {
  function updateItem(index: number, field: keyof AcceptanceScenario, value: string) {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function addItem() {
    onChange([...items, { ...emptyScenario }])
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Acceptance scenarios</Label>
      {items.map((scenario, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Scenario {i + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(i)}
              aria-label="Remove acceptance scenario"
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Given</Label>
              <Input
                value={scenario.given}
                onChange={(e) => updateItem(i, "given", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">When</Label>
              <Input
                value={scenario.when}
                onChange={(e) => updateItem(i, "when", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Then</Label>
              <Input
                value={scenario.then}
                onChange={(e) => updateItem(i, "then", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={addItem}>
        <Plus className="size-4" /> Add scenario
      </Button>
    </div>
  )
}
