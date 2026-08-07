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

export type InfographicDiagram = InfographicWheel | InfographicComparison

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
