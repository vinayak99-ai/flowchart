import type { ComponentType, SVGProps } from 'react'
import { DataIcon, FlowchartIcon, ReportIcon, SequenceIcon, SpecIcon } from '../components/icons/ToolIcons'

export type ToolId = 'flowchart' | 'sequence' | 'spec' | 'reports' | 'data'

export interface ToolDef {
  id: ToolId
  label: string
  status: 'ready' | 'soon'
  icon: ComponentType<SVGProps<SVGSVGElement>>
  description?: string
  sharedWith?: string
}

export const TOOLS: ToolDef[] = [
  {
    id: 'flowchart',
    label: 'Flowchart Builder',
    status: 'ready',
    icon: FlowchartIcon,
  },
  {
    id: 'sequence',
    label: 'Sequence Diagram',
    status: 'ready',
    icon: SequenceIcon,
  },
  {
    id: 'spec',
    label: 'Spec Builder',
    status: 'ready',
    icon: SpecIcon,
  },
  {
    id: 'reports',
    label: 'Report Generator',
    status: 'soon',
    icon: ReportIcon,
    description:
      'Turn a Spec Builder project — its stories, requirements, epics, and stakeholder ' +
      'briefs — into a branded PDF or slide deck for leadership review, using the same ' +
      'export pipeline Flowchart Builder already runs on PNG/PDF/PPTX.',
    sharedWith: 'Reads Spec Builder projects, shares export engine with Flowchart Builder',
  },
  {
    id: 'data',
    label: 'Data Explorer',
    status: 'soon',
    icon: DataIcon,
    description:
      'Browse and query across every Spec Builder project at once — search stories and ' +
      'requirements by keyword, track epic impact and Jira delivery status portfolio-wide, ' +
      'without opening each project individually.',
    sharedWith: 'Reads across all Spec Builder projects',
  },
]
