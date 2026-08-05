export interface ProjectSummary {
  stage: "empty" | "clarifying" | "drafted"
  pending_questions: number
  epic_count: number
  high_impact_epics: number
  proposed_adrs: number
  in_jira: boolean
  last_version_reason: string | null
}

export interface ProjectMeta {
  id: string
  name: string
  created_at: string
  updated_at: string
  // Present on list responses; absent on create/rename responses.
  summary?: ProjectSummary
}

export interface AcceptanceScenario {
  given: string
  when: string
  then: string
}

export interface UserStory {
  title: string
  priority: string
  description: string
  why_this_priority: string
  independent_test: string
  acceptance_scenarios: AcceptanceScenario[]
}

export interface FunctionalRequirement {
  id: string
  text: string
  kind: "functional" | "non_functional"
}

export interface KeyEntity {
  name: string
  description: string
}

export interface SuccessCriterion {
  id: string
  text: string
}

export type DiagramType = "journey" | "sequence"

export interface Diagram {
  diagram_type: DiagramType
  title: string
  mermaid_source: string
  png_base64: string | null
}

export type AdrStatus = "proposed" | "accepted"

export interface ArchitectureDecision {
  id: string
  title: string
  context: string
  decision: string
  consequences: string
  status: AdrStatus
}

export type StoryType = "functional" | "technical"

export interface EpicStory {
  id: string
  story_type: StoryType
  title: string
  description: string
  acceptance_criteria: string[]
  jira_key: string | null
  jira_status: string | null
  notes: string | null
}

export type BusinessImpact = "high" | "medium" | "low"

export interface Epic {
  id: string
  title: string
  description: string
  stories: EpicStory[]
  jira_key: string | null
  jira_status: string | null
  business_impact: BusinessImpact
  business_impact_rationale: string
}

export interface GeneratedPRD {
  title: string
  user_stories: UserStory[]
  edge_cases: string[]
  functional_requirements: FunctionalRequirement[]
  key_entities: KeyEntity[]
  success_criteria: SuccessCriterion[]
  assumptions: string[]
  diagrams: Diagram[]
  architecture_decisions: ArchitectureDecision[]
  technical_context: AnsweredClarification[]
  epics: Epic[]
  briefs: StakeholderBrief[]
  updates: ComposedUpdate[]
}

export interface ClarifyQuestion {
  id: string
  category: string
  question: string
  options: string[]
  recommended: string | null
}

export interface AnsweredClarification {
  question: ClarifyQuestion
  answer: string
}

export interface GenerateResponse {
  status: "needs_clarification" | "generated"
  questions: ClarifyQuestion[]
  artifact_id: string | null
  prd: GeneratedPRD | null
}

export type ExportFormat = "md" | "docx" | "csv" | "epics-csv"

export interface JiraStatus {
  configured: boolean
  project_key: string | null
  base_url: string | null
}

export type JiraItemType = "epic" | "story"
export type JiraPushStatus = "created" | "skipped" | "error"

export interface JiraPushResult {
  id: string
  item_type: JiraItemType
  status: JiraPushStatus
  jira_key: string | null
  detail: string | null
}

export interface JiraExportResponse {
  prd: GeneratedPRD
  results: JiraPushResult[]
}

export interface JiraImportResponse {
  prd: GeneratedPRD
  unmapped_requirements: string[]
}

export interface JiraSyncResponse {
  prd: GeneratedPRD
  updated: number
  unchanged: number
}

export type BriefAudience = "executive" | "engineering" | "sales"
export type StakeholderLevel = "high" | "medium" | "low"

export interface Stakeholder {
  id: string
  name: string
  role: string
  audience: BriefAudience
  influence: StakeholderLevel
  interest: StakeholderLevel
  cares_about: string
}

export interface GlossaryTerm {
  id: string
  term: string
  definition: string
}

export interface BriefSection {
  heading: string
  body: string
}

export interface StakeholderBrief {
  audience: BriefAudience
  title: string
  sections: BriefSection[]
  key_asks: string[]
  // Artifact version this brief was generated at (null on old briefs).
  source_version: number | null
}

export type UpdateAudience = "all" | BriefAudience

export interface ComposedUpdate {
  id: string
  audience: UpdateAudience
  from_version: number
  to_version: number
  created_at: string
  title: string
  summary: string
  sections: BriefSection[]
  decisions_needed: string[]
}

export interface ArtifactVersionMeta {
  version: number
  saved_at: string
  reason: string
}

export interface DiffEntry {
  section: string
  change: "added" | "removed" | "modified"
  item: string
  detail: string
}
