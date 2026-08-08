import type {
  ConceptBrief,
  ConceptSpark,
  DesignThinkingSession,
  HowMightWe,
  Persona,
  ProblemStatement,
  ValidationPlan,
} from '../designThinkingTypes'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return res.json()
}

export function generatePersonas(material: string, prompt: string): Promise<{ personas: Persona[] }> {
  return post('/api/design-thinking/empathize', { material, prompt })
}

export function generateProblemStatements(
  personas: Persona[],
  prompt: string,
): Promise<{ problem_statements: ProblemStatement[] }> {
  return post('/api/design-thinking/define', { personas, prompt })
}

export function generateHowMightWe(
  problem_statements: ProblemStatement[],
  prompt: string,
): Promise<{ how_might_we: HowMightWe[] }> {
  return post('/api/design-thinking/ideate/how-might-we', { problem_statements, prompt })
}

export function generateConceptSparks(
  how_might_we: HowMightWe[],
  prompt: string,
): Promise<{ concept_sparks: ConceptSpark[] }> {
  return post('/api/design-thinking/ideate/concept-sparks', { how_might_we, prompt })
}

export function generateConceptBriefs(
  concept_sparks: ConceptSpark[],
  prompt: string,
): Promise<{ concept_briefs: ConceptBrief[] }> {
  return post('/api/design-thinking/prototype', { concept_sparks, prompt })
}

export function generateValidationPlans(
  concept_briefs: ConceptBrief[],
  prompt: string,
): Promise<{ validation_plans: ValidationPlan[] }> {
  return post('/api/design-thinking/test', { concept_briefs, prompt })
}

export async function exportDesignThinkingMarkdown(session: DesignThinkingSession): Promise<void> {
  const res = await fetch(`${API_BASE}/api/design-thinking/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'design-thinking.md'
  link.click()
  URL.revokeObjectURL(url)
}
