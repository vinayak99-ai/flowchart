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

export interface StoryAct {
  heading: string
  body: string
  detail: string
}

export interface FeatureStory {
  template: 'feature_story'
  headline: string
  problem: StoryAct
  solution: StoryAct
  impact: StoryAct
}

export interface HubSpokeItem {
  label: string
  description: string
}

export interface InfographicHubSpoke {
  template: 'hub_spoke'
  title: string
  description: string
  items: HubSpokeItem[]
}

export interface TitleSlide {
  template: 'title_intro'
  title: string
  subtitle: string
  highlights: string[]
}

export interface AgendaItem {
  label: string
  page: number
}

export interface AgendaSlide {
  template: 'agenda'
  title: string
  items: AgendaItem[]
}

export interface ValuePropositionSlide {
  template: 'value_proposition'
  title: string
  customer_jobs: string[]
  customer_pains: string[]
  customer_gains: string[]
  products_services: string[]
  pain_relievers: string[]
  gain_creators: string[]
}

export interface PositioningStatementSlide {
  template: 'positioning_statement'
  product_name: string
  target_customer: string
  need: string
  category: string
  key_benefit: string
  primary_alternative: string
  differentiator: string
}

export interface RaciRow {
  task: string
  responsible: string
  accountable: string
  consulted: string
  informed: string
}

export interface RaciChartSlide {
  template: 'raci_chart'
  title: string
  rows: RaciRow[]
}

export interface MetricDriver {
  label: string
  metric: string
  description: string
}

export interface NorthStarMetricSlide {
  template: 'north_star_metric'
  north_star: string
  definition: string
  drivers: MetricDriver[]
}

export type InfographicDiagram =
  | InfographicWheel
  | InfographicComparison
  | InfographicRoadmap
  | InfographicPyramid
  | InfographicTimeline
  | BulletSummarySlide
  | InfographicMatrix
  | FeatureStory
  | InfographicHubSpoke
  | TitleSlide
  | AgendaSlide
  | ValuePropositionSlide
  | PositioningStatementSlide
  | RaciChartSlide
  | NorthStarMetricSlide

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
  agenda_label: string
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
