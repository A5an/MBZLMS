# MBZUAI LMS — Agent Guidelines

## A) Project Identity + Goals
- **Context**: Student-built LMS for MBZUAI, intended to replace the Moodle experience with a modern, AI-powered platform.
- **Demo Goal**: Deliver a “University OS” experience for the Feb 3 demo.
- **Non‑negotiable**: Aesthetics and Apple/iCloud-style UI are mandatory. Every surface must feel premium.

## B) Design Code — Apple/iCloud Demo Mode
- **Layout density**: Spacious, breathable layouts. Avoid cramped grids; use generous padding and clean negative space.
- **Spacing system**: Stick to consistent increments (e.g., 4/8/12/16/24/32). Avoid arbitrary margins.
- **Typography hierarchy**:
  - Titles: clean, bold (600–700), tight tracking.
  - Subtitles/metadata: smaller, medium weight, subtle opacity.
  - Use restrained uppercase for labels only.
- **Glass/fluid surfaces**:
  - Use soft translucency + blur (glassmorphism) with subtle borders.
  - Avoid heavy drop shadows; keep shadows wide and soft.
- **Interaction style**:
  - Hover: subtle lift/brightness, no harsh color shifts.
  - Press: micro-scale down (0.98–0.99) with smooth easing.
  - Focus: unobtrusive highlights; never neon or loud.
  - Motion: gentle, eased transitions (500–800ms) to feel fluid.
- **Component rules**:
  - Consistent corner radius across widgets (large, iOS-like).
  - Subdued borders; avoid sharp contrast edges.
  - Blurs and shadows should be consistent and aligned with existing tokens.
- **Don’ts**:
  - No cluttered layouts, no mismatched styles.
  - No harsh chart themes or default library visuals.
  - No loud colors without glass/softening.

## C) Architecture + Repo Structure
- **Top-level**: Vite + React app (single-page) with Tailwind-style utility classes.
- **Key files**:
  - `App.tsx` — Main home layout with grid-based widgets.
  - `components/` — Shared UI building blocks.
  - `components/widgets/` — Widget modules used in the home grid.
  - `services/` — API/AI services (e.g., Gemini).
  - `types.ts` — Shared data types.
- **State management**: Local React state (`useState`, `useEffect`) in components.
- **Data model**: Demo uses mock data in widgets; live integrations are not required for the demo.

## D) Demo Scope + Priorities (Mirrors TODO.md)
- **P0 (Must ship)**: Visual polish, liquid glass styling, drag/drop home layout, priority notifications, and demo-day events. These are essential for the Feb 3 demo narrative.
- **P1 (Nice-to-have)**: Enhanced graph content/visuals, guest lecture previews, integration exploration (Microsoft calendar/Teams), and rapid iteration tooling. These improve the wow factor but aren’t demo blockers.
- **P2 (Post-demo/Experimental)**: Integrations and new modules (finance club, library, collaboration, mobile apps). These are exploratory and can wait.

## E) Notion Link
- Source of truth: https://www.notion.so/MBZUAI-LMS-2e73a39cba378066a744dcc8548477bb?source=copy_link

## F) Update Check Behavior
- **Notion cannot be fetched automatically here; update manually by pasting new content.**

## G) Push Token Usage
- Use the token `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` only if the user explicitly asks to push after work; otherwise, do not push.

## H) Docs Changes Policy
- Ignore local changes under `docs/` when pulling or pushing.
- Do not include `docs/` changes in commits unless explicitly requested.
