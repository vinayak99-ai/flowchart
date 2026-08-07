import type {
  ArtifactVersionMeta,
  BriefAudience,
  ClarifyQuestion,
  DiagramType,
  DiffEntry,
  ExportFormat,
  GeneratedPRD,
  GenerateResponse,
  GlossaryTerm,
  JiraExportResponse,
  JiraImportResponse,
  JiraStatus,
  JiraSyncResponse,
  ProjectMeta,
  Stakeholder,
  UpdateAudience,
} from "./types"

// Spec Builder's backend is mounted at /pm on the same Product Studio API process
// (see backend/app/main.py's app.mount("/pm", spec_builder_app)).
export const API_BASE = import.meta.env.VITE_PM_API_BASE ?? "http://localhost:8000/pm"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  listProjects: () => request<ProjectMeta[]>("/projects"),

  createProject: (name: string) =>
    request<ProjectMeta>("/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getProject: (projectId: string) =>
    request<ProjectMeta>(`/projects/${projectId}`),

  renameProject: (projectId: string, name: string) =>
    request<ProjectMeta>(`/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }),

  deleteProject: (projectId: string) =>
    request<{ status: string }>(`/projects/${projectId}`, {
      method: "DELETE",
    }),

  generate: (projectId: string, rawNotes: string) =>
    request<GenerateResponse>(`/projects/${projectId}/generate`, {
      method: "POST",
      body: JSON.stringify({ raw_notes: rawNotes }),
    }),

  submitClarifications: (projectId: string, answers: Record<string, string>) =>
    request<GenerateResponse>(`/projects/${projectId}/clarify`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  getPendingClarification: (projectId: string) =>
    request<{ questions: ClarifyQuestion[] }>(`/projects/${projectId}/pending-clarification`),

  getGenerationStatus: (projectId: string) =>
    request<{ stage: string | null }>(`/projects/${projectId}/generation-status`),

  regenerateSection: (projectId: string, artifactId: string, section: string, context: string) =>
    request<{ prd: GeneratedPRD }>(
      `/projects/${projectId}/artifacts/${artifactId}/regenerate-section`,
      { method: "POST", body: JSON.stringify({ section, context }) }
    ),

  listArtifacts: (projectId: string) =>
    request<{ artifact_ids: string[] }>(`/projects/${projectId}/artifacts`),

  getArtifact: (projectId: string, artifactId: string) =>
    request<GeneratedPRD>(`/projects/${projectId}/artifacts/${artifactId}`),

  updateArtifact: (projectId: string, artifactId: string, prd: GeneratedPRD, reason: "manual save" | "autosave" = "manual save") =>
    request<{ status: string }>(
      `/projects/${projectId}/artifacts/${artifactId}?reason=${encodeURIComponent(reason)}`,
      {
        method: "PUT",
        body: JSON.stringify(prd),
      }
    ),

  deleteArtifact: (projectId: string, artifactId: string) =>
    request<{ status: string }>(`/projects/${projectId}/artifacts/${artifactId}`, {
      method: "DELETE",
    }),

  generateDiagram: (projectId: string, artifactId: string, diagramType: DiagramType) =>
    request<GeneratedPRD>(`/projects/${projectId}/artifacts/${artifactId}/diagrams`, {
      method: "POST",
      body: JSON.stringify({ diagram_type: diagramType }),
    }),

  setDiagramPng: (projectId: string, artifactId: string, diagramType: DiagramType, pngBase64: string) =>
    request<GeneratedPRD>(`/projects/${projectId}/artifacts/${artifactId}/diagrams/${diagramType}/png`, {
      method: "PUT",
      body: JSON.stringify({ png_base64: pngBase64 }),
    }),

  generateArchitectureDecisions: (projectId: string, artifactId: string) =>
    request<GeneratedPRD>(`/projects/${projectId}/artifacts/${artifactId}/architecture-decisions`, {
      method: "POST",
    }),

  generateEpics: (projectId: string, artifactId: string) =>
    request<GeneratedPRD>(`/projects/${projectId}/artifacts/${artifactId}/epics`, {
      method: "POST",
    }),

  getJiraStatus: () => request<JiraStatus>("/jira/status"),

  pushToJira: (projectId: string, artifactId: string) =>
    request<JiraExportResponse>(`/projects/${projectId}/artifacts/${artifactId}/jira-export`, {
      method: "POST",
    }),

  importFromJira: (projectId: string, artifactId: string) =>
    request<JiraImportResponse>(`/projects/${projectId}/artifacts/${artifactId}/jira-import`, {
      method: "POST",
    }),

  syncJiraStatus: (projectId: string, artifactId: string) =>
    request<JiraSyncResponse>(`/projects/${projectId}/artifacts/${artifactId}/jira-sync`, {
      method: "POST",
    }),

  getStakeholders: (projectId: string) =>
    request<{ stakeholders: Stakeholder[] }>(`/projects/${projectId}/stakeholders`),

  saveStakeholders: (projectId: string, stakeholders: Stakeholder[]) =>
    request<{ stakeholders: Stakeholder[] }>(`/projects/${projectId}/stakeholders`, {
      method: "PUT",
      body: JSON.stringify({ stakeholders }),
    }),

  getGlossary: (projectId: string) =>
    request<{ terms: GlossaryTerm[] }>(`/projects/${projectId}/glossary`),

  saveGlossary: (projectId: string, terms: GlossaryTerm[]) =>
    request<{ terms: GlossaryTerm[] }>(`/projects/${projectId}/glossary`, {
      method: "PUT",
      body: JSON.stringify({ terms }),
    }),

  generateBrief: (projectId: string, artifactId: string, audience: BriefAudience) =>
    request<GeneratedPRD>(`/projects/${projectId}/artifacts/${artifactId}/briefs`, {
      method: "POST",
      body: JSON.stringify({ audience }),
    }),

  briefExportUrl: (projectId: string, artifactId: string, audience: BriefAudience, format: "md" | "docx") =>
    `${API_BASE}/projects/${projectId}/artifacts/${artifactId}/briefs/${audience}/export/${format}`,

  listVersions: (projectId: string, artifactId: string) =>
    request<{ versions: ArtifactVersionMeta[] }>(`/projects/${projectId}/artifacts/${artifactId}/versions`),

  getDiff: (projectId: string, artifactId: string, fromVersion: number) =>
    request<{ from_version: number; to_version: number | null; entries: DiffEntry[] }>(
      `/projects/${projectId}/artifacts/${artifactId}/diff?from_version=${fromVersion}`
    ),

  composeUpdate: (projectId: string, artifactId: string, fromVersion: number, audience: UpdateAudience) =>
    request<GeneratedPRD>(`/projects/${projectId}/artifacts/${artifactId}/updates`, {
      method: "POST",
      body: JSON.stringify({ from_version: fromVersion, audience }),
    }),

  updateExportUrl: (projectId: string, artifactId: string, updateId: string, format: "md" | "docx") =>
    `${API_BASE}/projects/${projectId}/artifacts/${artifactId}/updates/${updateId}/export/${format}`,

  exportUrl: (projectId: string, artifactId: string, format: ExportFormat) =>
    `${API_BASE}/projects/${projectId}/artifacts/${artifactId}/export/${format}`,
}
