import type { ExtractResponse, GenerateResponse, WsProgressMessage } from '../types'
import type { SequenceWsProgressMessage } from '../sequenceTypes'
import type { InfographicDiagram, InfographicWsProgressMessage } from '../infographicTypes'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const WS_BASE = API_BASE.replace(/^http/, 'ws')

export async function extractFile(file: File): Promise<ExtractResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/api/extract`, { method: 'POST', body: formData })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return res.json()
}

export async function generateDiagram(material: string, prompt: string): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ material, prompt }),
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return res.json()
}

export function openGenerateSocket(
  material: string,
  prompt: string,
  onMessage: (message: WsProgressMessage) => void,
  onError: () => void,
): () => void {
  const socket = new WebSocket(`${WS_BASE}/api/ws/generate`)

  socket.onopen = () => {
    socket.send(JSON.stringify({ material, prompt }))
  }
  socket.onmessage = (event) => {
    onMessage(JSON.parse(event.data) as WsProgressMessage)
  }
  socket.onerror = () => {
    onError()
  }

  return () => socket.close()
}

export function openSequenceGenerateSocket(
  material: string,
  prompt: string,
  onMessage: (message: SequenceWsProgressMessage) => void,
  onError: () => void,
): () => void {
  const socket = new WebSocket(`${WS_BASE}/api/ws/generate-sequence`)

  socket.onopen = () => {
    socket.send(JSON.stringify({ material, prompt }))
  }
  socket.onmessage = (event) => {
    onMessage(JSON.parse(event.data) as SequenceWsProgressMessage)
  }
  socket.onerror = () => {
    onError()
  }

  return () => socket.close()
}

export function openInfographicGenerateSocket(
  material: string,
  prompt: string,
  onMessage: (message: InfographicWsProgressMessage) => void,
  onError: () => void,
): () => void {
  const socket = new WebSocket(`${WS_BASE}/api/ws/generate-infographic`)

  socket.onopen = () => {
    socket.send(JSON.stringify({ material, prompt }))
  }
  socket.onmessage = (event) => {
    onMessage(JSON.parse(event.data) as InfographicWsProgressMessage)
  }
  socket.onerror = () => {
    onError()
  }

  return () => socket.close()
}

// The deliverable here is the actual .pptx file (the template, populated
// server-side by python-pptx) -- not something rendered client-side, so
// this fetches the binary and triggers a real download rather than parsing
// a JSON diagram the way the other tools' export paths do. Which template
// builder runs server-side is dispatched from the `template` discriminator
// already present on the diagram.
export async function exportInfographicPptx(diagram: InfographicDiagram): Promise<void> {
  const res = await fetch(`${API_BASE}/api/infographic/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(diagram),
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download =
    diagram.template === 'radial_wheel' ? 'infographic-wheel.pptx' : 'infographic-comparison.pptx'
  link.click()
  URL.revokeObjectURL(url)
}
