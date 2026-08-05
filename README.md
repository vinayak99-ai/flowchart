# Studio

A local, multi-tool web workspace for product management. Studio's shell is a left icon
rail for switching between tools (see the `Rail` and `TOOLS` registry in
`frontend/src/lib/tools.ts`):

- **Flowchart Builder** — turns source material + a prompt into an interactive, editable
  flowchart: an OpenAI-backed FastAPI service derives structured diagram data (nodes,
  edges, groups); the React frontend lays it out with elkjs, renders it with React Flow,
  and themes it with Tailwind CSS. Editing, layout, and export all happen client-side.
- **Spec Builder** — turns raw notes into a structured spec (user stories, requirements,
  architecture decisions, Jira-ready epics), plus diagrams, stakeholder briefs, and a
  two-way Jira sync. Originally [`vinayak99-ai/aipm`](https://github.com/vinayak99-ai/aipm),
  now merged into Studio as native components and routes, not a separate app — see
  [`pm-portal/README.md`](pm-portal/README.md#merge-notes) for exactly what changed, and
  [`pm-portal/docs/`](pm-portal/docs) for its full feature/known-issues docs.
- **Report Generator**, **Data Explorer** — placeholders for future tools that will share
  Flowchart Builder's export pipeline and Spec Builder's project data.

See [`docs/architecture.md`](docs/architecture.md) for the Flowchart Builder architecture
and data flow.

## Project layout

```
backend/      Studio's one FastAPI process: Flowchart Builder's own routes (/api/*) plus
              Spec Builder's app mounted at /pm/* (see app/pm_portal_app.py)
frontend/     Studio's one React app: the rail-nav shell, Flowchart Builder, and Spec
              Builder (frontend/src/features/spec-builder/)
pm-portal/    Spec Builder's backend source (mounted into backend/, not run standalone)
              and its own docs; see pm-portal/README.md
```

## Backend setup

One process serves both Flowchart Builder's own routes and Spec Builder's (mounted at
`/pm`), so it needs both pieces' env files:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt      # includes Spec Builder's deps (pydantic-ai, jira)
cp .env.example .env                 # then set OPENAI_API_KEY (Flowchart Builder)
cd ../pm-portal
cp config/.env.example config/.env   # then set ANTHROPIC_API_KEY or OPENAI_API_KEY (Spec Builder)
cd ../backend
uvicorn app.main:app --reload --port 8000
```

Environment variables (`backend/.env`, Flowchart Builder):

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key (required) |
| `OPENAI_MODEL` | Model used for structured diagram generation (default `gpt-4o`) |
| `CORS_ORIGINS` | Comma-separated allowed origins (default covers `localhost`/`127.0.0.1:5173`) |

Spec Builder's own env vars (`pm-portal/config/.env`: `AIPM_MODEL`, `ANTHROPIC_API_KEY` /
`OPENAI_API_KEY`, optional `JIRA_*`) are documented in
[`pm-portal/README.md`](pm-portal/README.md#setup) — its API key is independent of
Flowchart Builder's `OPENAI_API_KEY` above, since it's a separate provider config even
when both happen to point at OpenAI.

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # optional, defaults already point at localhost:8000
npm run dev
```

Then open http://localhost:5173 — this is the whole app now, Flowchart Builder and
Spec Builder both, one process. The backend must be running (with both env files set up
above) for either tool to actually generate anything.

## Navigating Studio

The left rail is the only navigation — no separate menus per tool. Each icon is a tool
from the `TOOLS` registry (`frontend/src/lib/tools.ts`); a small dot marks the ones still
"Soon" (Report Generator, Data Explorer). The breadcrumb at the top ("Studio / Flowchart
Builder") just reflects whichever tool is active.

Switching tools doesn't unmount them — Flowchart Builder and Spec Builder both stay
mounted (just hidden) in the background, so an in-progress diagram or an unsaved edit in
a spec survives clicking to another tool and back. This matters more for Spec Builder,
which autosaves on a 2-second debounce: switching away mid-edit doesn't lose anything.

## Using Flowchart Builder

1. Paste source material or upload a `.txt`/`.md`/`.pdf`/`.docx` file, and enter a
   prompt describing the flowchart you want.
2. The frontend opens a WebSocket to the backend (`/api/ws/generate`), which calls
   OpenAI for structured JSON (nodes, edges, groups), validates it (schema, orphan
   nodes, dangling edges, cycles) with `pydantic` + `networkx`, and streams progress
   back.
3. The frontend runs `elkjs` to lay out the validated diagram and renders it with
   React Flow, themed via a Tailwind class map keyed by node/edge type.
4. Double-click a node label to rename it in place; drag nodes to adjust layout.
   These edits are local only — they never call the backend.
5. The gear icon above the canvas opens a settings panel that controls how the chart
   is actually built and rendered — nothing here is cosmetic-only:
   - **Layout algorithm**: `Flowchart` (elk `layered`, directional), `Tree` (elk
     `mrtree`), or `Compact (16:9)` (elk `rectpacking`, packed to a slide-shaped
     aspect ratio). Recomputes node positions via elkjs.
   - **Direction**: top-down or left-right, for the `Flowchart`/`Tree` algorithms
     (hidden for `Compact`, which has no directional notion).
   - **Edge style**: curved, straight, right-angle, or rounded right-angle —
     changes which React Flow path function renders each edge.
   - **Theme**: swaps the entire app's color palette at runtime (rail, buttons,
     node/edge colors, PPTX export, and Spec Builder's own shadcn components) via
     CSS custom properties — not just the canvas.
   - **Snap to grid**: constrains dragged node positions to a 16px grid.
6. Export the current diagram to PNG or PDF client-side via the toolbar. **Export
   PPTX** is only enabled on the Compact (16:9) layout, since that's the one
   guaranteed to fit a single slide — it generates a native, editable PowerPoint
   file (PowerPoint's own Flowchart autoshapes, not a picture) via `pptxgenjs`,
   using the currently selected theme's colors.

## Using Spec Builder

1. Click "New Project," name it, and paste raw notes — a brain-dump, a meeting recap,
   whatever you have.
2. If anything's ambiguous, answer a short round of clarifying questions (or leave one
   blank to accept its suggested default); otherwise it goes straight to drafting.
3. Read the generated spec: prioritized user stories with acceptance scenarios, edge
   cases, functional/non-functional requirements, key entities, and success criteria.
   Click any block to edit it in place — everything autosaves.
4. Review the Architecture Decisions and Epics sections the backend drafts alongside the
   spec (each independently regenerable), generate a user journey or sequence diagram
   from the spec on demand, and switch to the Comms tab to maintain stakeholders and
   generate an executive/engineering/sales brief.
5. If Jira is configured (`pm-portal/config/.env`), push epics and stories to a real
   project, import an existing one, or sync delivery status back in.

This is the condensed version — the full feature set (versioning, diffs, recurring
updates, glossary, known gaps) is documented in
[`pm-portal/README.md`](pm-portal/README.md#features).
