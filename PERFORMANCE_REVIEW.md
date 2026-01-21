# Performance Review

## Current state
- D3 force simulation runs in SVG/WebGL modes and updates positions every frame while alpha is active.
- SVG render uses a timer loop for floating motion plus active hover effects and label visibility updates.
- WebGL render updates link positions and colors every frame, and recalculates glow/core scale per node on each tick.
- Multiple glassmorphism layers use backdrop blur, translucent borders, and shadows across panels and cards.
- Backgrounds include animated canvas dots, grid textures, and noise overlays.

## Potential problems
- CPU pressure from per-frame D3 updates + animated backgrounds + DOM changes in SVG.
- GPU pressure from large transparent surfaces, blur filters, and soft glow effects (especially on integrated GPUs).
- SVG performance can degrade as node count grows due to many elements and filters.
- WebGL path still does a lot of CPU-side work (per-link buffer updates), which can bottleneck at scale.

## Devices likely to struggle
- Older laptops with integrated graphics (Intel HD 4000 class and below).
- Low-power ultrabooks when multiple glass surfaces are visible at once.
- Mobile devices (even higher-end phones) due to blur + canvas + WebGL workloads.
- Tablets with older Safari builds (backdrop-filter + SVG filters are costly).

## Possible improvements
- Pause or throttle the D3 simulation once alpha is low; resume only on interactions.
- Reduce per-frame work by caching link buffers and only updating on simulation ticks.
- Switch WebGL nodes/links to instanced rendering for larger graphs.
- Gate expensive effects (blur, glow, noise layers) behind a performance toggle or auto-detect.
- Reduce SVG filters on low-spec devices or provide a "lite" render mode.
- Migrate background animations to OffscreenCanvas where supported.

## Difficulty and tradeoffs
- Throttling simulation, gating blur/glow: low to medium effort, good payoff.
- Instanced WebGL rendering: high effort, would require refactoring node/link rendering.
- SVG -> Canvas or WebGL-only modes: high effort, larger architectural impact.
- Auto-detection of device performance: medium effort, needs careful tuning to avoid false positives.
