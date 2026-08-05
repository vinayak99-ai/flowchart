import { useEffect, useState } from "react"
import type { GlossaryTerm } from "@/lib/types"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Section } from "@/components/Section"
import { BookMarked, Trash2, Plus } from "lucide-react"

interface GlossarySectionProps {
  projectId: string
}

function nextId(terms: GlossaryTerm[]): string {
  const max = terms.reduce((n, t) => {
    const m = t.id.match(/GT-(\d+)$/)
    return m ? Math.max(n, parseInt(m[1], 10)) : n
  }, 0)
  return `GT-${max + 1}`
}

export function GlossarySection({ projectId }: GlossarySectionProps) {
  const toast = useToast()
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getGlossary(projectId)
      .then(({ terms }) => setTerms(terms))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [projectId])

  function update(index: number, patch: Partial<GlossaryTerm>) {
    setTerms((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
    setDirty(true)
  }

  function add() {
    setTerms((prev) => [...prev, { id: nextId(prev), term: "", definition: "" }])
    setDirty(true)
  }

  function remove(index: number) {
    setTerms((prev) => prev.filter((_, i) => i !== index))
    setDirty(true)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await api.saveGlossary(projectId, terms)
      setTerms(res.terms)
      setDirty(false)
      toast({ title: "Glossary saved" })
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <Section
      id="glossary"
      title="Glossary"
      icon={BookMarked}
      count={terms.length}
      actions={
        <>
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <Plus className="size-4" /> Add term
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={saving || !dirty}>
            {saving ? "Saving…" : dirty ? "Save glossary" : "Saved"}
          </Button>
        </>
      }
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      {terms.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No glossary terms yet. Define terminology that's specific to this project — agents use it to stay
          consistent across architecture decisions, briefs, and stakeholder updates.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {terms.map((t, i) => (
          <div key={t.id} className="flex items-center gap-2">
            <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">{t.id}</span>
            <Input
              className="w-40 shrink-0"
              placeholder="Term"
              value={t.term}
              onChange={(e) => update(i, { term: e.target.value })}
            />
            <Input
              placeholder="Definition"
              value={t.definition}
              onChange={(e) => update(i, { definition: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              aria-label="Remove glossary term"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </Section>
  )
}
