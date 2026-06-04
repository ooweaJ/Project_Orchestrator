# Dashboard Interactions

Date: 2026-06-04

## Goal

Improve the first MVP dashboard so project management and prompt generation can happen from the UI instead of only through local JSON or default recommended actions.

## Work Performed

- Added a project registration form to the project sidebar.
- Added project type and tag inputs.
- Connected the form to `POST /api/projects`.
- Added a remove button for each project card.
- Added a browser confirmation before removing a project from the dashboard.
- Connected delete to `DELETE /api/projects/:id`.
- Added prompt type controls for:
  - diagnose
  - commit
  - docs
  - review
- Connected prompt generation to `POST /api/projects/:id/prompt`.
- Updated dashboard styles for the form, delete action, status message, and prompt type segmented control.

## Problem Encountered

During API verification, adding and deleting a temporary test project caused `data/projects.json` to be rewritten with expanded array formatting.

## Resolution

The data content was intact, and the temporary project was removed successfully. The formatting change was cleaned up afterward so the tracked file stayed focused on the actual implementation change.

## Result

The dashboard can now:

- add a project from the UI
- remove a project from the UI with confirmation
- generate different Codex prompt kinds for the selected project

## Verification

Commands and checks:

```text
npm run build
POST /api/projects
POST /api/projects/:id/prompt with kind=review
DELETE /api/projects/:id
```

Observed API test result:

```text
addedId: orchestrator-test
promptKind: review
promptHasReviewGoal: true
deleted: true
```

## Next Task

Improve scanner signals:

- recent files
- TODO/FIXME count
- large-file detection
- stronger Unity/Unreal risk messages
