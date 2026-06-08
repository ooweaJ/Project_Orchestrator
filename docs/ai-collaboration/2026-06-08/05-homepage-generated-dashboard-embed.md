# Homepage Embedded HTML Dashboard

## Goal

Make the generated `docs/orchestration/index.html` visible from the main Project Orchestrator homepage.

## Work Performed

- Added `GET /api/projects/:id/orchestration-dashboard` to serve a registered project's generated orchestration HTML.
- Added an `HTML 대시보드` panel to the selected project detail view.
- Added a `새 창` link for opening the generated HTML directly.
- Styled the embedded frame so the generated cards can be read inside the homepage.

## Problem Encountered

- The running dev server was still using the previous server code, so the new endpoint initially returned `Cannot GET`.
- Browser visual QA tooling was unavailable in this session, and adding a new browser test dependency would be larger than this task.

## Resolution

- Restarted only the existing local dev server process on port `4317`.
- Verified with production build and HTTP responses instead of adding a new visual test dependency.

## Result

- The homepage can now show the selected project's generated orchestration card dashboard.
- LETHE_Prototype's generated orchestration HTML is available through the central orchestrator API.

## Verification

- `npm run build`
- `GET /api/projects/lethe-prototype/orchestration-dashboard` returned `200 OK`.
- `GET http://127.0.0.1:5173` returned `200 OK`.

## Next Task

Add a homepage action to regenerate the selected project's orchestration HTML before viewing it.
