# Next Tasks

## Done

### Scaffold MVP App

- Created Vite + React + TypeScript frontend.
- Created Node + Express backend.
- Added basic local development scripts.
- Verified with `npm run build`.

### Create Local Data Structure

- Added `data/projects.json`.
- Added snapshot and activity log paths.
- API reads the registered project list safely.

### Project Registration API

- Implemented `GET /api/projects`.
- Implemented `POST /api/projects`.
- Implemented `DELETE /api/projects/:id`.
- Validates folder existence before adding a project.

### Git Scanner

- Detects whether a registered path is a Git repository.
- Reads branch, dirty state, modified files, staged files, untracked files, latest commit, and upstream status.
- Handles missing paths and non-Git folders safely.

### Improve Dashboard Interactions

- Added project registration form in the UI.
- Added delete action with confirmation.
- Added prompt type selector for diagnose, commit, docs, and review.
- Verified add/delete API flow and review prompt generation.

### Improve Scanner Signals

- Added recent files.
- Added TODO/FIXME/BUG count with ignored heavy folders.
- Added large-file detection.
- Improved Unity/Unreal Git LFS risk messages.
- Added scan limits for large repositories.
- Verified snapshot output includes file signals beyond Git state.

### Risk Scoring

- Added action categories for blocked, commit, docs, push, pull, review, LFS, test, and cleanup.
- Recommended actions now use those categories instead of only raw Git state.
- Missing project paths are treated as blocked without incorrectly marking docs as missing.

### Prompt Generator

- Added prompt kinds for continue implementation, verification, cleanup, and push preparation.
- Generated prompts include Git state and file signals.
- Verified selected prompt kinds reflect project state.

### Portfolio Mode

- Added a dashboard toggle that hides local paths, file names, TODO text, and project names.
- Sanitized generated prompt display and copied prompt output.
- Added recommended action chips to show workflow without exposing private paths.

### Discord Report Prototype

- Added `GET /api/report` to generate a compact scan-based report.
- Added Discord snapshot report scripts.
- Kept HTML report attachment flow for human-readable work-unit reports.

## Priority 1

### Project Orchestration Interface

Goal:

- Define standard `docs/orchestration/*` documents for every portfolio project.
- Add templates for project brief, current task, next tasks, prompt context, decision log, and reports.
- Add a scaffold action that creates missing interface files in a selected project.
- Keep legacy profile mappings only as a migration fallback.

Verification:

- dashboard shows which interface documents exist or are missing
- generated command prompt can include `PROMPT_CONTEXT.md`, `CURRENT_TASK.md`, and `NEXT_TASKS.md`
- LETHE can be scaffolded from existing docs without losing current documentation

### Validate Real Project Paths

Goal:

- Replace sanitized example paths locally with the real LETHE and SoulLike folders.
- Run snapshots against the actual projects.
- Confirm the scanner ignores generated folders and does not expose private paths in portfolio mode.

Verification:

- `GET /api/snapshots` succeeds for both real projects
- Portfolio Mode hides sensitive paths and file names

### Browser Visual QA

Goal:

- Verify the dashboard visually in the browser once the browser runtime is available.
- Check desktop and mobile layout for overflow, overlapping text, and empty panels.

Verification:

- browser screenshot or manual visual check passes

## Priority 2

### HTML Report From Scan Data

Goal:

- Generate a dated HTML report from `GET /api/report` output.
- Keep the current manual work-unit report format for richer explanations.

Verification:

- generated HTML report includes work, progress, result, verification, and next task
