# LETHE HTML Template And Development Journal

## Goal

Use the current LETHE HTML dashboard as the reference format and make project reports browsable from the orchestrator homepage.

## Work Performed

- Added `docs/orchestration/templates/HTML_INTERFACE_TEMPLATE.md`.
- Updated `EXISTING_PROJECT_MIGRATION_PROMPT.md` to reference the template and preserve LETHE-compatible root HTML layout during adoption.
- Adjusted the dashboard generator toward the LETHE-style project dashboard format.
- Added generation of `docs/orchestration/reports/index.html`.
- Added API endpoints for listing and serving HTML reports from `docs/orchestration/reports/`.
- Added a homepage `개발일지` button that opens report files as selectable HTML cards.

## Problem Encountered

- The migration prompt had moved toward a future `interface/` and `state/` split, but the actual LETHE project still uses root-level `index.html`, `command.html`, and `runbook.html`.
- Report list labels were initially derived from file names and were less readable than the HTML titles.

## Resolution

- Documented the page-role contract separately from the folder name.
- Added compatibility guidance: preserve root-level LETHE layout unless the user explicitly asks to move it.
- Read `<title>` or `<h1>` from report HTML for better list labels.

## Result

- Other projects now have a clear LETHE-derived HTML template to follow.
- The homepage can show report HTML files like a development journal.

## Verification

- `npm run orchestration:dashboard`
- `npm run build`
- `GET /api/projects/lethe-prototype/orchestration-reports` returned `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-report?path=2026-06-08-08-plugin-oriented-migration-prompt-update.html` returned `200 OK`.

## Next Task

Apply this HTML template to another active project and confirm the report cadence.
