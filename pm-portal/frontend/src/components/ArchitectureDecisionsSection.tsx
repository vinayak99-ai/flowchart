import { useRef, useState } from "react"
import type { AnsweredClarification, ArchitectureDecision } from "@/lib/types"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Section } from "@/components/Section"
import { EditableBlock } from "@/components/EditableBlock"
import { Blocks, Trash2 } from "lucide-react"

interface ArchitectureDecisionsSectionProps {
  projectId: string
  artifactId: string
  decisions: ArchitectureDecision[]
  technicalContext: AnsweredClarification[]
  onChange: (decisions: ArchitectureDecision[]) => void
}

export function ArchitectureDecisionsSection({
  projectId,
  artifactId,
  decisions,
  technicalContext,
  onChange,
}: ArchitectureDecisionsSectionProps) {
  const toast = useToast()
  const latest = useRef({ decisions, onChange })
  latest.current = { decisions, onChange }
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegenerate() {
    setGenerating(true)
    setError(null)
    try {
      const updated = await api.generateArchitectureDecisions(projectId, artifactId)
      onChange(updated.architecture_decisions)
    } catch (err) {
      setError(`${err}`)
    } finally {
      setGenerating(false)
    }
  }

  function updateDecision(index: number, patch: Partial<ArchitectureDecision>) {
    const next = [...decisions]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  function removeDecision(index: number) {
    const removed = decisions[index]
    onChange(decisions.filter((_, i) => i !== index))
    toast({
      title: `${removed.id} removed`,
      description: removed.title || undefined,
      action: {
        label: "Undo",
        onClick: () => {
          const { decisions: current, onChange: change } = latest.current
          const next = [...current]
          next.splice(Math.min(index, next.length), 0, removed)
          change(next)
        },
      },
    })
  }

  function toggleStatus(index: number) {
    const current = decisions[index].status
    updateDecision(index, { status: current === "proposed" ? "accepted" : "proposed" })
  }

  function statusBadge(index: number) {
    const adr = decisions[index]
    return (
      <Badge
        role="button"
        tabIndex={0}
        variant={adr.status === "accepted" ? "default" : "secondary"}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          toggleStatus(index)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation()
            toggleStatus(index)
          }
        }}
      >
        {adr.status}
      </Badge>
    )
  }

  return (
    <Section
      id="architecture"
      title="Architecture Decisions"
      icon={Blocks}
      count={decisions.length}
      actions={
        <Button type="button" variant="outline" size="sm" disabled={generating} onClick={handleRegenerate}>
          {generating ? "Generating…" : decisions.length > 0 ? "Regenerate" : "Generate"}
        </Button>
      }
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      {technicalContext.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-md border p-3">
          <p className="text-xs font-medium text-muted-foreground">Technical context considered</p>
          {technicalContext.map((h) => (
            <p key={h.question.id} className="text-sm">
              <span className="text-muted-foreground">{h.question.question}</span> {h.answer}
            </p>
          ))}
        </div>
      )}

      {decisions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No architecture decisions yet. These are drafted automatically when a spec is generated.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {decisions.map((adr, i) => (
          <Card key={adr.id}>
            <EditableBlock
              label={adr.title || adr.id}
              read={
                <div className="flex flex-col gap-2 px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{adr.id}</span>
                    {statusBadge(i)}
                    <h3 className="text-base font-semibold">{adr.title}</h3>
                  </div>
                  {adr.context && (
                    <p className="text-sm leading-relaxed">
                      <span className="font-medium text-muted-foreground">Context:</span> {adr.context}
                    </p>
                  )}
                  {adr.decision && (
                    <p className="text-sm leading-relaxed">
                      <span className="font-medium text-muted-foreground">Decision:</span> {adr.decision}
                    </p>
                  )}
                  {adr.consequences && (
                    <p className="text-sm leading-relaxed">
                      <span className="font-medium text-muted-foreground">Consequences:</span> {adr.consequences}
                    </p>
                  )}
                </div>
              }
            >
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{adr.id}</CardTitle>
                  {statusBadge(i)}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeDecision(i)} aria-label="Remove decision">
                  <Trash2 className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label>Title</Label>
                  <Input value={adr.title} onChange={(e) => updateDecision(i, { title: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Context</Label>
                  <Textarea
                    className="min-h-16"
                    value={adr.context}
                    onChange={(e) => updateDecision(i, { context: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Decision</Label>
                  <Textarea
                    className="min-h-16"
                    value={adr.decision}
                    onChange={(e) => updateDecision(i, { decision: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Consequences</Label>
                  <Textarea
                    className="min-h-16"
                    value={adr.consequences}
                    onChange={(e) => updateDecision(i, { consequences: e.target.value })}
                  />
                </div>
              </CardContent>
            </EditableBlock>
          </Card>
        ))}
      </div>
    </Section>
  )
}
