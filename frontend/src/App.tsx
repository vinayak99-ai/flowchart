import { useRef, useState } from 'react'
import { TopNav } from './components/TopNav'
import { Sidebar } from './components/Sidebar'
import { FlowchartCanvas, type FlowchartCanvasHandle } from './components/FlowchartCanvas'
import { ExportControls } from './components/ExportControls'
import type { LayoutAlgorithm } from './lib/elkLayout'
import type { GenerateResponse } from './types'

const LAYOUT_OPTIONS: { value: LayoutAlgorithm; label: string }[] = [
  { value: 'layered', label: 'Flowchart' },
  { value: 'rectpacking', label: 'Compact (16:9)' },
]

function App() {
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<LayoutAlgorithm>('layered')
  const canvasRef = useRef<FlowchartCanvasHandle>(null)

  return (
    <div className="flex h-screen flex-col">
      <TopNav />
      <div className="flex min-h-0 flex-1">
        <Sidebar onResult={setResult} issues={result?.issues ?? []} />
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-fidelity-gray-200 bg-white px-4 py-2">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-fidelity-gray-900">Diagram</h1>
              <div className="flex gap-1 rounded-lg bg-fidelity-gray-100 p-1 text-xs font-medium">
                {LAYOUT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLayoutAlgorithm(option.value)}
                    className={`rounded-md px-2.5 py-1 transition-colors ${
                      layoutAlgorithm === option.value
                        ? 'bg-white text-fidelity-green shadow-sm'
                        : 'text-fidelity-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <ExportControls targetRef={canvasRef} disabled={!result} layoutAlgorithm={layoutAlgorithm} />
          </div>
          <div className="min-h-0 flex-1">
            <FlowchartCanvas ref={canvasRef} diagram={result?.diagram ?? null} layoutAlgorithm={layoutAlgorithm} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
