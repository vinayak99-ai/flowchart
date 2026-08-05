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
  two-way Jira sync. This is [`vinayak99-ai/aipm`](https://github.com/vinayak99-ai/aipm)
  vendored into `pm-portal/` and embedded as a Studio tool — see
  [`pm-portal/README.md`](pm-portal/README.md) for what changed and its own setup, and
  [`pm-portal/docs/`](pm-portal/docs) for its full feature/known-issues docs.
- **Report Generator**, **Data Explorer** — placeholders for future tools that will share
  Flowchart Builder's export pipeline and data layer.

See [`docs/architecture.md`](docs/architecture.md) for the Flowchart Builder architecture
and data flow.

## Project layout

```
backend/      FastAPI service for Flowchart Builder (LLM calls + structural validation only)
frontend/     React + Vite app — the Studio shell (rail nav) plus Flowchart Builder
pm-portal/    Spec Builder (backend + frontend), vendored from vinayak99-ai/aipm
```

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then set OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

Environment variables (`backend/.env`):

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key (required) |
| `OPENAI_MODEL` | Model used for structured diagram generation (default `gpt-4o`) |
| `CORS_ORIGINS` | Comma-separated allowed origins (default `http://localhost:5173`) |

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # optional, defaults to http://localhost:8000
npm run dev
```

Then open http://localhost:5173. The backend must be running for generation and file
upload to work.

## Running everything together

Spec Builder is embedded via iframe rather than compiled into the Studio frontend
bundle — its shadcn/ui theme tokens (`--primary`, `--accent`, ...) collide by name with
Studio's own (`--color-primary`, `--color-accent`, ...), and reconciling that safely is
follow-up work, not something to paper over with a risky CSS merge. Practically, this
means running Studio's tool tabs each need their own process, four in total:

| Process | Command | Port |
|---|---|---|
| Flowchart backend | `cd backend && uvicorn app.main:app --reload --port 8000` | 8000 |
| Studio frontend | `cd frontend && npm run dev` | 5173 |
| Spec Builder backend | `cd pm-portal/backend && uvicorn main:app --reload --port 8001` | 8001 |
| Spec Builder frontend | `cd pm-portal/frontend && npm run dev` | 5174 |

Each needs its own env file set up first — see that piece's setup section above
(Flowchart backend/frontend) or [`pm-portal/README.md`](pm-portal/README.md) (Spec
Builder, needs an Anthropic or OpenAI key, separate from Flowchart Builder's OpenAI key).
Open Studio at http://localhost:5173 once all four are running; the Spec Builder tab
won't load until its own two processes are up.

## How it works

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
     node/edge colors, PPTX export) via CSS custom properties — not just the
     canvas.
   - **Snap to grid**: constrains dragged node positions to a 16px grid.
6. Export the current diagram to PNG or PDF client-side via the toolbar. **Export
   PPTX** is only enabled on the Compact (16:9) layout, since that's the one
   guaranteed to fit a single slide — it generates a native, editable PowerPoint
   file (PowerPoint's own Flowchart autoshapes, not a picture) via `pptxgenjs`,
   using the currently selected theme's colors.
