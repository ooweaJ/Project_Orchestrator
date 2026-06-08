# Prompt Context

## Stable Project Context

- 

## Working Rules

- Read relevant project documents before editing.
- Prefer the smallest change that solves the current task.
- Do not run destructive Git or filesystem commands automatically.
- Do not revert user changes unless explicitly requested.
- Report what changed, how it was verified, and what remains.

## Documentation Rules

- Use `docs/orchestration/` as the standard development-docs plugin.
- Keep human-facing HTML in `docs/orchestration/interface/`.
- Keep AI-facing Markdown in `docs/orchestration/state/`.
- Keep `state/STATUS.md` for whole-project state.
- Keep `state/CURRENT_TASK.md` for the active work unit.
- Keep `state/NEXT_TASKS.md` short, usually the top five candidates.
- Put internal process notes in `devlog/`.
- Put the main human development journal in `reports/YYYYMMDD/index.html`.
- Put optional detailed unit reports in `reports/YYYYMMDD/units/`.
- Put test output, screenshots, logs, and benchmark artifacts in `evidence/`.
- If Discord notification is needed, submit the report to Project Orchestrator's central intake instead of storing a project-specific webhook by default.

## Recurring Commands

- 
