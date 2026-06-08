# Project HTML Interface Split

## Goal

Align the generated HTML with the intended project interface contract.

## Work Performed

- Kept `docs/orchestration/index.html` as the project dashboard.
- Added `docs/orchestration/command.html` for the small next-instruction block shown above the command prompt.
- Added `docs/orchestration/runbook.html` for repeated operating procedures with short explanations.
- Reordered the homepage main flow to project dashboard, next instruction, command prompt, runbook, then collapsed interface checklist.
- Removed visible risk badges, the report block, and the document browser from the main operating flow.

## Problem Encountered

- The previous implementation treated orchestration documents as files to browse, but the intended direction is generated HTML interface pages inside each project.
- The running dev server needed a restart before the new HTML routes were available.

## Resolution

- Generated separate HTML interface pages in `docs/orchestration/`.
- Added API routes for `command.html` and `runbook.html`.
- Restarted only the existing local dev server process on port `4317`.

## Result

- LETHE_Prototype and Project_Orchestrator now receive the same generated interface page set.
- The homepage consumes those pages as a central operating surface.

## Verification

- `npm run build`
- `npm run orchestration:dashboard -- --all`
- `GET /api/projects/lethe-prototype/orchestration-dashboard` returned `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-command` returned `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-runbook` returned `200 OK`.

## Next Task

Formalize whether `reports/` is generated per day, per commit, or both.
