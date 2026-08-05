import { useState } from "react"
import type { Diagram, DiagramType } from "@/lib/types"
import { api } from "@/lib/api"
import { renderMermaidToPngBase64 } from "@/lib/mermaidToPng"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MermaidDiagram } from "@/components/MermaidDiagram"
import { Badge } from "@/components/ui/badge"
import { Section } from "@/components/Section"
import { GitBranch, Trash2, Copy, Check } from "lucide-react"

interface DiagramsSectionProps {
  projectId: string
  artifactId: string
  diagrams: Diagram[]
  onChange: (diagrams: Diagram[]) => void
}

const DIAGRAM_LABELS: Record<DiagramType, string> = {
  journey: "user journey",
  sequence: "sequence diagram",
}

export function DiagramsSection({ projectId, artifactId, diagrams, onChange }: DiagramsSectionProps) {
  const [generating, setGenerating] = useState<DiagramType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedType, setCopiedType] = useState<DiagramType | null>(null)

  async function handleGenerate(diagramType: DiagramType) {
    setGenerating(diagramType)
    setError(null)
    try {
      const updated = await api.generateDiagram(projectId, artifactId, diagramType)
      let diagrams = updated.diagrams

      const diagram = diagrams.find((d) => d.diagram_type === diagramType)
      if (diagram) {
        try {
          const png = await renderMermaidToPngBase64(diagram.mermaid_source)
          await api.setDiagramPng(projectId, artifactId, diagramType, png)
          diagrams = diagrams.map((d) => (d.diagram_type === diagramType ? { ...d, png_base64: png } : d))
        } catch {
          // PNG generation/upload failed -- the diagram itself is still saved
          // and usable; the .docx export just falls back to raw Mermaid text
          // for this one.
        }
      }

      onChange(diagrams)
    } catch (err) {
      setError(`${err}`)
    } finally {
      setGenerating(null)
    }
  }

  function handleRemove(diagramType: DiagramType) {
    onChange(diagrams.filter((d) => d.diagram_type !== diagramType))
  }

  async function handleCopy(diagram: Diagram) {
    try {
      await navigator.clipboard.writeText(diagram.mermaid_source)
      setCopiedType(diagram.diagram_type)
      setTimeout(() => setCopiedType(null), 1600)
    } catch {
      // Clipboard unavailable -- the source is still visible in the rendered card.
    }
  }

  const existingTypes = new Set(diagrams.map((d) => d.diagram_type))

  return (
    <Section
      id="diagrams"
      title="Diagrams"
      icon={GitBranch}
      count={diagrams.length}
      actions={
        <div className="flex gap-2">
          {(Object.keys(DIAGRAM_LABELS) as DiagramType[]).map((type) => (
            <Button
              key={type}
              type="button"
              variant="outline"
              size="sm"
              disabled={generating !== null}
              onClick={() => handleGenerate(type)}
            >
              {generating === type
                ? "Generating…"
                : existingTypes.has(type)
                  ? `Regenerate ${DIAGRAM_LABELS[type]}`
                  : `Generate ${DIAGRAM_LABELS[type]}`}
            </Button>
          ))}
        </div>
      }
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      {diagrams.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No diagrams yet. Generate a user journey or sequence diagram straight from this spec.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {diagrams.map((diagram) => (
          <Card key={diagram.diagram_type}>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{diagram.title}</CardTitle>
                {diagram.png_base64 && <Badge variant="secondary">image embeds in .docx</Badge>}
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(diagram)}
                  aria-label="Copy Mermaid source"
                >
                  {copiedType === diagram.diagram_type ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(diagram.diagram_type)}
                  aria-label="Remove diagram"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <MermaidDiagram code={diagram.mermaid_source} />
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}
