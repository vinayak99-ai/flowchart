import type { BulletSummarySlide } from '../../infographicTypes'
import { EditableText } from './EditableText'

// The flexible fallback template -- a plain title + bullet list, for
// content that doesn't fit any of the shaped templates. Dot-bullet rows
// match the visual style already used for list rows elsewhere (comparison
// points, roadmap items) rather than reaching for native <ul> markers.
const BULLET_ACCENT_COLOR = '#00754a'

interface BulletSummaryPreviewProps {
  slide: BulletSummarySlide
  onChange: (slide: BulletSummarySlide) => void
}

export function BulletSummaryPreview({ slide, onChange }: BulletSummaryPreviewProps) {
  const bullets = slide.bullets.slice(0, 6)

  const updateTitle = (title: string) => onChange({ ...slide, title })
  const updateBullet = (i: number, text: string) => {
    const next = slide.bullets.slice()
    next[i] = text
    onChange({ ...slide, bullets: next })
  }

  return (
    <div className="flex h-full w-full flex-col gap-6 bg-white p-10">
      <EditableText
        value={slide.title}
        onCommit={updateTitle}
        as="h2"
        className="text-center text-2xl font-extrabold uppercase tracking-wide text-neutral-900"
      />
      <ul className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4">
        {bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-3 text-base text-neutral-800">
            <span
              className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: BULLET_ACCENT_COLOR }}
            />
            <EditableText
              value={bullet}
              onCommit={(text) => updateBullet(i, text)}
              as="span"
              className="flex-1"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
