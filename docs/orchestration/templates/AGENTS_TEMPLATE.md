# AGENTS.md Template

Use this template as a starting point for projects that adopt the personal development-docs plugin. Customize project-specific sections before use.

## Project Mission

- State what the project is.
- State the user-facing goal.
- State the portfolio or product angle if relevant.

## Operating Principles

- Read relevant project documents before making changes.
- Prefer the smallest change that solves the current task.
- Surface uncertainty instead of silently guessing.
- Do not revert user changes unless explicitly requested.
- Before editing files, state what will be edited and why.
- After implementation, report what changed, how it was verified, and what should happen next.

## Development Docs Plugin

Before meaningful work, prefer these handoff documents:

- `docs/orchestration/README.md`
- `docs/orchestration/state/PROJECT_BRIEF.md`
- `docs/orchestration/state/STATUS.md`
- `docs/orchestration/state/CURRENT_TASK.md`
- `docs/orchestration/state/NEXT_TASKS.md`
- `docs/orchestration/state/PROMPT_CONTEXT.md`
- `docs/orchestration/state/RUNBOOK.md`
- `docs/orchestration/state/SCOPE_GUARD.md`
- `docs/orchestration/state/DECISION_LOG.md`
- `docs/orchestration/interface/index.html`
- `docs/orchestration/interface/command.html`
- `docs/orchestration/interface/runbook.html`
- `docs/orchestration/devlog/`
- `docs/orchestration/reports/`

Recommended extensions:

- `docs/orchestration/review_prompts/`
- `docs/orchestration/review_responses/`
- `docs/orchestration/evidence/`
- `docs/orchestration/templates/`

After meaningful work:

- Update the relevant `docs/orchestration/state/*.md` files.
- Append internal continuity notes to `docs/orchestration/devlog/YYYY-MM-DD.md`.
- Update the user-facing daily journal at `docs/orchestration/reports/YYYYMMDD/index.html`.
- Put optional detailed report pages under `docs/orchestration/reports/YYYYMMDD/units/`.
- Regenerate or update `docs/orchestration/interface/*.html` when state changes.
- If Discord notification is needed, submit the report to Project Orchestrator's central Discord intake (`POST /api/orchestration/discord-report`) instead of storing a project-specific webhook by default. Use the registered `projectId`; `reportPath` is relative to `docs/orchestration/reports/`.

## Command Rules

Allowed discovery commands:

- `git status --short`
- `git diff --stat`
- `git diff`
- `git log --oneline -n 10`
- `rg`
- `rg --files`
- `Get-ChildItem`
- `Get-Content`

Require explicit user approval for destructive commands, force pushes, recursive deletes, or modifications outside the workspace.

## Reporting

For meaningful work units, report:

```text
작업 완료: <작업명>

한 일:
- ...

문제와 해결:
- ...

결과:
- ...

검증:
- ...

다음 작업:
- ...
```
