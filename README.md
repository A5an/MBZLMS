<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Nu3lk_bt_siQPIXG_gCly1u5lmCF6Jto

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Why You See a White Screen

Opening `index.html` directly in the browser uses `file://`, which blocks module scripts like `/index.tsx` (CORS) and won’t compile TSX. Run via Vite (`npm run dev`) instead.

## Deploy to GitHub Pages (docs/ on main)

1. Build:
   `npm run build`
2. Commit + push the generated `docs/` folder.
3. In GitHub: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `master` / Folder: `docs`
