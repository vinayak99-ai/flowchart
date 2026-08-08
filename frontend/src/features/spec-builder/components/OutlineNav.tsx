import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface OutlineSection {
  id: string
  label: string
  icon: LucideIcon
  // Renders a small dot: something in this section needs a human's eyes
  // (proposed ADRs, unresolved enrichment notes, a stale update...).
  attention?: boolean
  attentionTitle?: string
}

interface OutlineNavProps {
  sections: OutlineSection[]
}

export function OutlineNav({ sections }: OutlineNavProps) {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null)

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b))
        setActiveId(top.target.id)
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sections])

  function handleClick(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav
      className="sticky top-20 hidden max-h-[calc(100svh-6rem)] w-56 shrink-0 flex-col gap-0.5 overflow-y-auto lg:flex"
      aria-label="Section outline"
    >
      {sections.map((s) => {
        const Icon = s.icon
        const active = s.id === activeId
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => handleClick(s.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              active
                ? "bg-primary-light font-medium text-primary-dark"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="truncate">{s.label}</span>
            {s.attention && (
              <span
                className="ml-auto size-1.5 shrink-0 rounded-full bg-amber-500"
                title={s.attentionTitle}
                aria-label={s.attentionTitle ?? "Needs attention"}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
