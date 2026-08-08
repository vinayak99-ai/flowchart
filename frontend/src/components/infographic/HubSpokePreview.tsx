import type { InfographicHubSpoke, HubSpokeItem } from '../../infographicTypes'
import { EditableText } from './EditableText'

const HUB_SPOKE_COLORS = ['#00754a', '#c9a227', '#14b0a0', '#8a5a0a', '#4a9020', '#5cc4a8']

const CX = 450
const CY = 250
const HUB_R = 85
const RING_R_IN = 95
const RING_R_OUT = 115
const RING_HALF_SPAN = 15
const CARD_W = 280
const CARD_H = 90
const ROW_GAP = 25
const SPOKE_GAP = 40
const CAP_W = 75

const RIGHT_X = CX + RING_R_OUT + SPOKE_GAP
const LEFT_X = CX - RING_R_OUT - SPOKE_GAP - CARD_W

const TOTAL_H = 3 * CARD_H + 2 * ROW_GAP
const TOP = CY - TOTAL_H / 2
const ROW_CY = [0, 1, 2].map((i) => TOP + i * (CARD_H + ROW_GAP) + CARD_H / 2)

// Mirrors the backend's freeform ring-segment polygon math exactly (straight
// segments approximating an arc) so the preview matches the exported PPTX --
// python-pptx has no native arc primitive either, so both sides use the same
// polygon approximation rather than one using SVG's native arc path command.
function ringSegmentPoints(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  a0: number,
  a1: number,
  steps = 10,
): string {
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (a1 - a0) * (i / steps)
    const rad = (a * Math.PI) / 180
    pts.push(`${cx + rOut * Math.cos(rad)},${cy + rOut * Math.sin(rad)}`)
  }
  for (let i = 0; i <= steps; i++) {
    const a = a1 - (a1 - a0) * (i / steps)
    const rad = (a * Math.PI) / 180
    pts.push(`${cx + rIn * Math.cos(rad)},${cy + rIn * Math.sin(rad)}`)
  }
  return pts.join(' ')
}

interface Slot {
  side: 'left' | 'right'
  cardX: number
  rowCy: number
}

const SLOTS: Slot[] = [
  ...[0, 1, 2].map((i) => ({ side: 'left' as const, cardX: LEFT_X, rowCy: ROW_CY[i] })),
  ...[0, 1, 2].map((i) => ({ side: 'right' as const, cardX: RIGHT_X, rowCy: ROW_CY[i] })),
]

interface HubSpokePreviewProps {
  hubSpoke: InfographicHubSpoke
  onChange: (hubSpoke: InfographicHubSpoke) => void
}

function withPaddedItems(source: HubSpokeItem[], minLength: number): HubSpokeItem[] {
  const copy = source.slice()
  while (copy.length < minLength) copy.push({ label: '', description: '' })
  return copy
}

export function HubSpokePreview({ hubSpoke, onChange }: HubSpokePreviewProps) {
  const items = withPaddedItems(hubSpoke.items, 6).slice(0, 6)

  const updateTitle = (title: string) => onChange({ ...hubSpoke, title })
  const updateDescription = (description: string) => onChange({ ...hubSpoke, description })
  const updateLabel = (i: number, label: string) => {
    const next = withPaddedItems(hubSpoke.items, i + 1)
    next[i] = { ...next[i], label }
    onChange({ ...hubSpoke, items: next })
  }
  const updateItemDescription = (i: number, description: string) => {
    const next = withPaddedItems(hubSpoke.items, i + 1)
    next[i] = { ...next[i], description }
    onChange({ ...hubSpoke, items: next })
  }

  return (
    <svg viewBox="0 0 900 500" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      {items.map((item, i) => {
        const slot = SLOTS[i]
        const color = HUB_SPOKE_COLORS[i % HUB_SPOKE_COLORS.length]
        const nearX = slot.side === 'left' ? slot.cardX + CARD_W : slot.cardX
        const nearY = slot.rowCy
        const angle = (Math.atan2(nearY - CY, nearX - CX) * 180) / Math.PI
        const ringPts = ringSegmentPoints(
          CX,
          CY,
          RING_R_IN,
          RING_R_OUT,
          angle - RING_HALF_SPAN,
          angle + RING_HALF_SPAN,
        )
        const ringRad = (angle * Math.PI) / 180
        const edgeX = CX + RING_R_OUT * Math.cos(ringRad)
        const edgeY = CY + RING_R_OUT * Math.sin(ringRad)
        const dotX = (edgeX + nearX) / 2
        const dotY = (edgeY + nearY) / 2

        return (
          <g key={i}>
            <polygon points={ringPts} fill={color} />
            <line
              x1={edgeX}
              y1={edgeY}
              x2={nearX}
              y2={nearY}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="5 4"
            />
            <circle cx={dotX} cy={dotY} r={4} fill={color} />

            <foreignObject x={slot.cardX} y={slot.rowCy - CARD_H / 2} width={CARD_W} height={CARD_H}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 9999,
                  overflow: 'hidden',
                  display: 'flex',
                  background: 'white',
                  border: '1px solid #e4e1d8',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                }}
              >
                {slot.side === 'left' ? (
                  <>
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '0 14px',
                        gap: 4,
                        minWidth: 0,
                      }}
                    >
                      <EditableText
                        value={item.label}
                        onCommit={(label) => updateLabel(i, label)}
                        as="div"
                        className="text-[13px] font-bold uppercase leading-tight text-neutral-900"
                      />
                      <EditableText
                        value={item.description}
                        onCommit={(description) => updateItemDescription(i, description)}
                        as="div"
                        multiline
                        className="text-[10px] leading-snug text-neutral-500"
                      />
                    </div>
                    <div
                      style={{
                        width: CAP_W,
                        flexShrink: 0,
                        backgroundColor: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: CAP_W,
                        flexShrink: 0,
                        backgroundColor: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '0 14px',
                        gap: 4,
                        minWidth: 0,
                      }}
                    >
                      <EditableText
                        value={item.label}
                        onCommit={(label) => updateLabel(i, label)}
                        as="div"
                        className="text-[13px] font-bold uppercase leading-tight text-neutral-900"
                      />
                      <EditableText
                        value={item.description}
                        onCommit={(description) => updateItemDescription(i, description)}
                        as="div"
                        multiline
                        className="text-[10px] leading-snug text-neutral-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </foreignObject>
          </g>
        )
      })}

      <circle cx={CX} cy={CY} r={HUB_R} fill="white" stroke="#e4e1d8" strokeWidth={2} />
      <foreignObject x={CX - HUB_R + 14} y={CY - HUB_R + 14} width={2 * HUB_R - 28} height={2 * HUB_R - 28}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 4,
          }}
        >
          <EditableText
            value={hubSpoke.title}
            onCommit={updateTitle}
            as="div"
            className="text-[15px] font-extrabold uppercase leading-tight text-neutral-900"
          />
          <EditableText
            value={hubSpoke.description}
            onCommit={updateDescription}
            as="div"
            multiline
            className="text-[9px] leading-snug text-neutral-500"
          />
        </div>
      </foreignObject>
    </svg>
  )
}
