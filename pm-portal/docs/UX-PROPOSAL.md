# UI/UX Review & Proposal

*A design review of the AI PM Portal, and the proposal for its UI/UX
investment. Written against the then-current frontend (`frontend/src/`) —
every observation references the actual component it's about. It complements
`FUTURE-VISION.md`'s experience-layer section by going one level deeper:
screen by screen, flow by flow, with specific recommendations and a
suggested build order.*

> **Status: phases 1–5 shipped.** All five phases of §4's build order were
> implemented (commits `89ae53d`, `6b1b2d2`, `8a10301`, `79c607f`,
> `6f256ba`): dirty-guard/undo/skeletons/⌘S + epic status bar; autosave +
> version-timeline picker + staleness stamps; read mode with click-to-edit
> blocks; the Spec/Comms tab split with outline attention markers; and the
> workflow polish batch (Jira menu, clarify progress + history, copy
> buttons, status-bearing project cards, onboarding empty state, density
> toggle). Deliberately **not** shipped from this proposal, still open:
> streamed generation output and cancellability (§2.2/§2.4), the seeded
> example project (§2.1 — the explanatory empty state shipped without it),
> the FLIP reorder animation (§2.5 — the sort legend shipped instead),
> number-key answers in clarify (§2.3 — Enter-to-submit shipped),
> brief-badge hover↔rationale linking (§2.6), the ⌘K command palette
> (deferred per §5 until the PM Copilot exists), the full WCAG-AA/ARIA
> audit, and responsive read-only layouts. The sections below are kept as
> written, as the rationale of record for what was built.

---

## 1. Who the user is, and what mode they're in

Everything in this review follows from one observation: **a PM using this
tool is in one of four modes**, and the current UI serves them unevenly.

| Mode | How often | How well the UI serves it today |
|---|---|---|
| **Creating** — notes in, spec out | Once per project | Well. The notes → clarify → generate flow is the most polished path in the app. |
| **Reading** — reviewing what the agents produced, re-reading before a meeting | Constantly | Poorly. Everything renders as form fields; there is no reading view. |
| **Editing** — correcting a story, accepting an ADR, re-scoring an epic | Often, but in small bursts | Adequately. Everything is editable, but editing is the *only* mode, which is why reading suffers. |
| **Communicating** — generating briefs, composing updates, pushing to Jira | Weekly-ish | Functionally complete, but buried at the bottom of one long page with no workflow framing. |

The single biggest theme of this proposal: **make reading the default mode
and editing a gesture away**, then give the communicating mode its own home.

---

## 2. Screen-by-screen review

### 2.1 Project list (`ProjectList.tsx`)

**What works:** clean card list, in-place rename with keyboard support
(Enter/Escape), a real confirm dialog for delete, hover affordance for
navigation.

**What doesn't:**

- **Cards carry almost no information** — a name and an "updated" timestamp.
  A PM with six projects can't tell which one has unanswered clarifications,
  which has un-pushed epics, or which spec changed since they last looked.
  The data for all of this already exists in each project's artifact.
- **The empty state is a dead end** — one sentence of muted text. A first-run
  user learns nothing about what the tool produces.

**Proposals:**

1. **Status-bearing project cards.** Each card gains a compact status row:
   spec stage (`clarifying · N questions waiting` / `drafted` / `in Jira`),
   epic count with the high-impact count called out (`5 epics · 2 high
   impact`), a `proposed ADRs: N` chip when unratified decisions are waiting,
   and last-version reason ("pushed to Jira, 2d ago") instead of a bare
   timestamp. The card becomes a to-do surface, not a filename.
2. **A real empty state**: a short illustrated panel — "Paste raw notes,
   answer a few questions, get a full spec" with the three stages drawn —
   plus a "Try an example" button that seeds a demo project (FUTURE-VISION's
   first-run onboarding item; the seed can be a checked-in JSON artifact,
   zero agent calls).
3. **Sort/filter once the list grows**: most-recently-updated first (already
   implicit), with a text filter appearing above the list at ≥8 projects.

### 2.2 New project (`NewProject.tsx`)

**What works:** minimal fields, honest placeholder copy, pipeline progress
appears in place, API-key failure message tells you exactly what to fix.

**What doesn't:**

- **The notes box undersells the input.** "Paste whatever you have" is the
  right promise, but a bare 12-row textarea doesn't communicate that more
  input = better output, or what kinds of input work (Slack threads, meeting
  notes, voice-note transcripts).
- **Cancel mid-generation isn't possible** — the Cancel button disables the
  moment generation starts, exactly when a user who pasted the wrong notes
  wants it most. (Backend cancellation is future work; the UI shouldn't
  pretend otherwise by graying the button.)

**Proposals:**

1. **Input guidance under the textarea**: one muted line — "Works best with
   2+ paragraphs. Meeting notes, Slack threads, and braindumps are all fine;
   the agents will ask about anything they can't infer." Cheap, and directly
   improves output quality by improving input.
2. **Character-count-based encouragement** (not a hard limit): below ~200
   chars, show "Short notes are fine — expect more clarifying questions."
   This sets expectations for the clarify round instead of surprising users.
3. **Honest cancel**: while generation streams, keep Cancel enabled and have
   it abandon the *navigation* (return to list; the project remains, and
   reopening resumes clarification — the resume path already exists). Label
   it "Leave — generation continues" so it's not a lie.

### 2.3 Clarify flow (`ClarifyQuestions.tsx`)

This is the app's best interaction design — option chips with a starred
recommendation, blank-means-default, rounds framed conversationally ("One
more thing"). Keep all of it.

**Gaps:**

- **No sense of progress across rounds.** Round 2 of 3 looks identical to
  round 1; the user can't tell if they're nearly done. The backend caps
  rounds at 3 and questions at 8 — surface that budget.
- **Answered questions vanish.** Once a round is submitted there's no way to
  see what you said, even though those answers become authoritative input to
  the spec.

**Proposals:**

1. **Round progress header**: "Round 2 of up to 3 · 5 of 8 questions used" —
   the caps are already constants in the backend; expose them in the
   response.
2. **A collapsed "Previously answered" section** above the current round,
   read-only, so the conversation has visible memory. (The answers are
   persisted server-side already; this is display only.)
3. **Answer-with-keyboard**: number keys 1–9 select option chips, Enter
   submits the round. The clarify flow is the most repetitive interaction in
   the app; it should be the fastest.

### 2.4 The spec page (`ProjectDetail.tsx`) — the core problem

One route renders *everything*: overview, stories, edge cases, requirements,
entities, criteria, assumptions, ADRs, epics, stakeholders, glossary,
briefs, updates, diagrams — 14 sections in a single scroll column, every
field an always-editable input.

**What works:** the outline rail (scroll-spy + jump), collapsible sections,
the sticky action bar, section-level Regenerate buttons, click-to-toggle
badges (FR kind, epic impact, ADR status) — the "classification edits are
one click" pattern is genuinely good and should be extended, not replaced.

**What doesn't:**

1. **The wall of inputs.** `UserStoryCard` renders five labeled inputs per
   story; a 6-story spec is ~30 form fields before you reach requirements.
   Reading a spec — the most common activity — means reading *through form
   chrome*: labels, borders, focus rings. The exports (Markdown/.docx) are
   more pleasant to read than the app that produced them. That's the tell.
2. **Two products share one page.** Sections 1–9 are *the spec* (the
   document). Sections 10–14 (stakeholders, glossary, briefs, updates,
   diagrams) are *about* the spec — audiences, memory, projections. Mixing
   them makes the document feel endless and buries the communication
   workflow at scroll position ~8,000px.
3. **Explicit save with silent loss.** Edits live only in React state until
   the Save button is clicked. Navigating back loses them without warning —
   there's no dirty-state guard, no autosave, no undo.
4. **The title is an `<Input>` at the top** — the one field that should feel
   like a document heading feels like a form field, setting the tone for
   everything below it.

**Proposals — this is the heart of the document:**

#### A. Read mode by default, edit-in-place on demand

- Render every section as **formatted document content**: story titles as
  headings with priority/impact badges inline, descriptions and rationale
  as prose, acceptance scenarios as styled Given/When/Then lines,
  requirements as an `FR-001 [functional] The system MUST…` list. Use the
  Markdown export's structure as the layout spec — it already encodes the
  right reading order.
- **Click any block to edit it in place** (block = one story, one FR, one
  ADR…): the block swaps to today's input cluster, gains a subtle ring, and
  returns to prose on blur or Escape. Today's components become the *edit
  state* of each block rather than the only state — this is a rearrangement,
  not a rewrite.
- Keep the click-to-cycle badges working in **both** modes — they're already
  the ideal micro-edit and shouldn't require entering edit state.
- A global **Read / Edit toggle** in the sticky bar for users who want
  everything editable at once (today's behavior remains one click away).

#### B. Split the page into two tabs: **Spec** and **Comms**

- **Spec** tab: overview through epics — the document and its structure.
- **Comms** tab: stakeholders, glossary, briefs, updates — the audience
  layer, framed as a workflow: *who cares (registry) → shared language
  (glossary) → snapshot for them (briefs) → what changed for them
  (updates)*. Diagrams sit in Spec (they're content), with their export
  alongside.
- The outline rail becomes per-tab and gets **attention markers**: a dot on
  Architecture when ADRs are `proposed`, on Epics when enrichment notes are
  unresolved, on Updates when the diff since the last composed update is
  non-empty. The rail graduates from navigation to a readiness scorecard
  (this is FUTURE-VISION's "completeness markers" row, made concrete).

#### C. Kill silent data loss

- **Debounced autosave** (~2s after last keystroke) with a live indicator in
  the sticky bar: `Saved · just now` / `Saving…` / `Unsaved changes`.
  Versioning already dedupes identical saves server-side, so autosave won't
  spam history; frequent snapshots make the version timeline *more* useful.
- Until autosave lands, ship the 20-line interim fix: a **dirty-state guard**
  ("You have unsaved changes — save before leaving?") on back-navigation.
- **Undo for destructive block actions**: deleting a story/FR/epic shows a
  toast with an Undo button (10s window) instead of relying on version
  history archaeology.

#### D. Make the title a title

Render `prd.title` as an `<h1>`; click to edit. Two lines under it: project
name · version count · last save reason. The document finally looks like a
document from the first pixel.

### 2.5 Epics & Jira (`EpicsSection.tsx`)

**What works:** impact-sorted display, impact badge cycling, per-item Jira
push results with links, status badges, safe re-push.

**Gaps & proposals:**

1. **The Jira buttons are peers when they're not.** Push / Import / Sync
   status sit in one row with equal weight. Sync is routine (do it often);
   push and import are structural (do them once or twice). Proposal: keep
   **Sync status** as the primary standalone button once links exist, and
   fold Push/Import into a small "Jira ▾" menu.
2. **Impact rationale reads as an afterthought** — an italic muted line.
   Since the rationale is the *evidence* for the score (the whole point of
   the feature), render it as a quiet quote block attached to the badge:
   hovering the badge highlights it, clicking the badge to override shows
   "overridden by you" in place of the agent's rationale until the next
   regenerate.
3. **Sorted display needs a legend.** Epics visibly reorder when a badge is
   cycled, which reads as a glitch the first time. One muted line at the top
   of the section — "Sorted by business impact · ids unchanged" — plus a
   brief FLIP animation on reorder turns the surprise into feedback.
4. **Status at a glance:** a small stacked bar at the top of the section
   (`3 Done · 2 In Progress · 4 To Do · 3 not in Jira`) computed from
   existing `jira_status` fields. Zero new data, instant delivery snapshot —
   and it doubles as the visual anchor the Sync button updates.

### 2.6 Briefs & Updates (`BriefsSection.tsx`, `UpdatesSection.tsx`)

**What works:** audience framing, the diff-preview-before-compose flow,
document-style rendering of results (notably: these are the only two places
in the app where agent output is displayed as a *document* — evidence for
proposal 2.4-A).

**Gaps & proposals:**

1. **No staleness signal.** A brief generated at v4 renders identically at
   v9. Stamp each brief/update with its source version (already stored) and
   show "based on v4 — spec is now v9 (view diff · regenerate)" when
   they diverge. The diff endpoint already answers "what changed since v4."
2. **Compose flow asks for a version number** — a PM thinks "since the exec
   review," not "since v6." Render the baseline picker as the version
   *timeline* (reason + date per entry, which persistence already stores),
   newest first, so picking a baseline is picking a named event.
3. **Copy-to-clipboard** on every brief/update in Markdown and rich-text
   flavors. The most common delivery is paste-into-Slack/email, currently
   served only by file download.

### 2.7 App-wide

1. **Loading states**: "Loading…" text swaps to skeleton cards (list page:
   3 card ghosts; spec page: outline ghost + 4 section ghosts). Perceived
   speed, one afternoon of work.
2. **Keyboard layer**: `⌘S` save, `⌘E` toggle read/edit, `[`/`]` collapse/
   expand all sections, `⌘K` command palette as the eventual umbrella (per
   FUTURE-VISION) — but `⌘S` alone removes the most common save-loss path
   and ships in minutes.
3. **Focus & ARIA pass** on the custom interactive elements — the badge
   toggles (`role="button"` spans in `EpicsSection`/`IdentifiedList`), the
   Section collapse chevron, and the option chips in clarify. Most already
   have partial keyboard support; finish it and add visible focus rings.
4. **Density toggle** (comfortable/compact) in the header next to the theme
   switch — long specs at compact density fit ~40% more content per screen.

---

## 3. What NOT to change

Explicitly keeping (these are working and load-bearing):

- **The clarify flow's interaction model** — chips, starred recommendations,
  blank-means-default, conversational rounds. Best-in-app; extend, don't
  redesign.
- **Click-to-cycle badges for classifications** (FR kind, epic impact, ADR
  status) — the propose→ratify model at its friction minimum.
- **The outline rail + collapsible Section primitive** — both proposals in
  §2.4 build *on* them, not around them.
- **Toast + AlertDialog patterns** — extend to new surfaces as-is.
- **Local-first, no auth, no realtime** — every proposal above is
  client-side rendering + existing endpoints; nothing requires a server
  architecture change.

---

## 4. Suggested build order

Sequenced for user-visible payoff per unit of implementation risk. Each
phase is shippable alone.

| Phase | Contents | Why this order |
|---|---|---|
| **1 — Stop the bleeding** | Dirty-state guard, `⌘S`, delete-undo toasts, skeleton loaders, epic-sort legend + status bar | Data-loss and trust fixes; days, not weeks; zero design risk. |
| **2 — Autosave + version timeline picker** | Debounced autosave with saved-state indicator; baseline picker in Updates becomes the named-version timeline; brief/update staleness stamps | Builds directly on shipped versioning; makes history a feature users touch. |
| **3 — Read mode** | Document-rendered blocks with click-to-edit, title as `<h1>`, global Read/Edit toggle | The single biggest experiential upgrade; phases 1–2 made it safe (no edit can be lost while modes switch). |
| **4 — Spec / Comms split** | Two tabs, per-tab outline rail, attention markers on the rail | Restructures navigation *after* the content inside it is worth reading. |
| **5 — Workflow polish** | Jira menu consolidation, clarify round-progress + previous answers, copy-to-clipboard, project-card status rows, empty-state onboarding, density toggle, ARIA pass | Independent, parallelizable, each a self-contained PR. |

Phases 1–2 are pure additive engineering. Phase 3 is the only one needing
visual design decisions (type scale, block hover affordances) — worth a
lightweight mockup pass before building. Phases 4–5 reuse everything the
earlier phases establish.

---

## 5. Open questions

- **Where does the command palette land?** Proposed here only as a keyboard
  umbrella (§2.7); genuinely valuable once the PM Copilot (FUTURE-VISION,
  cross-cutting #1) exists to receive natural-language commands. Suggest
  deferring until then rather than shipping an empty palette.
- **Should read mode be per-section or global?** This proposal says global
  toggle + per-block click-to-edit. An alternative is per-section edit
  buttons; rejected here because block-level editing matches how PMs
  actually correct specs (one story at a time), but worth revisiting after
  phase 3 dogfooding.
- **Diagrams in Spec or Comms?** Placed in Spec above (they're generated
  *from* spec content), but journey diagrams are arguably a communication
  artifact. Cheap to move later; flagging the ambiguity now.
