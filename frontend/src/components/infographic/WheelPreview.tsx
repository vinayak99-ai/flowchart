import type { InfographicWheel, WheelItem } from '../../infographicTypes'
import { EditableText } from './EditableText'

const WEDGE_COLORS = ['#e8a33d', '#6b9b52', '#3d5a80', '#c9457a', '#2a9d8f']
const LIST_ACCENT_COLORS = ['#c98626', '#537b3d', '#2c4160', '#a3305f', '#1e7c70']

// Same geometry verified against the actual .pptx export: 5 wedges of 36
// degrees each, spanning -90 to +90 around a hub at (180, 300).
const WEDGE_PATHS = [
  'M 180.0 228.0 L 180.0 68.0 A 232 232 0 0 1 316.4 112.3 L 222.3 241.8 A 72 72 0 0 0 180.0 228.0 Z',
  'M 222.3 241.8 L 316.4 112.3 A 232 232 0 0 1 400.6 228.3 L 248.5 277.8 A 72 72 0 0 0 222.3 241.8 Z',
  'M 248.5 277.8 L 400.6 228.3 A 232 232 0 0 1 400.6 371.7 L 248.5 322.2 A 72 72 0 0 0 248.5 277.8 Z',
  'M 248.5 322.2 L 400.6 371.7 A 232 232 0 0 1 316.4 487.7 L 222.3 358.2 A 72 72 0 0 0 248.5 322.2 Z',
  'M 222.3 358.2 L 316.4 487.7 A 232 232 0 0 1 180.0 532.0 L 180.0 372.0 A 72 72 0 0 0 222.3 358.2 Z',
]
const LABEL_POINTS: [number, number][] = [
  [223.9, 164.9],
  [294.9, 216.5],
  [322.0, 300.0],
  [294.9, 383.5],
  [223.9, 435.1],
]

interface WheelPreviewProps {
  wheel: InfographicWheel
  onChange: (wheel: InfographicWheel) => void
}

// The preview always shows 5 slots (padding blanks for display), but edits
// to a still-blank slot need to actually extend the real array rather than
// silently no-op against an index that doesn't exist yet.
function withPaddedItems(source: WheelItem[], minLength: number): WheelItem[] {
  const copy = source.slice()
  while (copy.length < minLength) copy.push({ label: '', description: '' })
  return copy
}

export function WheelPreview({ wheel, onChange }: WheelPreviewProps) {
  const items = withPaddedItems(wheel.items, 5).slice(0, 5)

  const updateTitle = (title: string) => onChange({ ...wheel, title })
  const updateLabel = (i: number, label: string) => {
    const next = withPaddedItems(wheel.items, i + 1)
    next[i] = { ...next[i], label }
    onChange({ ...wheel, items: next })
  }
  const updateDescription = (i: number, description: string) => {
    const next = withPaddedItems(wheel.items, i + 1)
    next[i] = { ...next[i], description }
    onChange({ ...wheel, items: next })
  }

  return (
    <svg viewBox="0 0 620 600" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <circle cx="180" cy="300" r="86" fill="white" stroke="#bfe3d3" strokeWidth="4" />
      <foreignObject x="104" y="266" width="152" height="68">
        <EditableText
          value={wheel.title}
          onCommit={updateTitle}
          as="div"
          className="flex h-full w-full items-center justify-center break-words text-center text-[19px] font-extrabold uppercase leading-tight text-[#1b1f1c]"
        />
      </foreignObject>

      {WEDGE_PATHS.map((d, i) => (
        <path key={i} d={d} fill={WEDGE_COLORS[i]} />
      ))}

      {/* Wedge labels: foreignObject + editable div rather than raw SVG
          <text>, since contentEditable on SVG text elements isn't reliably
          supported cross-browser -- the same fix already applied to the
          hub title above. */}
      {items.map((item, i) => (
        <foreignObject
          key={i}
          x={LABEL_POINTS[i][0] - 45}
          y={LABEL_POINTS[i][1] - 15}
          width={90}
          height={30}
        >
          <EditableText
            value={item.label}
            onCommit={(label) => updateLabel(i, label)}
            as="div"
            className="flex h-full w-full items-center justify-center text-center text-[13.5px] font-extrabold uppercase leading-tight text-white"
          />
        </foreignObject>
      ))}

      <g fontFamily="inherit">
        {items.map((item, i) => (
          <g key={i} transform={`translate(432,${58 + i * 104})`}>
            <rect width="150" height="88" rx="8" fill={WEDGE_COLORS[i]} />
            <rect x="150" width="6" height="88" fill={LIST_ACCENT_COLORS[i]} />
            <text x="18" y="52" fontSize="26" fontWeight="900" fill="#fff">
              {String(i + 1).padStart(2, '0')}
            </text>
            <foreignObject x="60" y="8" width="88" height="24">
              <EditableText
                value={item.label}
                onCommit={(label) => updateLabel(i, label)}
                as="div"
                className="flex h-full items-center text-[13.5px] font-extrabold uppercase leading-tight text-white"
              />
            </foreignObject>
            <foreignObject x="60" y="31" width="88" height="54">
              <EditableText
                value={item.description}
                onCommit={(description) => updateDescription(i, description)}
                as="div"
                className="text-[10px] leading-[1.25] text-[#fff7ec] opacity-90"
              />
            </foreignObject>
          </g>
        ))}
      </g>
    </svg>
  )
}
