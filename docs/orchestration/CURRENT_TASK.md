# Current Task

## Task

Run Codex CLI directly from the homepage command panel.

## Goal

- Let the user type an instruction in the selected project's command panel.
- Start a non-interactive `codex exec` run from the selected project's local folder.
- Store prompt, output, status, and final message as local run artifacts.
- Show run status and the latest Codex response in the homepage.

## Done Criteria

- The command panel has a `Codex 실행` action next to prompt generation/copy.
- The backend exposes APIs to start a run, list recent runs, and read one run.
- The run command uses `approval_policy="never"` with `workspace-write` sandbox mode.
- Runs write artifacts under `docs/orchestration/agent_runs/`.
- `agent_runs/` is ignored by Git.
- A short no-edit verification run completes and returns a final message in the UI/API.

## Related Files

- `server/index.mjs`
- `src/main.tsx`
- `src/styles.css`
- `.gitignore`
- `docs/orchestration/STATUS.md`
- `docs/orchestration/devlog/2026-06-08.md`
- `docs/orchestration/reports/2026-06-08-09-homepage-codex-cli-runner.html`

## Verification

- `npm run build`
- `POST /api/projects/project-orchestrator/codex-run`
- `GET /api/projects/project-orchestrator/codex-runs/20260608-095709-1hluj`
