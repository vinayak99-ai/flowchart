import { useEffect, useState } from "react"
import { Moon, Rows3, Rows4, Sun } from "lucide-react"
import { ProjectList } from "@/features/spec-builder/pages/ProjectList"
import { NewProject } from "@/features/spec-builder/pages/NewProject"
import { ClarifyQuestions } from "@/features/spec-builder/pages/ClarifyQuestions"
import { ProjectDetail } from "@/features/spec-builder/pages/ProjectDetail"
import { Button } from "@/components/ui/button"
import { ToastProvider } from "@/hooks/use-toast"
import { applyTheme, getInitialTheme, type Theme } from "@/features/spec-builder/lib/theme"
import type { ClarifyQuestion, GeneratedPRD, ProjectMeta } from "@/features/spec-builder/lib/types"

type View =
  | { name: "list" }
  | { name: "new" }
  | { name: "clarify"; projectId: string; projectName: string; questions: ClarifyQuestion[] }
  | { name: "detail"; projectId: string; projectName: string; artifactId?: string; prd?: GeneratedPRD }

type Density = "comfortable" | "compact"

export function SpecBuilderApp() {
  const [view, setView] = useState<View>({ name: "list" })
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme())
  const [density, setDensity] = useState<Density>(
    () => (localStorage.getItem("aipm-density") as Density) || "comfortable"
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle("compact", density === "compact")
    localStorage.setItem("aipm-density", density)
  }, [density])

  return (
    <ToastProvider>
      {/* No outer header/title here — this app is embedded as a Studio tool
          panel, and Studio's own Rail + breadcrumb already frame it. Only
          the density/theme controls are kept, since those are genuinely
          this tool's own settings, not app-level chrome. */}
      <div className="min-h-svh bg-background text-foreground">
        <div className="flex items-center justify-end gap-1 border-b px-4 py-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label={density === "compact" ? "Switch to comfortable density" : "Switch to compact density"}
            title={density === "compact" ? "Comfortable density" : "Compact density"}
            onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
          >
            {density === "compact" ? <Rows3 className="size-4" /> : <Rows4 className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>

        <main>
          {view.name === "list" && (
            <ProjectList
              onSelectProject={(project: ProjectMeta) =>
                setView({ name: "detail", projectId: project.id, projectName: project.name })
              }
              onNewProject={() => setView({ name: "new" })}
            />
          )}

          {view.name === "new" && (
            <NewProject
              onCancel={() => setView({ name: "list" })}
              onNeedsClarification={(projectId, projectName, questions) =>
                setView({ name: "clarify", projectId, projectName, questions })
              }
              onGenerated={(projectId, artifactId, prd) =>
                setView({ name: "detail", projectId, projectName: prd.title, artifactId, prd })
              }
            />
          )}

          {view.name === "clarify" && (
            <ClarifyQuestions
              projectId={view.projectId}
              projectName={view.projectName}
              questions={view.questions}
              onCancel={() => setView({ name: "list" })}
              onGenerated={(projectId, artifactId, prd) =>
                setView({ name: "detail", projectId, projectName: prd.title, artifactId, prd })
              }
            />
          )}

          {view.name === "detail" && (
            <ProjectDetail
              projectId={view.projectId}
              projectName={view.projectName}
              initialArtifactId={view.artifactId}
              initialPrd={view.prd}
              onBack={() => setView({ name: "list" })}
              onNeedsClarification={(projectId, projectName, questions) =>
                setView({ name: "clarify", projectId, projectName, questions })
              }
            />
          )}
        </main>
      </div>
    </ToastProvider>
  )
}
