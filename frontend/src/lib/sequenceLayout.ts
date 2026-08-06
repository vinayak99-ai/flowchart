import type { SequenceDiagram, SequenceMessage } from '../sequenceTypes'

export const HEADER_HEIGHT = 76
export const ROW_HEIGHT = 56
export const ACTIVATION_WIDTH = 12
// Self-message loops (source === target) get two handles straddling the
// row's center instead of one point, so the loop has visible height.
export const SELF_LOOP_HALF_HEIGHT = 14
const TOP_PADDING = 24
const BOTTOM_PADDING = 40
const MIN_COLUMN_WIDTH = 160
const MAX_LABEL_WIDTH = 220
const H_PADDING = 40
const FONT = '600 12px Inter, ui-sans-serif, system-ui, sans-serif'

let measureCtx: CanvasRenderingContext2D | null = null
function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  if (!measureCtx) {
    const canvas = document.createElement('canvas')
    measureCtx = canvas.getContext('2d')
    if (measureCtx) measureCtx.font = FONT
  }
  return measureCtx
}

function measureLabelWidth(label: string): number {
  const ctx = getMeasureContext()
  const textWidth = ctx ? ctx.measureText(label).width : label.length * 6.5
  return Math.min(Math.max(textWidth + H_PADDING, MIN_COLUMN_WIDTH), MAX_LABEL_WIDTH)
}

export interface HandlePoint {
  id: string
  y: number
}

export interface LaidOutParticipant {
  id: string
  label: string
  x: number
  headerWidth: number
  sourceHandles: HandlePoint[]
  targetHandles: HandlePoint[]
}

export interface ActivationBar {
  id: string
  participantId: string
  x: number
  startY: number
  endY: number
}

export interface LaidOutMessage extends SequenceMessage {
  row: number
  stepNumber: number
  isSelf: boolean
  sourceX: number
  targetX: number
  y: number
  sourceHandleId: string
  targetHandleId: string
}

export interface SequenceLayoutResult {
  participants: LaidOutParticipant[]
  messages: LaidOutMessage[]
  activationBars: ActivationBar[]
  width: number
  height: number
}

/**
 * No layout algorithm here -- unlike the flowchart (a real graph-layout
 * problem needing crossing-minimization etc., handed to ELK), a sequence
 * diagram's arrangement is deterministic: participant order fixes the
 * columns, message order fixes the rows. Straight arithmetic.
 */
export function layoutSequenceDiagram(diagram: SequenceDiagram): SequenceLayoutResult {
  const columnWidth = diagram.participants.reduce(
    (widest, p) => Math.max(widest, measureLabelWidth(p.label) + 40),
    MIN_COLUMN_WIDTH,
  )

  const sourceHandlesById = new Map<string, HandlePoint[]>()
  const targetHandlesById = new Map<string, HandlePoint[]>()
  const participants: LaidOutParticipant[] = diagram.participants.map((p, index) => {
    const sourceHandles: HandlePoint[] = []
    const targetHandles: HandlePoint[] = []
    sourceHandlesById.set(p.id, sourceHandles)
    targetHandlesById.set(p.id, targetHandles)
    return {
      id: p.id,
      label: p.label,
      x: index * columnWidth + columnWidth / 2,
      headerWidth: measureLabelWidth(p.label),
      sourceHandles,
      targetHandles,
    }
  })
  const xById = new Map(participants.map((p) => [p.id, p.x]))
  const rowY = (row: number) => HEADER_HEIGHT + TOP_PADDING + row * ROW_HEIGHT + ROW_HEIGHT / 2

  const messages: LaidOutMessage[] = diagram.messages.map((m, row) => {
    const isSelf = m.source === m.target
    const y = rowY(row)
    const sourceHandleId = isSelf ? `row-${row}-out` : `row-${row}`
    const targetHandleId = isSelf ? `row-${row}-in` : `row-${row}`

    if (isSelf) {
      sourceHandlesById.get(m.source)?.push({ id: sourceHandleId, y: y - SELF_LOOP_HALF_HEIGHT })
      targetHandlesById.get(m.target)?.push({ id: targetHandleId, y: y + SELF_LOOP_HALF_HEIGHT })
    } else {
      sourceHandlesById.get(m.source)?.push({ id: sourceHandleId, y })
      targetHandlesById.get(m.target)?.push({ id: targetHandleId, y })
    }

    return {
      ...m,
      row,
      stepNumber: row + 1,
      isSelf,
      sourceX: xById.get(m.source) ?? 0,
      targetX: xById.get(m.target) ?? 0,
      y,
      sourceHandleId,
      targetHandleId,
    }
  })

  // Infer activation bars from the sync/return pattern instead of asking
  // the LLM to track nested activation state itself -- exactly the kind of
  // bookkeeping that degrades badly across a long generated message list.
  // A "sync" message opens an activation on its target; the next "return"
  // from that same participant closes the most recently opened one.
  const activationBars: ActivationBar[] = []
  const openStacks = new Map<string, { startRow: number }[]>()
  for (const message of messages) {
    if (message.isSelf) continue
    if (message.type === 'sync') {
      const stack = openStacks.get(message.target) ?? []
      stack.push({ startRow: message.row })
      openStacks.set(message.target, stack)
    } else {
      const stack = openStacks.get(message.source)
      const opened = stack?.pop()
      if (opened) {
        activationBars.push({
          id: `${message.source}-${opened.startRow}-${message.row}`,
          participantId: message.source,
          x: xById.get(message.source) ?? 0,
          startY: rowY(opened.startRow),
          endY: rowY(message.row),
        })
      }
    }
  }
  // Anything still open at the end (an unmatched call, or the material
  // just never described an explicit reply) stays visible through the last
  // row rather than silently vanishing.
  const lastRow = messages.length > 0 ? messages[messages.length - 1].row : 0
  for (const [participantId, stack] of openStacks) {
    for (const opened of stack) {
      activationBars.push({
        id: `${participantId}-${opened.startRow}-open`,
        participantId,
        x: xById.get(participantId) ?? 0,
        startY: rowY(opened.startRow),
        endY: rowY(lastRow),
      })
    }
  }

  const width = Math.max(columnWidth, participants.length * columnWidth)
  const height = HEADER_HEIGHT + TOP_PADDING + messages.length * ROW_HEIGHT + BOTTOM_PADDING

  return { participants, messages, activationBars, width, height }
}
