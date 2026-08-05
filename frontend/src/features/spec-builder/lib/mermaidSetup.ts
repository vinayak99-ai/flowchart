import mermaid from "mermaid"

let initialized = false

export function ensureMermaidInitialized() {
  if (initialized) return
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict" })
  initialized = true
}
