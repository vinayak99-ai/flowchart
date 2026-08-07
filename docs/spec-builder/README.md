# Spec Builder

A Studio tool, not a separate app: its backend is
[`backend/app/spec_builder/`](../../backend/app/spec_builder) (mounted at
`/pm` on Studio's single FastAPI process, see
[`backend/app/main.py`](../../backend/app/main.py)) and its frontend is
[`frontend/src/features/spec-builder/`](../../frontend/src/features/spec-builder)
(Studio's own React app). One backend process, one frontend build, one
`backend/.env` — see the root [`README.md`](../../README.md) for how to run
Studio as a whole. This doc covers what Spec Builder actually does; originally
built as a standalone tool ([`vinayak99-ai/aipm`](https://github.com/vinayak99-ai/aipm))
and folded into Studio as native code, not an embedded app.

An AI-assisted tool for product managers: paste raw notes about a feature or
project, answer a short round of clarifying questions, and get back a
structured, editable spec — prioritized user stories, functional
requirements, success criteria, architecture decisions, and Jira-ready
epics — plus everything a PM needs to communicate it: diagrams, stakeholder
briefs, recurring updates, and a two-way Jira sync. Everything is edited in
the browser, versioned automatically, and exported to Markdown, .docx, or
.csv. Local-first — no database, no auth, no server-side multi-tenant
credential storage; your data lives in plain JSON files on your own machine.

## Setup

Set your model + API key in Studio's one `backend/.env` (see the root
[`README.md`](../../README.md#backend-setup) for the full variable table):

```bash
# in backend/.env, alongside OPENAI_API_KEY (Flowchart Builder's):
AIPM_MODEL=anthropic:claude-sonnet-5   # or openai:gpt-5 to run on OpenAI instead
ANTHROPIC_API_KEY=sk-ant-...           # or OPENAI_API_KEY, matching AIPM_MODEL's provider
```

Optionally, also set `JIRA_BASE_URL` / `JIRA_EMAIL` / `JIRA_API_TOKEN` /
`JIRA_PROJECT_KEY` in the same file to enable pushing epics to and syncing
status from a real Jira project — leave them unset to skip Jira entirely;
everything else works without it.

API docs for the mounted routes are at `http://localhost:8000/pm/docs` once
the backend is running.

## Features

### Turn raw notes into a real spec
Paste whatever you have — a paragraph, a bulleted brain-dump, a meeting
recap — and the **Extraction Agent** pulls out the problem statement, goals,
target users, and open questions. The **Clarify Agent** then reviews that
extraction across 12 coverage categories (including whether this is a
greenfield build or extends an existing system, and what stack/integration
constraints apply) and asks up to 8 short follow-up questions, in small
rounds of up to 3, each round informed by what you just answered. If nothing
about your notes is ambiguous, it skips straight to drafting. Answer each
round in the UI, or leave a question blank to accept its recommended
default — the **Generation Agent** then drafts the full spec, treating your
answers as authoritative. If you navigate away mid-round, reopening the
project resumes exactly where you left off.

### A spec structured the way engineers expect
The generated spec follows GitHub Spec Kit's `spec.md` shape: a title;
prioritized (P1/P2/P3), independently-testable user stories, each with a
description, the reasoning behind its priority, an "independent test," and
Given/When/Then acceptance scenarios; edge cases; sequential `FR-XXX`
functional requirements — each tagged `functional` or `non_functional`
(performance, security, scalability, reliability, availability, compliance)
with a click-to-toggle badge; key entities; sequential `SC-XXX` measurable,
technology-agnostic success criteria; and assumptions. Every field is
editable in the browser, with add/remove for every list.

### Architecture decisions and epics, drafted for you
Every generated spec automatically gets:
- **Architecture Decisions** — the **Architecture Agent** infers 3-6
  ADR-style decisions (context, decision, consequences) from the spec, each
  starting `status: proposed` for you to accept or edit. It factors in the
  technical context you gave during clarification: for an existing system it
  reasons about integration and migration instead of assuming a blank slate;
  for a greenfield build it also proposes foundational infra/DevOps
  decisions (hosting, CI/CD, IaC). When your requirements include
  non-functional ones, it proposes a test-strategy ADR for how those quality
  attributes actually get validated.
- **Epics** — the **Epic Agent** groups the spec's user stories into
  cohesive epics ("functional" stories, reused verbatim) and drafts the
  "technical" stories each epic also needs, informed by the architecture
  decisions. Cross-cutting infra/DevOps work gets its own dedicated epic
  instead of being force-fit into a feature epic.

Both are editable and independently regenerable from their own "Regenerate"
button after you edit the spec.

### Business impact scoring, so epics are actually prioritized
The Epic Agent scores every epic `high`/`medium`/`low`, weighing the
priority and stated reasoning of the stories it contains and which success
criteria those stories actually serve — with a short, cited rationale (e.g.
"Contains 2 P1 stories addressing the primary drop-off point; directly moves
SC-001"). It never invents business context (market size, revenue) your spec
doesn't give it. The Epics section renders higher-impact epics first, and
you can click a badge on any epic to cycle its score `high → medium → low`
yourself — your override *is* the final answer, no separate approval step.
A changed score shows up in version diffs, and both stakeholder briefs and
recurring updates mention an epic's impact when discussing it.

### Diagrams, generated on demand
Click to generate a **user journey** or **sequence diagram** from the spec —
the **Diagram Agent** turns the stories, scenarios, requirements, and
entities into Mermaid source, rendered live in the browser. Copy the raw
source, regenerate either diagram independently, or remove one. Diagrams
export as fenced Mermaid code in Markdown (renders natively on GitHub/GitLab)
and as an embedded PNG picture in the .docx export.

### Two-way Jira integration
- **Push** — a "Push to Jira" button on the Epics section creates each Epic
  then its Stories in your configured Jira project (linked via the `parent`
  field), after showing you exactly what will be created. Re-clicking skips
  anything already pushed, so it's safe to push again after edits.
- **Import** — pull an existing Jira project's Epics/Stories in instead. The
  **Enrichment Agent** reviews each imported story against your spec —
  classifying it functional vs. technical, filling in thin descriptions and
  acceptance criteria, and flagging inconsistencies with your requirements —
  and reports any functional requirement with no matching story, as a
  coverage-gap summary. Import never overwrites local edits, only adds new
  items.
- **Sync status** — once anything is pushed or imported, a "Sync status"
  button pulls each item's current Jira status (To Do/In Progress/Done) into
  the tool, so your spec always reflects real delivery progress. Status
  changes show up in diffs and get mentioned in briefs and updates. Pull-only
  — nothing is ever written back to Jira by a sync.

### Communicating with stakeholders
Maintain a **stakeholder registry** (name, role, audience, influence/interest,
what they care about), then generate three audience-tuned projections of the
spec with one click each:
- an **executive one-pager** — outcome, progress, risks, explicit asks
- an **engineering brief** — requirements, ADRs with status, technical
  stories, open ambiguities
- a **sales enablement doc** — customer-facing changes, availability,
  talk track, FAQ

The **Brief Agent** only projects what's actually in your spec — missing
information is stated as "not yet defined," never invented — and tunes tone
to the stakeholders named for that audience. Briefs live alongside the spec
and export individually as Markdown or .docx.

### Recurring stakeholder updates, backed by real diffs
Every meaningful save is versioned automatically with a reason ("generated",
"manual save", "pushed to Jira", …). Pick a baseline version and an audience,
preview exactly what changed, and the **Update Composer Agent** drafts the
"what changed and why it matters" update from that diff alone — it can never
claim progress that didn't happen. If nothing changed since the baseline,
you get a clean "nothing to report" instead of invented content. Composed
updates are stored with their version range and export as Markdown or .docx.

### Project memory: a glossary your agents actually use
Maintain a per-project glossary of term → definition pairs, and every agent
that talks to stakeholders — Architecture, Brief, and Update Composer — uses
it, so your team's vocabulary stays consistent across every generated
document.

### A reading-first UI that can't lose your work
- **Read mode by default** — the spec renders as an actual document
  (headings, prose, Given/When/Then lists), not a wall of form fields.
  Click any block — a story, a requirement, an ADR, an epic — to edit just
  that block in place (Escape or Done to close), or flip the whole page
  into full edit mode with the Read/Edit toggle in the action bar.
  Click-to-cycle badges (requirement kind, ADR status, epic impact) work in
  both modes.
- **Autosave** — edits save automatically two seconds after you stop
  typing, with a live `Saved / Saving… / Unsaved changes` indicator.
  `Cmd/Ctrl+S` saves instantly; navigating away with unsaved changes warns
  first, and identical re-saves are deduped so version history stays
  meaningful.
- **Undo for deletions** — removing a story, requirement, criterion, ADR,
  or epic shows an Undo toast instead of being silently permanent.
- **Spec and Comms tabs** — the document (overview through epics, plus
  diagrams) and the audience layer (stakeholders, glossary, briefs,
  updates) each get their own tab and outline rail, so the communication
  workflow isn't buried at the bottom of one long scroll.
- **Attention markers** — amber dots on the outline rail (and the Comms
  tab) flag what needs a human: ADRs still `proposed`, unresolved
  enrichment notes on imported stories, or a spec that has changed since
  the last composed update. Briefs the spec has moved past say so
  ("Based on v4 — the spec has changed since").

### Everything else
- **Version history and structured diffs** — browse any past version of the
  spec, or diff any version against the current one; the diff calls out
  what actually matters (an ADR flipping to accepted, a story pushed to
  Jira, an epic's impact score changing), not raw JSON noise.
- **Status-bearing project cards** — the project list shows each project's
  stage (clarifying with waiting-question count, drafted, in Jira), epic
  and high-impact counts, proposed-ADR chips, and what the last save was.
- **Live pipeline progress** — while a spec generates, the UI shows which
  agent stage is running (Extracting → Clarifying → Drafting → Architecture
  → Epics) instead of a single spinner.
- **Export and copy** — Markdown, .docx, or a Jira-importable .csv of user
  stories from the main action bar; diagrams, briefs, and updates each have
  their own export controls, and briefs/updates also copy to the clipboard
  as Markdown for pasting straight into Slack or email.
- **Delivery status bar on Epics** — a stacked Done / In Progress / To Do /
  not-in-Jira summary computed from synced statuses.
- **Rename/delete projects** in place from the project list, with a
  confirmation dialog before anything is deleted.
- **Collapsible, navigable document layout** — every section is a
  collapsible card; the sticky outline rail highlights the section you're
  scrolled to and jumps to any of them in one click.
- **Light/dark theme and a comfortable/compact density toggle**, both in
  the header and persisted per-browser.
- Data persists to `~/pm-portal-data/projects/<project_id>/` as plain JSON —
  inspect or back it up directly, no database required.

## How to use it

1. **Create a project.** From the project list, click "New project," give it
   a name, and paste your raw notes into the notes field.
2. **Answer the clarifying questions.** If your notes leave anything
   ambiguous, you'll see a short round of questions (technical context comes
   first if it isn't already obvious from your notes). Answer what you can;
   leave the rest blank to accept the suggested default. A budget line shows
   how far along the conversation is ("Round 2 of up to 3"), earlier answers
   stay visible in a collapsible history, and the pipeline tracker shows
   which stage is running.
3. **Read the drafted spec.** You land on the Spec tab, rendered as a
   document: title, user stories (with priority and acceptance scenarios),
   edge cases, functional requirements (functional vs. non-functional,
   toggle by clicking the badge), key entities, success criteria, and
   assumptions. Click any block to fix it in place, or switch the whole
   page to Edit mode to restructure freely — everything autosaves as you
   go.
4. **Check the Architecture and Epics sections** — the outline rail flags
   them with a dot while decisions are still `proposed` or imported stories
   carry unresolved notes. Accept or edit the proposed architecture
   decisions. Review the epics' `high`/`medium`/`low` impact scores and
   click an impact badge if you disagree with the agent's call — the list
   re-sorts to keep the highest-impact epics on top.
5. **Edit the spec and click "Regenerate"** on the Architecture or Epics
   section any time your stories or requirements change — each regenerates
   independently without touching the other.
6. **Generate diagrams** (Diagrams section) if a user journey or sequence
   diagram would help — one click each, viewable and copyable immediately.
7. **Switch to the Comms tab** when you need to communicate the spec: add
   people to the Stakeholders section, keep the Glossary current, then
   generate an executive, engineering, or sales brief. Regenerating a brief
   replaces the previous one for that audience, and a stale brief tells you
   the spec has changed since it was written.
8. **Push to Jira** (if configured) from the Jira menu on the Epics
   section, once your epics and stories are in the shape you want. Confirm
   what will be created, then push — safe to repeat, it skips anything
   already pushed. Already have epics in Jira? "Import from Jira" (same
   menu) pulls them in and has the Enrichment Agent clean them up against
   your spec.
9. **Keep status current** by clicking "Sync status" on the Epics section
   periodically — it pulls real Jira status for anything pushed or
   imported, and feeds the section's Done / In Progress / To Do bar.
10. **Compose a recurring update** from the Updates section (Comms tab):
    pick the baseline from the named version timeline ("pushed to Jira",
    "brief generated", …), pick an audience, preview the change list, and
    generate the update. Copy it, export it, or check version history any
    time.
11. **Export** the spec (Markdown/.docx/.csv) from the top action bar,
    export any individual diagram/brief/update from its own section, or
    copy a brief/update as Markdown straight to your clipboard.

## Structure

```
backend/app/spec_builder/   FastAPI + PydanticAI (extraction -> clarify -> generation ->
                             architecture -> epics, plus diagram/brief/update/enrichment
                             agents) -- an ordinary package, imported and mounted at /pm
                             by backend/app/main.py, not run standalone
frontend/src/features/spec-builder/   Studio's own React app for this tool
```

Provider-agnostic model config: `AIPM_MODEL=anthropic:claude-sonnet-5` or
`AIPM_MODEL=openai:gpt-5` (or any other pydantic-ai-supported provider
string) — set once in `backend/.env`, no code changes.

## History

Originally built as a standalone app
([`vinayak99-ai/aipm`](https://github.com/vinayak99-ai/aipm)), then merged
into Studio as native code in two passes: first vendored in and run as a
second mounted FastAPI app + separate frontend build, then folded all the way
down into one backend package (`backend/app/spec_builder/`, ordinary relative
imports, no `sys.path` tricks) and one shared `backend/.env` alongside
Flowchart Builder's own vars. A few decisions from that process are still
worth knowing:

- **CORS**: `backend/app/main.py`'s outer `CORSMiddleware` wraps the whole
  app including the `/pm` mount, so both it and Spec Builder's own inner
  `CORSMiddleware` (`backend/app/spec_builder/main.py`) need to allow
  whichever origin the frontend actually loaded from — `localhost` and
  `127.0.0.1` are different origins to a browser, so both are allowlisted in
  both layers.
- **Design tokens**: the shadcn component library's CSS custom properties
  were merged into Studio's own `frontend/src/index.css`, *except*
  `--primary`/`--accent` (and their `@theme inline` mappings) — those two
  names already existed in Studio's own token set (`--color-primary`,
  `--color-accent`, swapped at runtime by `lib/themes.ts`), so every shadcn
  component's `bg-primary`/`text-primary`/`bg-accent`/etc. resolves through
  Studio's actual brand color instead of shadcn's default grayscale, without
  editing any component. `--primary-foreground`/`--accent-foreground` are
  pinned to a constant value in both light and dark (rather than flipping
  the way upstream shadcn's do), since they're paired with a fixed saturated
  brand color, not a gray that itself flips.

## Known gaps (not implemented)

The full, prioritized defect and risk review lives in
**[`KNOWN-ISSUES.md`](KNOWN-ISSUES.md)** — including data-safety
items (non-atomic file writes, last-writer-wins concurrent saves,
unvalidated path ids) and engineering debt (no committed test suite,
unpinned dependencies). The most visible functional gaps:

- No streamed token output and no cancel during generation — the stage
  tracker shows which agent is running, but a slow run can't be aborted.
- Raw notes are write-once: after generation there's no way to view or
  refine the original input and regenerate the whole spec (only the
  Architecture and Epics sections regenerate). The backend's
  `regenerate-section` endpoint also has no UI yet.
- One artifact per project — the UI always opens the project's first spec.
- Single global CORS allowlist (`localhost:3000`/`localhost:5173`) and no
  authentication — strictly a localhost tool; don't expose the port.
- Jira push targets one project (`JIRA_PROJECT_KEY`) — no per-push project
  picker.
- Epic↔Story linking (both push and import) tries Jira's modern `parent`
  field first (works for team-managed/next-gen projects), falling back to a
  discovered "Epic Link" custom field for company-managed/classic projects.
  This covers the common cases but isn't guaranteed across every Jira
  configuration — if both fail, the push surfaces Jira's raw error rather
  than guessing further.
- Import is capped at 200 issues per project (one JQL search, no
  pagination) — fine for typical projects, not exhaustive for very large
  ones.
- No full RICE/ICE/WSJF prioritization scoring (reach, effort, confidence as
  separate numeric inputs) — the coarse high/medium/low business-impact
  score is the current implementation; a fuller framework would need inputs
  (team capacity, reach estimates) this tool doesn't collect yet.

## More documentation

- **[`KNOWN-ISSUES.md`](KNOWN-ISSUES.md)** — the critical review:
  data-safety risks, product gaps, engineering debt, and the accepted
  security trade-offs of the local-first design. Every item is tagged
  🔴 POC-relevant (worth fixing now) or ⚪ later (safe to defer until this
  has real users or leaves localhost), with a priority order for each.
- **[`UX-PROPOSAL.md`](UX-PROPOSAL.md)** — the screen-by-screen
  UX review and five-phase redesign proposal (now shipped; kept as the
  rationale of record).
- **[`FUTURE-VISION.md`](FUTURE-VISION.md)** — the forward
  roadmap: what could be built next, organized by product pillar.
