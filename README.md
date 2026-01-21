# MBZUAI LMS

Student-built LMS demo for MBZUAI, designed as a "University OS" with a premium Apple/iCloud-style UI.

## Quick start

1. Install dependencies:
   `npm install`
2. Run the dev server:
   `npm run dev`

## Build

`npm run build`

## Preview production build

`npm run preview`

## Notes

- This is a Vite + React single-page app.
- Opening `index.html` directly uses `file://` and will not compile TSX. Use `npm run dev` instead.

## Deploy to GitHub Pages (docs/ on main)

1. Build:
   `npm run build`
2. Commit the generated `docs/` folder.
3. In GitHub: Settings -> Pages -> Build and deployment
   - Source: Deploy from a branch
   - Branch: master / Folder: docs
