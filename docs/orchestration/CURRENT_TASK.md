# Current Task

## Task

Split the project HTML interface into dashboard, command, and runbook pages.

## Goal

- Keep `docs/orchestration/index.html` as the project dashboard.
- Move the next instruction summary into `docs/orchestration/command.html`.
- Move repeated operating commands into `docs/orchestration/runbook.html`.
- Show the homepage in the order: project dashboard, next instruction, command prompt, runbook, collapsed interface checklist.
- Treat `reports/` as the user-facing progress record rather than a separate report panel.

## Done Criteria

- The homepage labels the embedded project view as `프로젝트 대시보드`.
- The command prompt sits below the embedded `command.html` next-instruction block.
- The runbook appears as a separate bottom block with explanatory text.
- Visible risk badges, the report block, and the document browser are not part of the main operating flow.
- Interface file completion is available only as a collapsed checklist.

## Related Files

- `server/index.mjs`
- `src/main.tsx`
- `src/styles.css`
- `scripts/build-orchestration-dashboard.mjs`
- `server/index.mjs`

## Verification

- `npm run build`
- `npm run orchestration:dashboard -- --all`
- `GET /api/projects/lethe-prototype/orchestration-dashboard`
- `GET /api/projects/lethe-prototype/orchestration-command`
- `GET /api/projects/lethe-prototype/orchestration-runbook`
