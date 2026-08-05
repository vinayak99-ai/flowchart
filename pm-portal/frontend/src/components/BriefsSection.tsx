import { useEffect, useState } from "react"
import type { BriefAudience, StakeholderBrief } from "@/lib/types"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Section } from "@/components/Section"
import { Copy, FileText, Trash2 } from "lucide-react"

function briefToMarkdown(brief: StakeholderBrief): string {
  const lines = [`# ${brief.title}`, ""]
  for (const section of brief.sections) {
    lines.push(`## ${section.heading}`, "", section.body, "")
  }
  if (brief.key_asks.length > 0) {
    lines.push("## Asks", "", ...brief.key_asks.map((a) => `- ${a}`), "")
  }
  return lines.join("\n")
}

interface BriefsSectionProps {
  projectId: string
  artifactId: string
  briefs: StakeholderBrief[]
  onChange: (briefs: StakeholderBrief[]) => void
}

const BRIEF_LABELS: Record<BriefAudience, string> = {
  executive: "executive one-pager",
  engineering: "engineering brief",
  sales: "sales enablement",
}

export function BriefsSection({ projectId, artifactId, briefs, onChange }: BriefsSectionProps) {
  const toast = useToast()
  const [generating, setGenerating] = useState<BriefAudience | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Audiences whose brief the spec has substantively moved past (non-empty
  // structured diff since the brief's source_version).
  const [staleAudiences, setStaleAudiences] = useState<Set<BriefAudience>>(new Set())

  useEffect(() => {
    let cancelled = false
    const versioned = briefs.filter((b) => b.source_version !== null)
    if (versioned.length === 0) {
      setStaleAudiences(new Set())
      return
    }
    Promise.all(
      versioned.map((b) =>
        api
          .getDiff(projectId, artifactId, b.source_version!)
          .then((res) => (res.entries.length > 0 ? b.audience : null))
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return
      setStaleAudiences(new Set(results.filter((a): a is BriefAudience => a !== null)))
    })
    return () => {
      cancelled = true
    }
  }, [projectId, artifactId, briefs])

  async function handleGenerate(audience: BriefAudience) {
    setGenerating(audience)
    setError(null)
    try {
      const updated = await api.generateBrief(projectId, artifactId, audience)
      onChange(updated.briefs)
    } catch (err) {
      setError(`${err}`)
    } finally {
      setGenerating(null)
    }
  }

  function handleRemove(audience: BriefAudience) {
    onChange(briefs.filter((b) => b.audience !== audience))
  }

  const existing = new Set(briefs.map((b) => b.audience))

  return (
    <Section
      id="briefs"
      title="Stakeholder briefs"
      icon={FileText}
      count={briefs.length}
      actions={
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BRIEF_LABELS) as BriefAudience[]).map((audience) => (
            <Button
              key={audience}
              type="button"
              variant="outline"
              size="sm"
              disabled={generating !== null}
              onClick={() => handleGenerate(audience)}
            >
              {generating === audience
                ? "Generating…"
                : existing.has(audience)
                  ? `Regenerate ${BRIEF_LABELS[audience]}`
                  : `Generate ${BRIEF_LABELS[audience]}`}
            </Button>
          ))}
        </div>
      }
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      {briefs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No briefs yet. Generate an audience-specific projection of this spec — an executive one-pager,
          an engineering brief, or a sales enablement doc — drafted from the content above and tuned to
          the stakeholders you listed.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {briefs.map((brief) => (
          <Card key={brief.audience}>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{brief.title}</CardTitle>
                <Badge variant="secondary">{brief.audience}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(briefToMarkdown(brief))
                      .then(() => toast({ title: "Copied to clipboard", description: "Markdown — paste into Slack, email, or a doc." }))
                      .catch((e) => toast({ title: "Copy failed", description: String(e), variant: "destructive" }))
                  }}
                >
                  <Copy className="size-3.5" /> Copy
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={api.briefExportUrl(projectId, artifactId, brief.audience, "md")}>Export .md</a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={api.briefExportUrl(projectId, artifactId, brief.audience, "docx")}>Export .docx</a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(brief.audience)}
                  aria-label="Remove brief"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {staleAudiences.has(brief.audience) && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Based on v{brief.source_version} — the spec has changed since. Regenerate to refresh.
                </p>
              )}
              {brief.sections.map((section, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <h3 className="font-semibold">{section.heading}</h3>
                  {section.body.split("\n").map((line, j) => {
                    const trimmed = line.trim()
                    if (!trimmed) return null
                    return trimmed.startsWith("- ") ? (
                      <p key={j} className="pl-4 text-sm">• {trimmed.slice(2)}</p>
                    ) : (
                      <p key={j} className="text-sm">{trimmed}</p>
                    )
                  })}
                </div>
              ))}
              {brief.key_asks.length > 0 && (
                <div className="flex flex-col gap-1 rounded-md border p-3">
                  <h3 className="font-semibold">Asks</h3>
                  {brief.key_asks.map((ask, i) => (
                    <p key={i} className="pl-4 text-sm">• {ask}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}
