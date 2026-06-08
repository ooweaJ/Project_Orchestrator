# Current Task

## Task

Support the LETHE `interface/` + `state/` orchestration layout and central Discord report sending.

## Goal

- Read human-facing HTML from `docs/orchestration/interface/`.
- Read AI-facing state Markdown from `docs/orchestration/state/`.
- Keep compatibility with the older root-level `docs/orchestration/index.html`, `command.html`, `runbook.html`, and root Markdown files.
- Show nested report HTML from `docs/orchestration/reports/YYYYMMDD/` and `units/`.
- Let AI Project Orchestrator send a selected or latest project report to Discord using the central `.env` webhook.

## Done Criteria

- LETHE dashboard, command, and runbook APIs return the files under `interface/`.
- LETHE snapshot document summaries resolve to `state/*.md`.
- The report browser lists nested `reports/YYYYMMDD/units/*.html` files.
- Discord dry-run for LETHE uses the latest unit HTML report and returns both embed payload and attachment metadata.
- The dashboard generator writes new HTML to `docs/orchestration/interface/`.

## Related Files

- `server/index.mjs`
- `src/main.tsx`
- `src/styles.css`
- `scripts/build-orchestration-dashboard.mjs`
- `docs/orchestration/STATUS.md`
- `docs/orchestration/devlog/2026-06-08.md`

## Verification

- `npm run build`
- `npm run orchestration:dashboard`
- `GET /api/projects/lethe-prototype/orchestration-dashboard`
- `GET /api/projects/lethe-prototype/orchestration-command`
- `GET /api/projects/lethe-prototype/orchestration-reports`
- `POST /api/projects/lethe-prototype/discord-report` with `dryRun: true`
- `GET /api/projects/lethe-prototype/snapshot`
