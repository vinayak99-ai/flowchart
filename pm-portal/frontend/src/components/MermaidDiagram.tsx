import { useEffect, useId, useRef, useState } from "react"
import mermaid from "mermaid"
import { ensureMermaidInitialized } from "@/lib/mermaidSetup"

interface MermaidDiagramProps {
  code: string
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const rawId = useId().replace(/:/g, "")
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ensureMermaidInitialized()
    let cancelled = false

    mermaid
      .render(`mermaid-${rawId}`, code)
      .then(({ svg }) => {
        if (cancelled || !containerRef.current) return
        containerRef.current.innerHTML = svg
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })

    return () => {
      cancelled = true
    }
  }, [code, rawId])

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Could not render this diagram ({error}). The raw source below is still valid to copy.
      </p>
    )
  }

  return <div ref={containerRef} className="overflow-x-auto [&_svg]:max-w-none" />
}
