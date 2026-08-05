import { useState, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SectionProps {
  id: string
  title: string
  icon: LucideIcon
  count?: number
  defaultOpen?: boolean
  actions?: ReactNode
  children: ReactNode
}

export function Section({ id, title, icon: Icon, count, defaultOpen = true, actions, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section id={id} className="scroll-mt-20 rounded-xl border bg-card">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <h2 className="truncate text-sm font-semibold">{title}</h2>
          {count !== undefined && (
            <Badge variant="secondary" className="shrink-0">
              {count}
            </Badge>
          )}
        </button>
        {actions && (
          <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse section" : "Expand section"}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronDown className={cn("size-4 transition-transform", !open && "-rotate-90")} />
        </button>
      </div>
      {open && <div className="flex flex-col gap-4 border-t px-4 py-4">{children}</div>}
    </section>
  )
}
