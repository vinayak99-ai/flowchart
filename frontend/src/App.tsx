import { useRef, useState } from 'react'
import { TopNav } from './components/TopNav'
import { Sidebar } from './components/Sidebar'
import { FlowchartCanvas } from './components/FlowchartCanvas'
import { ExportControls } from './components/ExportControls'
import type { GenerateResponse } from './types'

function App() {
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex h-screen flex-col">
      <TopNav />
      <div className="flex min-h-0 flex-1">
        <Sidebar onResult={setResult} issues={result?.issues ?? []} />
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-fidelity-gray-200 bg-white px-4 py-2">
            <h1 className="text-sm font-semibold text-fidelity-gray-900">Diagram</h1>
            <ExportControls targetRef={canvasRef} disabled={!result} />
          </div>
          <div className="min-h-0 flex-1">
            <FlowchartCanvas ref={canvasRef} diagram={result?.diagram ?? null} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
