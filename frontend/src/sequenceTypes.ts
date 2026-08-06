import type { ValidationIssue } from './types'

export type MessageType = 'sync' | 'return'

export interface SequenceParticipant {
  id: string
  label: string
}

export interface SequenceMessage {
  id: string
  source: string
  target: string
  label: string
  type: MessageType
}

export interface SequenceDiagram {
  participants: SequenceParticipant[]
  messages: SequenceMessage[]
}

export interface GenerateSequenceResponse {
  diagram: SequenceDiagram
  issues: ValidationIssue[]
}

export type SequenceWsProgressMessage =
  | { stage: 'calling_llm' }
  | { stage: 'validating' }
  | { stage: 'done'; result: GenerateSequenceResponse }
  | { stage: 'error'; message: string }
