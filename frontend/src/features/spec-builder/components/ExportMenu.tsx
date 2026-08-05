import { useEffect, useRef, useState } from "react"
import { ChevronDown, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/features/spec-builder/lib/api"
import type { ExportFormat } from "@/features/spec-builder/lib/types"

const FORMATS: { format: ExportFormat; label: string }[] = [
  { format: "md", label: "Markdown (.md)" },
  { format: "docx", label: "Word (.docx)" },
  { format: "csv", label: "User stories (.csv)" },
  { format: "epics-csv", label: "Epics (.csv)" },
]

interface ExportMenuProps {
  projectId: string
  artifactId: string
}

export function ExportMenu({ projectId, artifactId }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>
        <Download className="size-3.5" /> Export <ChevronDown className="size-3.5" />
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
          {FORMATS.map(({ format, label }) => (
            <a
              key={format}
              href={api.exportUrl(projectId, artifactId, format)}
              onClick={() => setOpen(false)}
              className="block rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}
