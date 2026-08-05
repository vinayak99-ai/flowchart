import { useCallback, useEffect, useState } from "react"
import type { ArtifactVersionMeta, ComposedUpdate, DiffEntry, UpdateAudience } from "@/lib/types"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Section } from "@/components/Section"
import { useToast } from "@/hooks/use-toast"
import { Copy, RefreshCw, Trash2 } from "lucide-react"

function updateToMarkdown(update: ComposedUpdate): string {
  const lines = [`# ${update.title}`, "", `*${update.summary}*`, ""]
  for (const section of update.sections) {
    lines.push(`## ${section.heading}`, "", section.body, "")
  }
  if (update.decisions_needed.length > 0) {
    lines.push("## Decisions needed", "", ...update.decisions_needed.map((d) => `- ${d}`), "")
  }
  return lines.join("\n")
}

interface UpdatesSectionProps {
  projectId: string
  artifactId: string
  updates: ComposedUpdate[]
  onChange: (updates: ComposedUpdate[]) => void
}

const AUDIENCES: UpdateAudience[] = ["all", "executive", "engineering", "sales"]

const selectClass =
  "border-input h-9 rounded-md border bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

const CHANGE_BADGE: Record<DiffEntry["change"], "default" | "destructive" | "secondary"> = {
  added: "default",
  removed: "destructive",
  modified: "secondary",
}

export function UpdatesSection({ projectId, artifactId, updates, onChange }: UpdatesSectionProps) {
  const toast = useToast()
  const [versions, setVersions] = useState<ArtifactVersionMeta[]>([])
  const [fromVersion, setFromVersion] = useState<number | null>(null)
  const [audience, setAudience] = useState<UpdateAudience>("all")
  const [diff, setDiff] = useState<DiffEntry[] | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [composing, setComposing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // True when the spec has substantively changed since the most recent
  // composed update (diff from its to_version is non-empty).
  const [latestUpdateStale, setLatestUpdateStale] = useState(false)

  const loadVersions = useCallback(() => {
    api
      .listVersions(projectId, artifactId)
      .then(({ versions }) => setVersions(versions))
      .catch(() => setVersions([]))
  }, [projectId, artifactId])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  // Default baseline: where the last update left off, else the first version.
  useEffect(() => {
    if (fromVersion !== null || versions.length === 0) return
    const lastUpdate = updates[updates.length - 1]
    setFromVersion(lastUpdate ? lastUpdate.to_version : versions[0].version)
  }, [versions, updates, fromVersion])

  // Staleness check for the most recent update. Uses the structured diff
  // (which excludes briefs/updates themselves), so composing another brief
  // doesn't count as "the spec changed".
  const lastUpdateToVersion = updates.length > 0 ? updates[updates.length - 1].to_version : null
  useEffect(() => {
    if (lastUpdateToVersion === null) {
      setLatestUpdateStale(false)
      return
    }
    let cancelled = false
    api
      .getDiff(projectId, artifactId, lastUpdateToVersion)
      .then((res) => {
        if (!cancelled) setLatestUpdateStale(res.entries.length > 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [projectId, artifactId, lastUpdateToVersion, versions])

  async function handlePreview() {
    if (fromVersion === null) return
    setPreviewing(true)
    setError(null)
    try {
      const res = await api.getDiff(projectId, artifactId, fromVersion)
      setDiff(res.entries)
    } catch (err) {
      setError(`${err}`)
    } finally {
      setPreviewing(false)
    }
  }

  async function handleCompose() {
    if (fromVersion === null) return
    setComposing(true)
    setError(null)
    try {
      const prd = await api.composeUpdate(projectId, artifactId, fromVersion, audience)
      onChange(prd.updates)
      setDiff(null)
      loadVersions()
      const latest = prd.updates[prd.updates.length - 1]
      if (latest) setFromVersion(latest.to_version)
    } catch (err) {
      setError(`${err}`)
    } finally {
      setComposing(false)
    }
  }

  function handleRemove(updateId: string) {
    onChange(updates.filter((u) => u.id !== updateId))
  }

  return (
    <Section id="updates" title="Stakeholder updates" icon={RefreshCw} count={updates.length}>
      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No version history yet — versions accumulate automatically as the spec is generated and edited.
        </p>
      ) : (
        <div className="flex flex-col gap-2 rounded-md border p-3">
          <p className="text-sm text-muted-foreground">
            Compose a "what changed" update. Pick the baseline to diff from — usually where the
            last update left off.
          </p>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Since</Label>
            <div className="max-h-48 divide-y overflow-y-auto rounded-md border" role="radiogroup" aria-label="Baseline version">
              {[...versions].reverse().map((v) => {
                const selected = fromVersion === v.version
                return (
                  <button
                    key={v.version}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setFromVersion(v.version)
                      setDiff(null)
                    }}
                    className={cn(
                      "flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                      selected ? "bg-accent font-medium" : "hover:bg-accent/50"
                    )}
                  >
                    <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">v{v.version}</span>
                    <span className="min-w-0 flex-1 truncate">{v.reason}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(v.saved_at).toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Audience</Label>
              <select
                className={selectClass}
                value={audience}
                onChange={(e) => setAudience(e.target.value as UpdateAudience)}
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <Button type="button" variant="outline" size="sm" disabled={previewing || fromVersion === null} onClick={handlePreview}>
              {previewing ? "Loading…" : "Preview changes"}
            </Button>
            <Button type="button" size="sm" disabled={composing || fromVersion === null} onClick={handleCompose}>
              {composing ? "Composing…" : "Compose update"}
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {diff !== null && (
            <div className="flex flex-col gap-1 border-t pt-2">
              {diff.length === 0 ? (
                <p className="text-sm text-muted-foreground">No substantive changes since v{fromVersion}.</p>
              ) : (
                diff.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Badge variant={CHANGE_BADGE[e.change]} className="mt-0.5 shrink-0">
                      {e.change}
                    </Badge>
                    <span>
                      <span className="text-muted-foreground">{e.section}:</span> {e.item}
                      {e.detail && <span className="text-muted-foreground"> — {e.detail}</span>}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {[...updates].reverse().map((update, reversedIndex) => (
          <Card key={update.id}>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">{update.title}</CardTitle>
                <Badge variant="secondary">{update.audience}</Badge>
                <Badge variant="outline">
                  v{update.from_version} → v{update.to_version}
                </Badge>
                {reversedIndex === 0 && latestUpdateStale && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    spec has changed since this update
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(update.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(updateToMarkdown(update))
                      .then(() => toast({ title: "Copied to clipboard", description: "Markdown — paste into Slack, email, or a doc." }))
                      .catch((e) => toast({ title: "Copy failed", description: String(e), variant: "destructive" }))
                  }}
                >
                  <Copy className="size-3.5" /> Copy
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={api.updateExportUrl(projectId, artifactId, update.id, "md")}>Export .md</a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={api.updateExportUrl(projectId, artifactId, update.id, "docx")}>Export .docx</a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(update.id)}
                  aria-label="Remove update"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm italic">{update.summary}</p>
              {update.sections.map((section, i) => (
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
              {update.decisions_needed.length > 0 && (
                <div className="flex flex-col gap-1 rounded-md border p-3">
                  <h3 className="font-semibold">Decisions needed</h3>
                  {update.decisions_needed.map((d, i) => (
                    <p key={i} className="pl-4 text-sm">• {d}</p>
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
