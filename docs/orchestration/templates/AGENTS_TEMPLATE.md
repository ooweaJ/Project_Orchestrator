# AGENTS.md Template

Use this template as a starting point for projects that adopt the orchestration interface. Customize project-specific sections before use.

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

## Orchestration Documents

Prefer these handoff documents:

- `docs/orchestration/README.md`
- `docs/orchestration/PROJECT_BRIEF.md`
- `docs/orchestration/STATUS.md`
- `docs/orchestration/CURRENT_TASK.md`
- `docs/orchestration/NEXT_TASKS.md`
- `docs/orchestration/PROMPT_CONTEXT.md`
- `docs/orchestration/RUNBOOK.md`
- `docs/orchestration/SCOPE_GUARD.md`
- `docs/orchestration/DECISION_LOG.md`
- `docs/orchestration/devlog/`
- `docs/orchestration/reports/`

Recommended extensions:

- `docs/orchestration/review_prompts/`
- `docs/orchestration/review_responses/`
- `docs/orchestration/evidence/`
- `docs/orchestration/templates/`

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
