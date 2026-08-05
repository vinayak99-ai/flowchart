# Flowchart Studio

A local web app that turns source material + a prompt into an interactive, editable
flowchart. An OpenAI-backed FastAPI service derives structured diagram data (nodes,
edges, groups); the React frontend lays it out with elkjs, renders it with React Flow,
and themes it with Tailwind CSS. Editing, layout, and export to PNG/PDF all happen
client-side.

See [`docs/architecture.md`](docs/architecture.md) for the full architecture and data flow.

## Project layout

```
backend/    FastAPI service (LLM calls + structural validation only)
frontend/   React + Vite app (layout, rendering, theming, editing, export)
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
   - **Theme**: swaps the entire app's color palette at runtime (top nav, buttons,
     node/edge colors, PPTX export) via CSS custom properties — not just the
     canvas.
   - **Snap to grid**: constrains dragged node positions to a 16px grid.
6. Export the current diagram to PNG or PDF client-side via the toolbar. **Export
   PPTX** is only enabled on the Compact (16:9) layout, since that's the one
   guaranteed to fit a single slide — it generates a native, editable PowerPoint
   file (PowerPoint's own Flowchart autoshapes, not a picture) via `pptxgenjs`,
   using the currently selected theme's colors.
