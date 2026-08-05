import { useEffect, useRef, useState } from 'react'
import { Rail } from './components/Rail'
import { TopBar } from './components/TopBar'
import { ComingSoonPanel } from './components/ComingSoonPanel'
import { SpecBuilderPanel } from './components/SpecBuilderPanel'
import { Sidebar } from './components/Sidebar'
import { FlowchartCanvas, type FlowchartCanvasHandle } from './components/FlowchartCanvas'
import { ExportControls } from './components/ExportControls'
import { SettingsPanel } from './components/SettingsPanel'
import type { LayoutAlgorithm, LayoutDirection } from './lib/elkLayout'
import type { EdgeShape } from './lib/theme'
import { applyTheme, type ThemeName } from './lib/themes'
import { TOOLS, type ToolId } from './lib/tools'
import type { GenerateResponse } from './types'

function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('flowchart')
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<LayoutAlgorithm>('layered')
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('DOWN')
  const [edgeShape, setEdgeShape] = useState<EdgeShape>('bezier')
  const [themeName, setThemeName] = useState<ThemeName>('fidelity-green')
  const [snapToGrid, setSnapToGrid] = useState(false)
  const canvasRef = useRef<FlowchartCanvasHandle>(null)
  const flowchartRootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scoped to this tool's own subtree (not document.documentElement) so
    // picking a diagram theme here can't bleed into Studio's shell (Rail,
    // TopBar) or into other tools like Spec Builder, which share the same
    // --color-primary/--color-accent token names for their own branding.
    if (flowchartRootRef.current) {
      applyTheme(themeName, flowchartRootRef.current)
    }
  }, [themeName])

  const comingSoonTool = TOOLS.find((tool) => tool.id === activeTool && tool.status === 'soon')

  return (
    <div className="flex h-screen">
      <Rail activeTool={activeTool} onSelect={setActiveTool} />
      <div className="flex min-h-0 flex-1 flex-col">
        <TopBar activeTool={activeTool} />

        {/* Always mounted (just hidden) so React Flow keeps its layout/drag state
            when the user switches to another tool and back. */}
        <div
          ref={flowchartRootRef}
          className={`min-h-0 flex-1 ${activeTool === 'flowchart' ? 'flex' : 'hidden'}`}
        >
          <Sidebar onResult={setResult} issues={result?.issues ?? []} />
          <main className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
              <h1 className="text-sm font-semibold text-neutral-900">Diagram</h1>
              <div className="flex items-center gap-2">
                <ExportControls
                  targetRef={canvasRef}
                  disabled={!result}
                  layoutAlgorithm={layoutAlgorithm}
                  themeName={themeName}
                />
                <SettingsPanel
                  layoutAlgorithm={layoutAlgorithm}
                  onLayoutAlgorithmChange={setLayoutAlgorithm}
                  layoutDirection={layoutDirection}
                  onLayoutDirectionChange={setLayoutDirection}
                  edgeShape={edgeShape}
                  onEdgeShapeChange={setEdgeShape}
                  themeName={themeName}
                  onThemeNameChange={setThemeName}
                  snapToGrid={snapToGrid}
                  onSnapToGridChange={setSnapToGrid}
                />
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <FlowchartCanvas
                ref={canvasRef}
                diagram={result?.diagram ?? null}
                layoutAlgorithm={layoutAlgorithm}
                layoutDirection={layoutDirection}
                edgeShape={edgeShape}
                themeName={themeName}
                snapToGrid={snapToGrid}
              />
            </div>
          </main>
        </div>

        {/* Also always mounted+hidden, so switching tools doesn't reload the
            embedded app and lose in-progress (not-yet-autosaved) edits. */}
        <div className={`min-h-0 flex-1 ${activeTool === 'spec' ? 'flex' : 'hidden'}`}>
          <SpecBuilderPanel />
        </div>

        {comingSoonTool ? <ComingSoonPanel tool={comingSoonTool} /> : null}
      </div>
    </div>
  )
}

export default App
