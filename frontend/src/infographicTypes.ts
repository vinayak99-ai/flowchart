import type { ValidationIssue } from './types'

export interface WheelItem {
  label: string
  description: string
}

export interface InfographicWheel {
  title: string
  items: WheelItem[]
}

export interface GenerateInfographicResponse {
  diagram: InfographicWheel
  issues: ValidationIssue[]
}

export type InfographicWsProgressMessage =
  | { stage: 'calling_llm' }
  | { stage: 'validating' }
  | { stage: 'done'; result: GenerateInfographicResponse }
  | { stage: 'error'; message: string }
