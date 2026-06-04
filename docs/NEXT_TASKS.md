# Next Tasks

## Priority 1

### Scaffold MVP App

Goal:

- Create Vite + React + TypeScript frontend.
- Create Node + Express backend.
- Add basic local development scripts.

Verification:

- `npm run build`
- local dev server opens the dashboard

### Create Local Data Structure

Goal:

- Add `data/projects.json`.
- Add snapshot and activity log directories.
- Keep local data out of accidental portfolio exposure if needed.

Verification:

- app can read an empty project list safely

## Priority 2

### Project Registration API

Goal:

- Implement `GET /api/projects`.
- Implement `POST /api/projects`.
- Implement `DELETE /api/projects/:id`.
- Validate folder existence without modifying target projects.

Verification:

- add and remove a project locally

### Git Scanner

Goal:

- Detect whether a registered path is a Git repository.
- Read branch, dirty state, modified files, staged files, untracked files, and latest commit.
- Handle non-Git folders safely.

Verification:

- scan Git and non-Git sample folders

## Priority 3

### Risk Scoring

Goal:

- Add rule-based risk levels: `low`, `medium`, `high`, `blocked`.
- Detect dirty tree, untracked files, no upstream, ahead/behind state, and missing docs.

Verification:

- snapshot output includes clear risks and recommended actions

### Prompt Generator

Goal:

- Generate copyable Codex prompts for diagnose, continue implementation, verification, commit preparation, documentation, and review.

Verification:

- generated prompt reflects the selected project state

## Priority 4

### Dashboard UI

Goal:

- Show top status bar.
- Show global priority summary.
- Show project cards.
- Show selected project detail panel.
- Show prompt composer and copy button.

Verification:

- dashboard is usable as the first screen

### Portfolio Mode

Goal:

- Hide private paths.
- Show workflow explanation.
- Display sanitized project examples and generated prompt examples.

Verification:

- portfolio mode can be shown without leaking local paths
