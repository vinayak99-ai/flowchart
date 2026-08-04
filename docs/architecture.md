# Architecture: LLM-Assisted Flowchart Generator (Local Web App)

## Overview

A local web app that takes source material + a prompt, uses the OpenAI API (via a small
Python backend) to derive a structured flowchart/journey model, and renders and themes
that diagram entirely in the React frontend — live, interactive, and editable — with
export to PNG/PDF.

## Architecture

```
React frontend
  ├─ elkjs        — computes node/edge layout (positions) from structured diagram data
  ├─ React Flow    — renders nodes/edges as an interactive canvas (pan, zoom, edit)
  ├─ Tailwind CSS  — theming (node/edge styles via a theme map, keyed by node/edge type)
  └─ client-side export — SVG/canvas → PNG/PDF
        │
        │  WebSocket / REST
        ▼
Python backend (FastAPI) — thin, LLM-only
  ├─ Holds OpenAI API key (never exposed to browser)
  ├─ Sends material + prompt to OpenAI → structured JSON (nodes, edges, groups)
  └─ Runs structural validation on the returned JSON (schema, orphan nodes, cycles)
        │
        ▼
OpenAI API
```

Rendering, layout, theming, and export all happen client-side now — the backend's only
job is producing and validating the structured diagram data.

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend framework | React |
| Diagram layout | elkjs (in-browser port of the ELK layout engine — same large-graph auto-layout quality as before, no install) |
| Diagram rendering/interaction | React Flow (canvas, pan/zoom, editable nodes) |
| Theming | Tailwind CSS — node/edge type mapped to a theme object of Tailwind classes |
| Export | Client-side SVG → PNG/PDF (e.g. `html-to-image` + `jsPDF`) |
| Backend | FastAPI (Python) — LLM calls + validation only |
| Frontend ↔ backend | WebSocket (live generation progress), REST (one-off requests) |
| LLM | OpenAI API, structured JSON output |
| Schema validation | `pydantic` (backend) |
| Graph integrity checks | `networkx` (backend) — orphan nodes, unintentional cycles |

## Data Flow

1. User uploads material + enters a prompt in the browser UI.
2. Frontend sends material + prompt to the FastAPI backend.
3. Backend calls OpenAI, requesting structured JSON (nodes, edges, groups) — not
   diagram syntax.
4. Backend validates the structure (schema conformance, orphan nodes, dangling edges,
   cycles) and returns the validated JSON to the frontend, streaming progress over
   WebSocket as it goes.
5. Frontend runs elkjs on the JSON to compute layout, then React Flow renders it live,
   styled via the Tailwind theme map.
6. User edits nodes/labels/layout interactively in the browser; re-styling or minor
   edits never touch the backend or the LLM — only regenerating content does.
7. On export, the frontend converts the rendered diagram to PNG/PDF client-side.
