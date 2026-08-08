export interface Voice {
  name: string
  role: string
  input: string
}

export interface Persona {
  name: string
  context: string
  goals: string[]
  pains: string[]
  behaviors: string[]
  voices: Voice[]
}

export interface ProblemStatement {
  persona_name: string
  user: string
  need: string
  insight: string
  assembled: string
}

export interface HowMightWe {
  question: string
  rationale: string
  selected: boolean
}

export interface ConceptSpark {
  how_might_we: string
  idea: string
  is_wildcard: boolean
  selected: boolean
}

export interface ConceptBrief {
  concept_name: string
  description: string
  key_interactions: string[]
  assumptions: string[]
  biggest_risk: string
}

export interface ValidationPlan {
  concept_name: string
  hypotheses: string[]
  success_signal: string
  risk_if_wrong: string
}

export interface DesignThinkingSession {
  problem_area: string
  personas: Persona[]
  problem_statements: ProblemStatement[]
  how_might_we: HowMightWe[]
  concept_sparks: ConceptSpark[]
  concept_briefs: ConceptBrief[]
  validation_plans: ValidationPlan[]
}

export const EMPTY_SESSION: DesignThinkingSession = {
  problem_area: '',
  personas: [],
  problem_statements: [],
  how_might_we: [],
  concept_sparks: [],
  concept_briefs: [],
  validation_plans: [],
}

export type DesignThinkingStage = 'empathize' | 'define' | 'ideate' | 'prototype' | 'test'

export const STAGES: { id: DesignThinkingStage; label: string }[] = [
  { id: 'empathize', label: 'Empathize' },
  { id: 'define', label: 'Define' },
  { id: 'ideate', label: 'Ideate' },
  { id: 'prototype', label: 'Prototype' },
  { id: 'test', label: 'Test' },
]
