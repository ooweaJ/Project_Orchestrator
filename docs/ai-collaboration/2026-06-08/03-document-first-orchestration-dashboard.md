# Document-First Orchestration Dashboard

Date: 2026-06-08

## Goal

Make the dashboard operate from the orchestration interface documents instead of scanner-oriented panels.

## Work Performed

- Added `files.orchestrationDashboard` to snapshots.
- Read `STATUS.md`, `CURRENT_TASK.md`, `NEXT_TASKS.md`, and `DECISION_LOG.md` for each registered project.
- Replaced the primary detail view with orchestration document cards.
- Changed command generation to use orchestration document contents.
- Removed the visible `Codex 작업 프롬프트`, `위험 신호`, and `보조 스캔 정보` panels from the primary view.
- Added centralized Discord report preview/send endpoints using AI Project Orchestrator's root `.env`.

## Problem Encountered

The earlier dashboard still treated risk signals and generated prompts as the product center, even though the orchestration interface documents are now the actual operating layer.

## Resolution

Moved the UI center to current state, current task, next tasks, commands, and reporting.

## Result

The dashboard now lets the user inspect orchestration documents, judge the project state, issue a document-based command, and prepare/send a Discord report from the orchestrator.

## Verification

- `npm run build`
- `GET /api/snapshots`
- `POST /api/projects/lethe-prototype/discord-report` with `dryRun: true`

## Next Task

Use the new view on a real work unit and refine the Discord report format after seeing the first actual send.
