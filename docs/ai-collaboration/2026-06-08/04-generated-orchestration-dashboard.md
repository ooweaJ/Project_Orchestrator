# Generated Orchestration HTML Dashboard

Date: 2026-06-08

## Goal

Create a generated HTML view for each project's `docs/orchestration/` interface.

## Work Performed

- Added `scripts/build-orchestration-dashboard.mjs`.
- Added `npm run orchestration:dashboard`.
- Generated `docs/orchestration/index.html` from Markdown source files.
- Supported the current project, `--target`, and `--all` registered project modes.
- Built dashboard sections for current state, current task, next tasks, decisions, recent devlog, recent reports, commands, and source links.

## Problem Encountered

Markdown is the right source of truth, but reading several files manually is too slow for project management.

## Resolution

Keep Markdown as the source and generate a card-based HTML view for fast human reading.

## Result

Project_Orchestrator and LETHE_Prototype now have generated `docs/orchestration/index.html` dashboards.

## Verification

- `npm run orchestration:dashboard`
- `npm run orchestration:dashboard -- --all`
- Checked generated HTML for expected card sections.

## Next Task

Generate list pages for `docs/orchestration/reports/`, `devlog/`, and `evidence/`.
