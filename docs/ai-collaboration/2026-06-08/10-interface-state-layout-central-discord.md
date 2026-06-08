# Interface-State Layout And Central Discord

## Goal

Make AI Project Orchestrator match LETHE's current orchestration contract:

- human-facing HTML under `docs/orchestration/interface/`
- AI-facing Markdown under `docs/orchestration/state/`
- reports under `docs/orchestration/reports/YYYYMMDD/` and `units/`
- Discord sending handled centrally by AI Project Orchestrator

## Work Performed

- Updated HTML serving APIs to prefer:
  - `docs/orchestration/interface/index.html`
  - `docs/orchestration/interface/command.html`
  - `docs/orchestration/interface/runbook.html`
- Kept compatibility fallback for older root-level HTML files.
- Updated document scanning so `STATUS.md`, `CURRENT_TASK.md`, `NEXT_TASKS.md`, and `DECISION_LOG.md` resolve from `state/` first.
- Made report listing recursive so date folders and `units/*.html` appear in the homepage development journal.
- Extended `POST /api/projects/:id/discord-report`:
  - uses selected `reportPath` if provided
  - otherwise chooses the latest unit report
  - converts the report HTML into Discord embed fields
  - attaches the HTML report through the central orchestrator webhook flow
- Added a homepage `Discord 전송` button.
- Updated the dashboard generator to write generated HTML under `docs/orchestration/interface/`.

## Problem Encountered

The prior implementation still assumed root-level orchestration files and flat `reports/*.html`, while LETHE had physically migrated to the new layout.

## Resolution

Treat `interface/` and `state/` as the primary layout and keep root-level paths only as compatibility fallback.

## Verification

- `npm run build`
- `npm run orchestration:dashboard`
- `GET /api/projects/lethe-prototype/orchestration-dashboard`
- `GET /api/projects/lethe-prototype/orchestration-command`
- `GET /api/projects/lethe-prototype/orchestration-reports`
- `POST /api/projects/lethe-prototype/discord-report` with `dryRun: true`
- `GET /api/projects/lethe-prototype/snapshot`

## Result

AI Project Orchestrator can now read LETHE's current project-management interface and centrally prepare/send LETHE's latest HTML report to Discord.

## Next Task

Add a Discord dry-run preview panel in the homepage before actual send.
