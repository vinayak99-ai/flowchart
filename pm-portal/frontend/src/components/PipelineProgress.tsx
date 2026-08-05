import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const STAGES = [
  { key: "extracting", label: "Extracting" },
  { key: "clarifying", label: "Clarifying" },
  { key: "drafting", label: "Drafting spec" },
  { key: "architecture", label: "Architecture" },
  { key: "epics", label: "Epics" },
] as const

interface PipelineProgressProps {
  projectId: string | null
  active: boolean
}

export function PipelineProgress({ projectId, active }: PipelineProgressProps) {
  const [stage, setStage] = useState<string | null>(null)

  useEffect(() => {
    if (!active || !projectId) {
      setStage(null)
      return
    }
    let cancelled = false
    async function tick() {
      try {
        const res = await api.getGenerationStatus(projectId!)
        // A null stage mid-flight just means "between stages"/finished --
        // keep showing the last known stage rather than flickering back.
        if (!cancelled && res.stage) setStage(res.stage)
      } catch {
        // Polling is best-effort; the main request carries the real errors.
      }
    }
    tick()
    const id = setInterval(tick, 400)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [active, projectId])

  if (!active) return null

  const currentIndex = STAGES.findIndex((s) => s.key === stage)

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Generation progress">
      {STAGES.map((s, i) => {
        const state = currentIndex === -1 ? "pending" : i < currentIndex ? "done" : i === currentIndex ? "active" : "pending"
        return (
          <span key={s.key} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/50">→</span>}
            <span
              data-stage={s.key}
              data-state={state}
              className={cn(
                "flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                state === "done" && "border-transparent bg-secondary text-secondary-foreground",
                state === "active" && "animate-pulse border-primary font-medium text-primary",
                state === "pending" && "text-muted-foreground"
              )}
            >
              {state === "done" && <Check className="size-3" />}
              {s.label}
            </span>
          </span>
        )
      })}
    </div>
  )
}
