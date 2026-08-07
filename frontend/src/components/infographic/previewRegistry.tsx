import type { InfographicDiagram } from '../../infographicTypes'
import { WheelPreview } from './WheelPreview'
import { ComparisonPreview } from './ComparisonPreview'
import { RoadmapPreview } from './RoadmapPreview'
import { PyramidPreview } from './PyramidPreview'
import { TimelinePreview } from './TimelinePreview'
import { BulletSummaryPreview } from './BulletSummaryPreview'
import { MatrixPreview } from './MatrixPreview'

// Shared between the single-infographic canvas and the multi-slide deck
// canvas, so both render every template the exact same way rather than
// keeping two copies of this switch in sync.
export const TEMPLATE_LABEL: Record<InfographicDiagram['template'], string> = {
  radial_wheel: 'Radial wheel',
  comparison_columns: 'Comparison columns',
  now_next_later: 'Now/Next/Later roadmap',
  vision_pyramid: 'Vision pyramid',
  quarterly_timeline: 'Quarterly timeline',
  bullet_summary: 'Bullet summary',
  matrix_2x2: '2x2 matrix',
}

export function renderInfographicPreview(
  diagram: InfographicDiagram,
  onChange: (diagram: InfographicDiagram) => void,
) {
  switch (diagram.template) {
    case 'radial_wheel':
      return (
        <div className="aspect-[31/30] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-lg">
          <WheelPreview wheel={diagram} onChange={onChange} />
        </div>
      )
    case 'comparison_columns':
      return (
        <div className="aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
          <ComparisonPreview comparison={diagram} onChange={onChange} />
        </div>
      )
    case 'now_next_later':
      return (
        <div className="aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
          <RoadmapPreview roadmap={diagram} onChange={onChange} />
        </div>
      )
    case 'vision_pyramid':
      return (
        <div className="aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
          <PyramidPreview pyramid={diagram} onChange={onChange} />
        </div>
      )
    case 'quarterly_timeline':
      return (
        <div className="aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
          <TimelinePreview timeline={diagram} onChange={onChange} />
        </div>
      )
    case 'bullet_summary':
      return (
        <div className="aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
          <BulletSummaryPreview slide={diagram} onChange={onChange} />
        </div>
      )
    case 'matrix_2x2':
      return (
        <div className="aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
          <MatrixPreview matrix={diagram} onChange={onChange} />
        </div>
      )
  }
}
