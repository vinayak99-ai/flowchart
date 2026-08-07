# AI PM Portal — Future Vision & Feature Roadmap

*A planning document, not a commitment. This maps where the tool could go
from its current foundation. Shipped features are described in the main
`README.md`, not here — this file has been pruned down to what's still
**not** built, so it stays a real roadmap instead of a changelog. Last
reorganized after the business-impact-scoring + README-rewrite milestone.*

---

## Where the tool is today

A local-first, single-user AI product workspace with a staged agent pipeline:

```
raw notes → Extraction Agent → Clarify Agent (multi-round Q&A, incl. technical context)
          → Generation Agent (Spec-Kit-style PRD)
          → Architecture Agent (technical-context-aware ADRs) → Epic Agent (functional +
            technical stories, cross-cutting infra epics, business-impact scoring)
          → [on demand] Diagram Agent (Mermaid journey/sequence, PNG-rasterized)
          → [on demand] Enrichment Agent (Jira import review)
          → [on demand] Brief Agent (audience-tuned stakeholder briefs)
          → [on demand] Update Composer Agent (diff-grounded stakeholder updates)
```

Plus: bidirectional Jira integration (push epics/stories, import + enrich
existing ones, pull status back and persist it), a per-project stakeholder
registry and glossary feeding the relevant agents, artifact versioning with
structured diffs, exports (Markdown / .docx with embedded diagram images /
Jira-CSV, per-audience brief exports), provider-agnostic model config, and
plain-JSON persistence a PM can inspect directly. See `README.md` for the
full, current feature list and how to use each one.

**The extension pattern that makes everything below feasible**: each capability
in this codebase is (1) Pydantic models, (2) an `Agent` with a focused system
prompt, (3) a `run_*()` function, (4) a field on the artifact, (5) an endpoint,
(6) a section component. New capabilities are additive, not architectural
rewrites. That pattern is the product's real asset.

## Principles worth preserving as it grows

- **Local-first, files-you-can-read.** No database until multi-user forces one.
- **The human ratifies; agents propose.** Everything AI-drafted stays editable,
  regenerable, and marked (like ADRs starting `proposed`), or is directly
  PM-editable when it's a classification rather than a decision (FR kind,
  epic business impact) — the edit itself is the ratification.
- **One source of truth per fact.** The epics reuse stories verbatim rather
  than re-generating them — every new feature should follow that discipline.
- **Graceful degradation.** No Jira config → no Jira buttons. PNG fails → text
  fallback. New integrations should never make the core flow fragile.

---

## Pillar 1 — Product Strategy

The tool currently starts at "raw notes for a feature." Strategy is the layer
above: *why this feature, why now, why us.*

| Feature | What it does |
|---|---|
| **Strategy Canvas Agent** | A project-level (not artifact-level) document: vision statement, target segments, positioning, moats, strategic bets. Drafted from an interview-style clarify loop (the multi-round Clarify Agent pattern, pointed at strategy questions instead of spec gaps). |
| **Spec ↔ Strategy alignment check** | When a spec is generated, a cross-check agent scores it against the strategy canvas: *which strategic bet does this serve? none? flag it.* Same mechanic as the Enrichment Agent's `unmapped_requirements`, inverted. |
| **OKR tree** | Objectives → Key Results → linked specs/epics. Success criteria (`SC-XXX`) already exist per spec; an agent proposes which KR each one ladders into, and the tree view shows orphaned KRs (no supporting work) and orphaned specs (no strategic parent). |
| **Competitive Intelligence Agent** | Paste competitor announcements/release notes; agent maintains a living competitor matrix per project and flags spec sections that respond to (or ignore) competitive moves. |
| **Bet sizing & kill criteria** | Every strategy bet gets an explicit "we will kill this if…" condition drafted by the agent — reversibility as a first-class field, mirroring how ADRs carry consequences. |

## Pillar 2 — Product Discovery & Design

Discovery is where the current Extraction Agent is thinnest: it assumes the
notes already contain the answer.

| Feature | What it does |
|---|---|
| **Interview Synthesis Agent** | Paste user-interview transcripts / support tickets / survey exports; agent produces themes with frequency × impact scoring, verbatim quotes as evidence, and confidence levels. (The `product-management` plugin's `synthesize-research` skill, whose methodology we already borrowed from once, is the blueprint.) |
| **Persona builder** | Evidence-based personas derived from synthesized research, attached to the project and injected into the Generation Agent's context so user stories reference real segments instead of generic "users." |
| **Opportunity Solution Tree** | Teresa Torres-style: outcome → opportunities → solutions → experiments, rendered as a Mermaid flowchart (the Diagram Agent already proves the render path). Specs link back to the opportunity they address. |
| **Assumption mapper & experiment cards** | Agent extracts the riskiest assumptions from a spec (it already writes an `assumptions` list — currently a dead end) and drafts experiment cards: hypothesis, cheapest test, success threshold, status. |
| **Design handoff pack** | Generate wireframe-level descriptions per user story (screen inventory, states, empty/error/loading cases) as a structured brief a designer or a design tool can consume. Optionally: Mermaid `flowchart` for screen-to-screen navigation. |
| **"Storyboard mode"** | The journey diagram, expanded: each journey step gets an agent-drafted narrative frame (context, emotion, friction) — a PM-readable storyboard exported into the .docx. |

## Pillar 3 — Stakeholder Management & Communication

The registry, audience-tuned briefs, and diff-grounded Update Composer have
all shipped — the tool now knows who its documents are for and can talk to
them without inventing news. What's left builds on that foundation.

| Feature | What it does |
|---|---|
| **Decision log with audiences** | Every accepted ADR and every clarify answer is already a decision — surface them as a chronological, filterable decision log with "who needs to know this" tagging, so "why did we do X?" has a permanent answer. |
| **Meeting prep packs** | Point it at a stakeholder + an agenda; agent assembles the relevant spec sections, open questions addressed to that person, and unresolved notes from imported Jira stories. |
| **RACI generator** | From epics + stakeholder registry, draft a RACI per epic; human ratifies (the `proposed`/`accepted` ADR mechanic, reused). |
| **Update delivery channels** | Email-ready HTML and Slack/Teams webhook delivery for composed updates, instead of Markdown/.docx export only. |

## Pillar 4 — Product Roadmap

The missing layer between "spec with epics" and "what are we doing this year."

| Feature | What it does |
|---|---|
| **Portfolio view** | Today the project list is flat. Add a Now / Next / Later board across projects, each card carrying its strategy link, confidence, and stage. |
| **Roadmap Agent** | Proposes sequencing from dependencies it can see: technical stories that reference ADRs, epics whose stories depend on shared entities, explicit "blocked by" links. Outputs a Mermaid `gantt`/`timeline` (render path already exists) with reasoning per placement. |
| **Full numeric prioritization scoring** | The Epic Agent's coarse `high`/`medium`/`low` business-impact score has shipped; a full RICE/ICE/WSJF score (reach, effort, confidence as separate numeric inputs) needs inputs — team capacity, reach estimates — the tool doesn't collect yet. Keep the agent-proposed and PM-ratified values side by side so drift is visible. Revisit only if the coarse version proves insufficient. |
| **Capacity sanity check** | Given rough team-size input, agent flags roadmap columns that are obviously over-committed based on story counts and technical-story weight. Deliberately coarse — a smell test, not a Gantt replacement. |
| **Roadmap diff & change narrative** | When the roadmap changes, the Update Composer explains *what moved and why* — the artifact most stakeholder decks are missing. |

## Pillar 5 — Technology & Architecture Decisions

ADRs exist and are technical-context-aware; make them live longer than the
spec that spawned them.

| Feature | What it does |
|---|---|
| **Project-level ADR registry** | ADRs currently live inside one artifact. Promote them to project scope with statuses `proposed → accepted → superseded → deprecated`, and links between superseding decisions — a real ADR log. |
| **Consistency Checker Agent** | On each new spec: does anything contradict an accepted ADR? ("ADR-003 says event-driven; FR-004 implies synchronous polling.") Same cross-check shape as Jira-import enrichment `notes`. |
| **Architecture diagram type** | Add `flowchart`/C4-style context diagram to the Diagram Agent's `diagram_type` union, drafted from key entities + integration points named in ADRs. The whole render/PNG/export path is already generic. |
| **Tech-debt ledger** | Every ADR consequence that reads as a cost gets extracted into a debt ledger with a "revisit when…" trigger; technical stories can cite ledger entries as their justification. |
| **Spike brief generator** | For ADRs the agent marks low-confidence, draft a time-boxed spike brief (question, options to evaluate, decision criteria, deadline) as a technical story. |

## Pillar 6 — Product Staging & Delivery

"Staging" as in: how a product moves from idea → experiment → GA.

| Feature | What it does |
|---|---|
| **Stage gates per project** | Discovery → Definition → Delivery → Launched → Measuring, with an agent-drafted checklist per gate (e.g. Definition exit: clarifications resolved, ADRs accepted, epics pushed). The UI already knows most of these states implicitly. |
| **Rollout Plan Agent** | Drafts staged-rollout plans: feature-flag strategy, cohort sequence (internal → beta → % ramp → GA), guardrail metrics per stage, and rollback triggers — informed by edge cases and NFR-flavored functional requirements already in the spec. |
| **Launch checklist & comms pack** | One generator producing: launch checklist, release notes (from shipped stories' acceptance criteria), internal announcement, and customer-facing changelog draft — all from the same artifact, audience-projected like the briefs in Pillar 3. |
| **Readiness scorecard** | Traffic-light roll-up per epic: stories with Jira keys vs. not, unresolved enrichment notes, unmapped requirements — the data already exists, it just needs a scoreboard. |

## Pillar 7 — Product Analytics

The spec's success criteria (`SC-XXX`) are measurable by design — close the loop.

| Feature | What it does |
|---|---|
| **Metric spec generator** | For each success criterion, draft the instrumentation spec: events, properties, funnel definition, segment cuts — as a structured artifact engineers implement against. |
| **Analytics import (CSV-first)** | Local-first analytics: drop a CSV export from any analytics tool; agent maps columns to success criteria and reports actual vs. target per `SC-XXX`. Direct integrations (Amplitude/PostHog/GA) come later, behind the same graceful-degradation gate as Jira. |
| **Results Narrator Agent** | Turns metric deltas into an honest written readout — what hit, what missed, plausible causes ranked by evidence, and what it means for the roadmap. Feeds Pillar 3's Update Composer. |
| **Experiment readouts** | Experiment cards (Pillar 2) get a closing ceremony: agent drafts the readout, updates the assumption's confidence, and proposes spec amendments if the assumption died. |
| **Success-criteria drift alarm** | If a spec's criteria are edited after epics shipped to Jira, flag it — goalposts moving after kickoff is exactly the kind of quiet change stakeholders should see in the decision log. |

---

## Cross-cutting "cool features"

Things that don't belong to one pillar but would change the tool's character:

1. **PM Copilot chat over the project** — a conversational agent with tool
   access to the project's artifacts ("what did we decide about payments?",
   "draft a reply to the CTO's concern about ADR-002"). The pydantic-ai
   `@agent.tool` mechanism is already proven out in this codebase (the
   glossary feature uses it for real now); this is that, grown up.
2. **Cross-project RAG** — "have we solved something like this before?" Search
   past specs/ADRs/research across all projects; agents cite prior art from
   your own portfolio (the Clarify Agent already asks about prior art — today
   the PM has to remember; tomorrow the tool does).
3. **Voice-note ingestion** — record a rambling thought after a customer call;
   transcription feeds the Extraction Agent. The pipeline doesn't care that the
   raw notes were spoken.
4. **Multi-agent debate mode** — for big decisions, spawn adversarial critics: a
   "skeptical CFO" and a "burned-out tech lead" review the spec and file
   objections the PM can accept as edge cases/risks. Cheap to build (two more
   system prompts), memorable to use.
5. **What-if simulator** — "cut scope to P1 stories only: what dies?" Agent
   traces which FRs, success criteria, and stakeholder promises are affected —
   consequence tracing across the artifact graph.
6. **Template packs** — the Spec-Kit shape is hardcoded today. Let teams define
   alternative artifact schemas (Amazon PRFAQ, one-pager, RFC) as data;
   agents fill whatever schema is active.
7. **Confluence/Notion publishing** — same pattern as the Jira client: env-var
   gated, one-way publish of the audience-tuned briefs, keys stored on the
   artifact for idempotent re-publish.
8. **MCP server mode** — expose the portal's actions (read spec, add story,
   log decision) as an MCP server so any AI assistant a PM already uses can
   operate the portal — the portal becomes infrastructure, not a destination.

---

## The experience layer — UI & UX

Two UX passes have shipped (see `README.md` and `docs/UX-PROPOSAL.md` for
the full record): the first brought collapsible sections, the outline rail,
the pipeline stage tracker, version history, toasts/confirm dialogs, and
theming; the second (UX-PROPOSAL phases 1–5) brought read-mode-by-default
with click-to-edit blocks, autosave with a dirty-guard and deletion undo,
the Spec/Comms tab split, outline attention markers, status-bearing project
cards, the version-timeline baseline picker, brief/update staleness stamps,
copy-to-clipboard, a density toggle, and skeleton loaders. What's below is
what's still open — and several remaining pillars (review/ratify flows, the
portfolio view) are *primarily* UX problems with an agent attached.

### Honest debts still open in the UI

- **No streamed generation output, no cancel.** The stage tracker shows which
  agent is running, but a stuck or slow stage can't be canceled, and nothing
  streams incrementally.
- **No seeded example project.** The empty state now explains the flow, but
  nothing demonstrates a finished spec until you generate one yourself.
- **No in-UI viewer for past versions.** The version/diff API supports
  "show me the spec as of vN"; the UI only shows diffs, not the full old
  document.
- **No field-level undo.** Deleting an item is undoable; editing text is
  recoverable only via version history.

### Design direction

| Theme | What changes |
|---|---|
| **Streaming & cancellability** | The stage tracker shows *which* agent is running; still missing is streamed token output for long drafts and the ability to cancel a stuck generation. |
| **Review inbox for agent proposals** | Everything agents propose (ADRs, enrichment notes, technical stories, scores) flows through one queue with accept / edit / reject per item — the propose→ratify trust model made into a first-class surface instead of scattered `proposed` badges. The outline attention dots are the seed of this; the inbox is its grown-up form. |
| **In-UI version viewer** | One-click "view the whole spec as of vN" (read mode already renders a document; pointing it at an old version is the natural next step). |
| **Command palette (⌘K)** | Navigate projects/sections, trigger any agent action, and — once the PM Copilot exists — type natural-language commands from the same box. Deferred until the Copilot gives it a reason to exist. |
| **Filters** | "P1 only" / "unresolved only" views on long specs (density toggle shipped; filtering is the remaining half). |
| **First-run onboarding** | A seeded example project (real-looking spec, ADRs, epics, diagrams) plus an interactive "generate your first spec" walkthrough — the explanatory empty state shipped, the demo content didn't. |
| **Reading everywhere** | Responsive read-only layouts for tablet/phone — PMs review specs on the train even if they edit at a desk. Print stylesheet so browser-print of the document view looks like the .docx. |
| **Accessibility audit** | Interactive badges/chips now carry roles, keyboard handlers, and aria-pressed, but a full keyboard/focus-state audit and a WCAG-AA contrast pass are still open. |
| **A small design system** | Codify tokens (type scale tuned for long-form reading, spacing, semantic colors for proposed/accepted/error/success) so the seven pillars' new surfaces feel like one product, not seven features bolted on. |

### UX principles to hold

- **Reading is the default mode; editing is a gesture away.** Documents are
  the product — treat them typographically like it.
- **Never hide latency, narrate it.** Agents are slow; a UI that shows what
  the pipeline is doing converts waiting into trust.
- **Every agent proposal is reviewable in one place.** If ratifying AI output
  feels like chores scattered across a page, the trust model erodes.
- **Zero data loss, ever.** Autosave + versions + undo. A PM should never
  fear clicking anything.

---

## Sequencing sketch (three horizons)

**Now — finish what Horizon 1 started**
Project-level ADR registry + consistency checks → assumption mapper → full
numeric prioritization scoring (RICE/ICE/WSJF, on top of the shipped coarse
score). *UX:* streaming/cancel, review inbox for agent proposals, in-UI
version viewer — the remaining debts that hurt today, independent of any
new pillar.

**Horizon 2 — widen to the full PM lifecycle**
Interview Synthesis + personas → strategy canvas + alignment checks → portfolio
roadmap view + Roadmap Agent → stage gates + rollout plans → metric specs +
CSV analytics import.
*UX in this horizon:* seeded example project + guided first run, filters on
long specs, reading-everywhere layouts — the surfaces the new pillars need
to land on.

**Horizon 3 — change what kind of tool it is**
PM Copilot chat → cross-project RAG → multi-agent debate & what-if simulation →
live integrations (analytics APIs, Slack, Confluence) → template packs → MCP
server mode → (only if genuinely needed) multi-user with real auth and a
database.

---

## What *not* to build

- **A Jira replacement.** Stay the thinking layer; let delivery tools own
  delivery. The import/push/sync bridge is the right relationship.
- **Real-time collaborative editing.** Single-PM-with-agents is the identity;
  multiplayer would force auth, conflict resolution, and a server — the entire
  local-first dividend spent on a feature Google Docs already has.
- **Autonomous agents acting without ratification.** The propose→ratify loop
  isn't a limitation to engineer away; it's the trust model that makes the
  AI-drafted content usable in front of stakeholders.
