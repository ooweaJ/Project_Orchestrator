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

## Priority 1

### Improve Scanner Signals

Goal:

- Add recent files.
- Add TODO/FIXME count with ignored heavy folders.
- Add large-file detection.
- Improve Unity/Unreal risk messages.

Verification:

- snapshot output includes file signals beyond Git state

## Priority 2

### Risk Scoring

Goal:

- Refine rule-based risk levels: `low`, `medium`, `high`, `blocked`.
- Separate "needs commit", "needs docs", "needs push", and "blocked" categories.

Verification:

- snapshot output includes clear risks and recommended actions

### Prompt Generator

Goal:

- Expand prompt kinds for continue implementation, verification, cleanup, and push preparation.
- Make generated prompts more specific to detected risks.

Verification:

- generated prompt reflects the selected project state

## Priority 3

### Portfolio Mode

Goal:

- Hide private paths.
- Show workflow explanation.
- Display sanitized project examples and generated prompt examples.

Verification:

- portfolio mode can be shown without leaking local paths

### Discord Report Prototype

Goal:

- Generate a compact Markdown/embed-style report from a scan result.
- Keep detailed logs local and send only summaries.

Verification:

- generated report includes work, issue, resolution, result, verification, and next task
