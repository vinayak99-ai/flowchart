import { useEffect, useRef, useState } from 'react'
import { DIRECTION_SUPPORTED, type LayoutAlgorithm, type LayoutDirection } from '../lib/elkLayout'
import { edgeShapeLabels, type EdgeShape } from '../lib/theme'
import { themeLabels, themePalettes, type ThemeName } from '../lib/themes'

const LAYOUT_ALGORITHMS: { value: LayoutAlgorithm; label: string }[] = [
  { value: 'layered', label: 'Flowchart' },
  { value: 'mrtree', label: 'Tree' },
  { value: 'rectpacking', label: 'Compact (16:9)' },
]

const LAYOUT_DIRECTIONS: { value: LayoutDirection; label: string }[] = [
  { value: 'DOWN', label: 'Top → down' },
  { value: 'RIGHT', label: 'Left → right' },
]

const EDGE_SHAPES = Object.keys(edgeShapeLabels) as EdgeShape[]
const THEME_NAMES = Object.keys(themeLabels) as ThemeName[]

interface SettingsPanelProps {
  layoutAlgorithm: LayoutAlgorithm
  onLayoutAlgorithmChange: (value: LayoutAlgorithm) => void
  layoutDirection: LayoutDirection
  onLayoutDirectionChange: (value: LayoutDirection) => void
  edgeShape: EdgeShape
  onEdgeShapeChange: (value: EdgeShape) => void
  themeName: ThemeName
  onThemeNameChange: (value: ThemeName) => void
  snapToGrid: boolean
  onSnapToGridChange: (value: boolean) => void
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-neutral-100 p-1 text-xs font-medium">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-2.5 py-1 transition-colors ${
            value === option.value ? 'bg-white text-primary shadow-sm' : 'text-neutral-600'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function SettingsPanel({
  layoutAlgorithm,
  onLayoutAlgorithmChange,
  layoutDirection,
  onLayoutDirectionChange,
  edgeShape,
  onEdgeShapeChange,
  themeName,
  onThemeNameChange,
  snapToGrid,
  onSnapToGridChange,
}: SettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Diagram settings"
        className={`flex h-8 w-8 items-center justify-center rounded-md border text-neutral-600 transition-colors hover:border-primary hover:text-primary ${
          open ? 'border-primary text-primary' : 'border-neutral-200 bg-white'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                Layout
              </p>
              <SegmentedControl
                options={LAYOUT_ALGORITHMS}
                value={layoutAlgorithm}
                onChange={onLayoutAlgorithmChange}
              />
            </div>

            {DIRECTION_SUPPORTED[layoutAlgorithm] ? (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                  Direction
                </p>
                <SegmentedControl
                  options={LAYOUT_DIRECTIONS}
                  value={layoutDirection}
                  onChange={onLayoutDirectionChange}
                />
              </div>
            ) : null}

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                Edge style
              </p>
              <SegmentedControl
                options={EDGE_SHAPES.map((value) => ({ value, label: edgeShapeLabels[value] }))}
                value={edgeShape}
                onChange={onEdgeShapeChange}
              />
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                Theme
              </p>
              <div className="flex gap-2">
                {THEME_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onThemeNameChange(name)}
                    className={`flex flex-1 items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                      themeName === name
                        ? 'border-primary text-primary'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: themePalettes[name].primary }}
                    />
                    {themeLabels[name]}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between text-xs font-medium text-neutral-900">
              Snap to grid
              <button
                type="button"
                role="switch"
                aria-checked={snapToGrid}
                onClick={() => onSnapToGridChange(!snapToGrid)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  snapToGrid ? 'bg-primary' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    snapToGrid ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  )
}
