import { useEffect, useState } from "react"
import type { BriefAudience, Stakeholder, StakeholderLevel } from "@/lib/types"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Section } from "@/components/Section"
import { Users, Trash2, Plus } from "lucide-react"

interface StakeholdersSectionProps {
  projectId: string
}

const AUDIENCES: BriefAudience[] = ["executive", "engineering", "sales"]
const LEVELS: StakeholderLevel[] = ["high", "medium", "low"]

const selectClass =
  "border-input h-9 rounded-md border bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

function nextId(stakeholders: Stakeholder[]): string {
  const max = stakeholders.reduce((n, s) => {
    const m = s.id.match(/SH-(\d+)$/)
    return m ? Math.max(n, parseInt(m[1], 10)) : n
  }, 0)
  return `SH-${max + 1}`
}

export function StakeholdersSection({ projectId }: StakeholdersSectionProps) {
  const toast = useToast()
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getStakeholders(projectId)
      .then(({ stakeholders }) => setStakeholders(stakeholders))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [projectId])

  function update(index: number, patch: Partial<Stakeholder>) {
    setStakeholders((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
    setDirty(true)
  }

  function add() {
    setStakeholders((prev) => [
      ...prev,
      {
        id: nextId(prev),
        name: "",
        role: "",
        audience: "executive",
        influence: "medium",
        interest: "medium",
        cares_about: "",
      },
    ])
    setDirty(true)
  }

  function remove(index: number) {
    setStakeholders((prev) => prev.filter((_, i) => i !== index))
    setDirty(true)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await api.saveStakeholders(projectId, stakeholders)
      setStakeholders(res.stakeholders)
      setDirty(false)
      toast({ title: "Stakeholders saved" })
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <Section
      id="stakeholders"
      title="Stakeholders"
      icon={Users}
      count={stakeholders.length}
      actions={
        <>
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <Plus className="size-4" /> Add stakeholder
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={saving || !dirty}>
            {saving ? "Saving…" : dirty ? "Save stakeholders" : "Saved"}
          </Button>
        </>
      }
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      {stakeholders.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No stakeholders yet. Add the people who care about this project — briefs below are tuned to them.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {stakeholders.map((s, i) => (
          <div key={s.id} className="flex flex-col gap-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(i)}
                aria-label="Remove stakeholder"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input placeholder="Name" value={s.name} onChange={(e) => update(i, { name: e.target.value })} />
              <Input placeholder="Role" value={s.role} onChange={(e) => update(i, { role: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Audience</Label>
                <select
                  className={selectClass}
                  value={s.audience}
                  onChange={(e) => update(i, { audience: e.target.value as BriefAudience })}
                >
                  {AUDIENCES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Influence</Label>
                <select
                  className={selectClass}
                  value={s.influence}
                  onChange={(e) => update(i, { influence: e.target.value as StakeholderLevel })}
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Interest</Label>
                <select
                  className={selectClass}
                  value={s.interest}
                  onChange={(e) => update(i, { interest: e.target.value as StakeholderLevel })}
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              placeholder="Cares about (metrics? risk? timeline?)"
              value={s.cares_about}
              onChange={(e) => update(i, { cares_about: e.target.value })}
            />
          </div>
        ))}
      </div>
    </Section>
  )
}
