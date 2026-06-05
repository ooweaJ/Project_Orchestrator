# Scanner Signals

Date: 2026-06-05

## Goal

Improve the project scanner so snapshots include useful file-level signals beyond Git state.

## Work Performed

- Added recursive file signal scanning with ignored heavy folders.
- Ignored folders include `.git`, `node_modules`, Unreal generated folders, Unity generated folders, build outputs, and cache folders.
- Added recent file detection.
- Added TODO/FIXME/BUG comment counting.
- Added TODO sample items with file path, line number, and short text.
- Added large file detection.
- Added scan caps to avoid blindly scanning very large repositories.
- Improved Unreal and Unity Git LFS risk messages.
- Added dashboard file signal display:
  - TODO/FIXME/BUG count
  - large file count
  - recent file count
  - recent file list
  - large file list
  - TODO sample list
- Added file signals to generated Codex prompts.

## Problem Encountered

The default project paths are sanitized example paths, so normal snapshots for the default projects return `exists: false`.

To verify real scanning behavior without changing tracked project candidates, a temporary local project entry was added through the API, scanned, and deleted.

## Resolution

The temporary scanner project used the current repository path. It verified the file signal behavior without modifying external projects.

The API rewrote `data/projects.json` using its normal JSON formatting. This format is now accepted as the app's persisted config format to avoid repeated churn.

## Result

Snapshots now include:

- `files.recentFiles`
- `files.largeFiles`
- `files.todoCount`
- `files.todoItems`
- `files.scannedFiles`
- `files.truncated`

## Verification

Commands and checks:

```text
npm run build
GET http://127.0.0.1:5173
GET http://127.0.0.1:4317/api/snapshots
temporary POST /api/projects
temporary GET /api/projects/:id/snapshot
temporary DELETE /api/projects/:id
```

Observed scanner test:

```text
addedId: scanner-test
scannedFiles: 36
recentFiles: 10
todoCount: 18
todoItems: 12
largeFiles: 0
truncated: false
```

## Next Task

Refine risk scoring:

- separate needs commit, docs, push, and blocked categories
- make recommended actions more specific to file signals
- improve prompt generation for verification and cleanup
