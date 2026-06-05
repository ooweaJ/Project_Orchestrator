# Risk Actions, Prompts, Portfolio Mode, Snapshot Reports

Date: 2026-06-05

## Goal

Complete the next orchestration loop:

- classify project state into concrete action categories
- expand Codex prompt generation beyond diagnose/commit/docs/review
- add a portfolio-safe dashboard view
- generate compact Discord reports from live scan results

## Work Performed

- Added `actionCategories` to snapshots:
  - `blocked`
  - `needsCommit`
  - `needsDocs`
  - `needsPush`
  - `needsPull`
  - `needsReview`
  - `needsLfs`
  - `needsTest`
  - `needsCleanup`
- Updated recommended actions to use action categories.
- Added prompt kinds:
  - continue implementation
  - verification
  - cleanup
  - push preparation
- Added a Portfolio Mode toggle in the dashboard.
- Sanitized project names, local paths, file paths, TODO text, and generated prompt output while Portfolio Mode is active.
- Added recommended action chips to make the next workflow visible.
- Added `GET /api/report` for compact scan summaries.
- Added Discord snapshot report scripts:

```text
npm run report:discord:snapshot:dry
npm run report:discord:snapshot
```

## Problem Encountered

The default project paths are intentionally sanitized examples. They return `exists: false`, which should be treated as blocked, but should not produce false "needs docs" signals.

The Discord snapshot report also needed a clear source label so it would not look like it came from `docs/reports/latest-status.html`.

## Resolution

Missing paths now produce a blocked action category only. Documentation, commit, push, and review categories stay false until a real folder exists.

The snapshot report sender uses the source label:

```text
GET /api/report 스캔 결과 기준으로 생성됨
```

## Result

The dashboard now moves from passive status display toward an AI operations loop:

- scan local project state
- classify what kind of action is needed
- generate a focused Codex prompt
- hide private details for portfolio presentation
- send compact progress summaries to Discord

## Verification

Commands and checks:

```text
npm run build
GET http://127.0.0.1:4317/api/report
npm run report:discord:snapshot:dry
temporary POST /api/projects
temporary POST /api/projects/:id/prompt for push
temporary POST /api/projects/:id/prompt for verification
temporary DELETE /api/projects/:id
```

Observed behavior:

```text
blocked default projects no longer counted as needsDocs
snapshot report returned 2 projects and 2 blocked paths
push prompt contained push preparation guidance
verification prompt contained verification guidance
```

## Next Task

Validate the dashboard against the real LETHE and SoulLike local paths, then perform browser visual QA when the browser runtime is available.
