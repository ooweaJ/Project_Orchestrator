# Current Task

## Task

Make the dashboard operate from orchestration documents.

## Goal

- Read `STATUS.md`, `CURRENT_TASK.md`, `NEXT_TASKS.md`, and `DECISION_LOG.md` for each registered project.
- Make the dashboard prioritize current state, current task, next tasks, commands, and reporting.
- Remove the old risk/prompt/auxiliary scan panels from the primary detail view.
- Send Discord project reports from the orchestrator's central `.env`.

## Done Criteria

- `GET /api/snapshots` includes `files.orchestrationDashboard`.
- Dashboard shows document content cards for status, current task, and next tasks.
- Dashboard command generation uses the orchestration documents.
- Dashboard has Discord preview/send actions backed by the orchestrator server.

## Related Files

- `server/index.mjs`
- `src/main.tsx`
- `src/styles.css`

## Verification

- Run `npm run build`.
- Run `GET /api/snapshots` and confirm `files.orchestrationDashboard`.
- Run Discord report dry-run for LETHE without sending.
