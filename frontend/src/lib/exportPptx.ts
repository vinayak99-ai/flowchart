import pptxgen from 'pptxgenjs'
import { NODE_HEIGHT, NODE_WIDTH } from './elkLayout'
import type { EdgeType, NodeType } from '../types'
import type { DiagramFlowNode } from '../components/nodes/DiagramNodeComponent'
import type { DiagramFlowEdge } from '../components/edges/DiagramEdgeComponent'

const SLIDE_WIDTH_IN = 13.333
const SLIDE_HEIGHT_IN = 7.5
const MARGIN_IN = 0.6
const TITLE_HEIGHT_IN = 0.7

// PowerPoint's native "Flowchart" autoshapes — editable/resizable in PPT, unlike a
// picture of the canvas.
const shapeByNodeType: Record<NodeType, string> = {
  start: 'flowChartTerminator',
  end: 'flowChartTerminator',
  process: 'flowChartProcess',
  decision: 'flowChartDecision',
  io: 'flowChartInputOutput',
  subprocess: 'flowChartPredefinedProcess',
}

// Same hex values as src/lib/theme.ts, since pptxgenjs needs literal hex, not
// Tailwind classes.
const styleByNodeType: Record<NodeType, { fill: string; line: string; font: string; bold?: boolean }> = {
  start: { fill: '00754A', line: '005334', font: 'FFFFFF', bold: true },
  end: { fill: '1F2622', line: '1F2622', font: 'FFFFFF', bold: true },
  process: { fill: 'FFFFFF', line: 'DDE1DC', font: '1F2622' },
  decision: { fill: 'F8F1DD', line: 'C9A227', font: '1F2622' },
  io: { fill: 'E6F2EC', line: '00754A', font: '1F2622' },
  subprocess: { fill: 'FFFFFF', line: '5B6660', font: '1F2622' },
}

const styleByEdgeType: Record<EdgeType, { color: string; dash: 'solid' | 'dash' }> = {
  default: { color: '5B6660', dash: 'solid' },
  conditional: { color: 'C9A227', dash: 'dash' },
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

function pointTowards(box: Box, target: { x: number; y: number }): { x: number; y: number } {
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  const dx = target.x - cx
  const dy = target.y - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }

  const scaleX = dx !== 0 ? box.w / 2 / Math.abs(dx) : Infinity
  const scaleY = dy !== 0 ? box.h / 2 / Math.abs(dy) : Infinity
  const scale = Math.min(scaleX, scaleY)
  return { x: cx + dx * scale, y: cy + dy * scale }
}

export interface ExportPptxOptions {
  title?: string
  fileName?: string
}

export async function exportPptx(
  nodes: DiagramFlowNode[],
  edges: DiagramFlowEdge[],
  options: ExportPptxOptions = {},
): Promise<void> {
  if (nodes.length === 0) return

  const pptx = new pptxgen()
  pptx.defineLayout({ name: 'FLOWCHART_16x9', width: SLIDE_WIDTH_IN, height: SLIDE_HEIGHT_IN })
  pptx.layout = 'FLOWCHART_16x9'

  const slide = pptx.addSlide()
  slide.background = { color: 'F7F8F7' }

  slide.addText(options.title ?? 'Flowchart', {
    x: MARGIN_IN,
    y: 0.25,
    w: SLIDE_WIDTH_IN - MARGIN_IN * 2,
    h: TITLE_HEIGHT_IN - 0.15,
    fontFace: 'Calibri',
    fontSize: 22,
    bold: true,
    color: '1F2622',
  })
  slide.addShape('rect', {
    x: MARGIN_IN,
    y: 0.25 + TITLE_HEIGHT_IN - 0.1,
    w: SLIDE_WIDTH_IN - MARGIN_IN * 2,
    h: 0.03,
    fill: { color: '00754A' },
    line: { color: '00754A' },
  })

  const contentX = MARGIN_IN
  const contentY = MARGIN_IN + TITLE_HEIGHT_IN
  const contentW = SLIDE_WIDTH_IN - MARGIN_IN * 2
  const contentH = SLIDE_HEIGHT_IN - contentY - MARGIN_IN

  const minX = Math.min(...nodes.map((node) => node.position.x))
  const minY = Math.min(...nodes.map((node) => node.position.y))
  const maxX = Math.max(...nodes.map((node) => node.position.x + NODE_WIDTH))
  const maxY = Math.max(...nodes.map((node) => node.position.y + NODE_HEIGHT))
  const layoutW = Math.max(maxX - minX, 1)
  const layoutH = Math.max(maxY - minY, 1)

  const scale = Math.min(contentW / layoutW, contentH / layoutH)
  const offsetX = contentX + (contentW - layoutW * scale) / 2
  const offsetY = contentY + (contentH - layoutH * scale) / 2

  const boxes = new Map<string, Box>()
  for (const node of nodes) {
    boxes.set(node.id, {
      x: offsetX + (node.position.x - minX) * scale,
      y: offsetY + (node.position.y - minY) * scale,
      w: NODE_WIDTH * scale,
      h: NODE_HEIGHT * scale,
    })
  }

  // Edges first so node shapes sit visually on top of the lines.
  for (const edge of edges) {
    const sourceBox = boxes.get(edge.source)
    const targetBox = boxes.get(edge.target)
    if (!sourceBox || !targetBox) continue

    const sourceCenter = { x: sourceBox.x + sourceBox.w / 2, y: sourceBox.y + sourceBox.h / 2 }
    const targetCenter = { x: targetBox.x + targetBox.w / 2, y: targetBox.y + targetBox.h / 2 }
    const start = pointTowards(sourceBox, targetCenter)
    const end = pointTowards(targetBox, sourceCenter)

    const edgeType = (edge.data?.type ?? 'default') as EdgeType
    const style = styleByEdgeType[edgeType]

    slide.addShape('line', {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      w: Math.max(Math.abs(end.x - start.x), 0.001),
      h: Math.max(Math.abs(end.y - start.y), 0.001),
      flipH: end.x < start.x,
      flipV: end.y < start.y,
      line: {
        color: style.color,
        width: 1.25,
        dashType: style.dash,
        endArrowType: 'triangle',
      },
    })

    if (edge.label) {
      const midX = (start.x + end.x) / 2
      const midY = (start.y + end.y) / 2
      slide.addText(String(edge.label), {
        x: midX - 0.4,
        y: midY - 0.14,
        w: 0.8,
        h: 0.28,
        align: 'center',
        valign: 'middle',
        fontFace: 'Calibri',
        fontSize: 9,
        color: '1F2622',
        fill: { color: 'FFFFFF' },
        line: { color: 'DDE1DC', width: 0.5 },
      })
    }
  }

  for (const node of nodes) {
    const box = boxes.get(node.id)!
    const style = styleByNodeType[node.data.type]

    slide.addShape(shapeByNodeType[node.data.type] as 'rect', {
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      fill: { color: style.fill },
      line: { color: style.line, width: 1.25 },
    })
    slide.addText(node.data.label, {
      x: box.x + 0.05,
      y: box.y,
      w: Math.max(box.w - 0.1, 0.1),
      h: box.h,
      align: 'center',
      valign: 'middle',
      fontFace: 'Calibri',
      fontSize: 11,
      bold: style.bold,
      color: style.font,
      wrap: true,
      shrinkText: true,
    })
  }

  await pptx.writeFile({ fileName: options.fileName ?? 'flowchart.pptx' })
}
