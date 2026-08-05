import { useEffect, useRef, useState } from 'react'
import { TopNav } from './components/TopNav'
import { Sidebar } from './components/Sidebar'
import { FlowchartCanvas, type FlowchartCanvasHandle } from './components/FlowchartCanvas'
import { ExportControls } from './components/ExportControls'
import { SettingsPanel } from './components/SettingsPanel'
import type { LayoutAlgorithm, LayoutDirection } from './lib/elkLayout'
import type { EdgeShape } from './lib/theme'
import { applyTheme, type ThemeName } from './lib/themes'
import type { GenerateResponse } from './types'

function App() {
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<LayoutAlgorithm>('layered')
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('DOWN')
  const [edgeShape, setEdgeShape] = useState<EdgeShape>('bezier')
  const [themeName, setThemeName] = useState<ThemeName>('fidelity-green')
  const [snapToGrid, setSnapToGrid] = useState(false)
  const canvasRef = useRef<FlowchartCanvasHandle>(null)

  useEffect(() => {
    applyTheme(themeName)
  }, [themeName])

  return (
    <div className="flex h-screen flex-col">
      <TopNav />
      <div className="flex min-h-0 flex-1">
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
    </div>
  )
}

export default App
