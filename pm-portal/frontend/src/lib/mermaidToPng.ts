import mermaid from "mermaid"
import { ensureMermaidInitialized } from "@/lib/mermaidSetup"

/**
 * Renders Mermaid source to a PNG and returns it as base64 (no
 * "data:image/png;base64," prefix) -- used so the .docx export can embed an
 * actual image instead of raw Mermaid text, since python-docx has no
 * Mermaid renderer of its own.
 */
export async function renderMermaidToPngBase64(code: string, scale = 2): Promise<string> {
  ensureMermaidInitialized()
  const id = `mermaid-png-${Math.random().toString(36).slice(2)}`
  const { svg } = await mermaid.render(id, code)

  const parser = new DOMParser()
  const svgDoc = parser.parseFromString(svg, "image/svg+xml")
  const svgEl = svgDoc.documentElement

  // Mermaid's SVG typically has width="100%" (for responsive embedding) with
  // the real intrinsic size in viewBox -- parseFloat("100%") silently
  // returns 100, which would badly distort the aspect ratio, so viewBox
  // takes priority whenever it's present.
  let width: number | undefined
  let height: number | undefined
  const viewBox = svgEl.getAttribute("viewBox")
  if (viewBox) {
    const parts = viewBox.split(/\s+/).map(Number)
    width = parts[2]
    height = parts[3]
  }
  if (!width || !height) {
    width = width || parseFloat(svgEl.getAttribute("width") || "") || undefined
    height = height || parseFloat(svgEl.getAttribute("height") || "") || undefined
  }
  width = width || 800
  height = height || 600

  // Mermaid renders text as <switch><foreignObject>(HTML)</foreignObject>
  // <text>(SVG fallback)</text></switch>. Drawing an SVG containing
  // <foreignObject> onto a canvas "taints" it (a browser security
  // restriction), which blocks toDataURL() below. Mermaid already ships the
  // <text> fallback as a sibling for exactly this kind of renderer, so
  // stripping the foreignObject nodes avoids the taint and still leaves
  // readable text -- the one exception is LaTeX-rendered math (KaTeX),
  // which has no such fallback, but none of this app's generated diagrams
  // use math notation.
  svgDoc.querySelectorAll("foreignObject").forEach((node) => node.remove())

  // Some fallback <text> nodes (e.g. journey-diagram section headers) reuse
  // the same "section-type-N" class as their own background rect, so
  // mermaid's `fill:#ECECFF`-style palette rule colors the text the same as
  // its background -- invisible. This never shows on screen because `fill`
  // has no effect on the HTML <div> the foreignObject path normally uses.
  // Force a legible color on every fallback text node; mermaid's box
  // palette here is uniformly pale, so a dark fill reads fine against it.
  const overrideStyle = svgDoc.createElementNS("http://www.w3.org/2000/svg", "style")
  overrideStyle.textContent = "text { fill: #333 !important; }"
  svgEl.appendChild(overrideStyle)

  const serializedSvg = new XMLSerializer().serializeToString(svgDoc)

  const svgBlob = new Blob([serializedSvg], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(svgBlob)

  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Failed to load rendered diagram for PNG conversion"))
      img.src = url
    })

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas 2D context unavailable")

    // Mermaid SVGs are transparent by default -- fill white first so the
    // diagram doesn't render as a black rectangle against a dark Word theme.
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL("image/png")
    return dataUrl.slice(dataUrl.indexOf(",") + 1)
  } finally {
    URL.revokeObjectURL(url)
  }
}
