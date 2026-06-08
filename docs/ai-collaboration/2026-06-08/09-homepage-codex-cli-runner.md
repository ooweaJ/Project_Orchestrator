# Homepage Codex CLI Runner

## Goal

Let the user issue an instruction from the AI Project Orchestrator homepage and run Codex CLI against the selected local project.

## Work Performed

- Added backend run APIs:
  - `POST /api/projects/:id/codex-run`
  - `GET /api/projects/:id/codex-runs`
  - `GET /api/projects/:id/codex-runs/:runId`
- Added a `Codex 실행` button to the selected project's command panel.
- Added polling and a run status card that shows running/complete/failed state, exit code, output, and final Codex message.
- Store each run under `docs/orchestration/agent_runs/<runId>/` with prompt, logs, status, and final message files.
- Added `docs/orchestration/agent_runs/` to `.gitignore`.

## Problem Encountered

The first CLI attempt used an unsupported `--ask-for-approval` position for `codex exec`. A later attempt could start Codex but stayed interactive or noisy because approval and MCP/user config behavior were not suitable for unattended runs.

## Resolution

Use this non-interactive command shape from the server:

```powershell
codex exec -c 'approval_policy="never"' --cd <project> --sandbox workspace-write --output-last-message <file> -
```

The backend also marks detached running records as failed so the homepage does not show stale runs forever after a server restart.

## Result

The homepage can now start Codex CLI for the selected project and show the resulting final answer without copying the prompt into a separate terminal.

## Verification

- `npm run build`
- `POST /api/projects/project-orchestrator/codex-run` returned `202 Accepted`
- `GET /api/projects/project-orchestrator/codex-runs/20260608-095709-1hluj` returned:
  - `status: complete`
  - `exitCode: 0`
  - `lastMessage: codex runner ok`

## Next Task

Add cancel/retry controls and a homepage action to regenerate the selected project's orchestration HTML.
