# Headless end-to-end drivers

Playwright scripts that drive the real game in headless Chromium (GPU flags
`--ignore-gpu-blocklist --enable-webgl --use-angle=d3d11` on Windows). They need
`playwright` installed (`npm i -D playwright` somewhere on the resolution path) and
the dev server running (`npx --yes pnpm@9.9.0 exec airjam dev`, port 5173).

| Script | Checks |
|---|---|
| `match-test.mjs`, `goal-test.mjs`, `end-test.mjs` | Harness page: 2-6 player matches, goal / celebration / kickoff, full-time and rematch |
| `bot-test.mjs` | Bot fill (neural 1v1, scripted otherwise) |
| `perf-cam-test.mjs` | Frame rate with 6 views, camera behaviour |
| `qa-test.mjs` | Full-size host + one page per phone; screenshots, haptics, downlink readouts |
| `tuning-goal-test.mjs` | Event-mode timings (fast kickoff, short celebration) |
| `join-leave-test.mjs` | Mid-match join, drop and rejoin |
| `touch-test.mjs` | REAL multitouch through CDP touch events (run after editing `src/controller/`) |
| `serve-dist.mjs` | Tiny static server for checking a production build |
