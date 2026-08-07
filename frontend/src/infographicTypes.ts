import type { ValidationIssue } from './types'

export interface WheelItem {
  label: string
  description: string
}

export interface InfographicWheel {
  template: 'radial_wheel'
  title: string
  items: WheelItem[]
}

export interface ComparisonColumn {
  heading: string
  points: string[]
}

export interface InfographicComparison {
  template: 'comparison_columns'
  title: string
  columns: ComparisonColumn[]
}

export interface RoadmapColumn {
  heading: string
  items: string[]
}

export interface InfographicRoadmap {
  template: 'now_next_later'
  title: string
  columns: RoadmapColumn[]
}

export interface PyramidPillar {
  label: string
  description: string
}

export interface InfographicPyramid {
  template: 'vision_pyramid'
  vision: string
  pillars: PyramidPillar[]
}

export interface TimelineMilestone {
  period: string
  label: string
  description: string
}

export interface InfographicTimeline {
  template: 'quarterly_timeline'
  title: string
  milestones: TimelineMilestone[]
}

export interface BulletSummarySlide {
  template: 'bullet_summary'
  title: string
  bullets: string[]
}

export interface MatrixQuadrant {
  label: string
  items: string[]
}

export interface InfographicMatrix {
  template: 'matrix_2x2'
  title: string
  x_axis_label: string
  y_axis_label: string
  quadrants: MatrixQuadrant[]
}

export type InfographicDiagram =
  | InfographicWheel
  | InfographicComparison
  | InfographicRoadmap
  | InfographicPyramid
  | InfographicTimeline
  | BulletSummarySlide
  | InfographicMatrix

export interface GenerateInfographicResponse {
  diagram: InfographicDiagram
  issues: ValidationIssue[]
}

export type InfographicWsProgressMessage =
  | { stage: 'classifying' }
  | { stage: 'calling_llm' }
  | { stage: 'validating' }
  | { stage: 'done'; result: GenerateInfographicResponse }
  | { stage: 'error'; message: string }

export interface DeckSlidePlan {
  template: InfographicDiagram['template']
  topic: string
}

export interface DeckPlan {
  deck_title: string
  slides: DeckSlidePlan[]
}

export interface GenerateDeckResponse {
  title: string
  slides: InfographicDiagram[]
  issues: ValidationIssue[]
}

export type DeckWsProgressMessage =
  | { stage: 'planning' }
  | { stage: 'plan_ready'; plan: DeckPlan }
  | { stage: 'generating'; completed: number; total: number }
  | { stage: 'done'; result: GenerateDeckResponse }
  | { stage: 'error'; message: string }
