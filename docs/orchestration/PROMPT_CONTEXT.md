# Prompt Context

## Stable Project Context

This repository is a local-first AI Project Orchestrator and portfolio artifact. The product should help manage multiple development projects assisted by Codex or other AI agents.

## Working Rules

- Prefer the smallest change that solves the task.
- Read relevant project documents before editing.
- Do not run destructive Git or filesystem commands automatically.
- Do not revert user changes unless explicitly requested.
- Keep portfolio evidence curated, not exhaustive.
- Report what changed, how it was verified, and what remains.

## Documentation Rules

- Use `docs/orchestration/*` as the standard handoff interface.
- Keep `STATUS.md` for whole-project state.
- Keep `CURRENT_TASK.md` for the active work unit.
- Keep `NEXT_TASKS.md` short, usually the top five candidates.
- Put internal process notes in `devlog/`.
- Put user-facing or portfolio summaries in `reports/`.
- Put test output, screenshots, logs, and benchmark artifacts in `evidence/`.

## Recurring Commands

- `git status --short`
- `git diff --stat`
- `npm run build`
- `npm run lint`
- `npm run test`
