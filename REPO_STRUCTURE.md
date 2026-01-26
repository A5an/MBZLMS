# Repo Layout (30–60s tour)

- `index.tsx` → bootstraps React (`ReactDOM.createRoot`) and mounts `<App />` inside `StrictMode`.
- `App.tsx` → glassy home canvas: responsive `react-grid-layout`, header controls, mobile warning, and a footer badge; toggles edit mode for the widgets.
  - Widgets are wired through `components/widgets/*` so the layout stays modular and draggable.
  - Background textures (images, noise, blur) live inline to keep the premium demo feeling.
- `graph.tsx` → standalone knowledge-graph scene with layered canvas (dot grid, noise), D3-powered data generation, and a drift/zoom instrument panel for the graph view.

- `components/`
  - `Header.tsx` → persistent nav row with graph toggle, search, date pill, notifications, and avatar combo.
  - `graphs/` → reusable chart primitives (used by widgets like `KnowledgeGraphWidget`).
  - `widgets/` → each file (e.g., `ProfileWidget.tsx`, `AssignmentsWidget.tsx`, `KnowledgeGraphWidget.tsx`, etc.) is a self-contained card showing a slice of student data (progress, notes, calendar events, briefs, clubs, courses, etc.).

- `services/`
  - `geminiService.ts` → helper that spins up a `GoogleGenAI` client from `@google/genai`, fetches the knowledge graph structure, and generates daily briefs with fallback text.

- `types.ts` → shared TypeScript interfaces for courses, assignments, calendar events, and the D3 graph (`GraphNode`, `GraphLink`, `GraphData`), plus the shapes that widgets consume.
- `public/` → static assets (SVG renders, fonts, favicons) referenced from the demo surfaces — treat this as literal “glass-grade” visuals.
- `docs/` → narrative/supporting material (ignored for commits unless asked, per AGENTS.md).

Above structure balances entry points, reusable visuals, and service tooling while staying light enough for a quick read.
