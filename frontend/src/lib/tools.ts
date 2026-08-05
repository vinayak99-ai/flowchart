import type { ComponentType, SVGProps } from 'react'
import { DataIcon, FlowchartIcon, ReportIcon } from '../components/icons/ToolIcons'

export type ToolId = 'flowchart' | 'reports' | 'data'

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
    id: 'reports',
    label: 'Report Generator',
    status: 'soon',
    icon: ReportIcon,
    description:
      'Turn structured data into branded PDF and slide reports, using the same export ' +
      'pipeline Flowchart Builder already runs on PNG/PDF/PPTX — generalized to tables, ' +
      'charts, and narrative sections.',
    sharedWith: 'Shares export engine with Flowchart Builder',
  },
  {
    id: 'data',
    label: 'Data Explorer',
    status: 'soon',
    icon: DataIcon,
    description:
      "Browse and query the datasets other Studio tools read from — the same source " +
      'material you’d paste into Flowchart Builder, indexed and searchable without ' +
      'leaving the workspace.',
    sharedWith: 'Shared data layer across Studio tools',
  },
]
