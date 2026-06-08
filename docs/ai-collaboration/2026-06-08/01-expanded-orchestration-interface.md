# Expanded Orchestration Interface

Date: 2026-06-08

## Goal

Update the common project orchestration interface using feedback from LETHE about which documents helped Codex continue work safely.

## User Framing

The user clarified that the original interface was directionally correct but missing practical operating surfaces:

- evidence and verification records
- AI handoff state
- operating commands
- scope guardrails
- separate internal and external logs

The user also clarified the key distinction:

- `STATUS.md`: whole-project state, latest verification, blockers, and next major step
- `CURRENT_TASK.md`: one active work unit, done criteria, related files, and verification commands

## Decision

Use this required core for every orchestrated project:

```text
docs/orchestration/
  README.md
  PROJECT_BRIEF.md
  STATUS.md
  CURRENT_TASK.md
  NEXT_TASKS.md
  PROMPT_CONTEXT.md
  RUNBOOK.md
  SCOPE_GUARD.md
  DECISION_LOG.md
  devlog/
  reports/
```

Use these recommended extensions:

```text
docs/orchestration/
  review_prompts/
  review_responses/
  evidence/
  templates/
```

## Role Boundaries

- `reports/` is for external, user-facing, or portfolio-facing results.
- `devlog/` is the internal black box for work traces.
- `NEXT_TASKS.md` should stay short, usually the top five candidates.
- history belongs in `devlog/`
- decisions belong in `DECISION_LOG.md`
- verification artifacts belong in `evidence/`

## AGENTS Template Direction

AGENTS.md structure should become reusable, but the first step is a repository template under `docs/orchestration/templates/`.

Promote it to a Codex skill only after the same workflow is stable across multiple projects.

## Result

- Updated `docs/ORCHESTRATION_INTERFACE.md`.
- Added this repository's initial `docs/orchestration/` scaffold.
- Updated `AGENTS.md` to prefer the orchestration interface.
- Added `docs/orchestration/templates/AGENTS_TEMPLATE.md`.

## Verification

Documentation-only change. Markdown files and report links were reviewed.

## Next Task

Implement scanner and dashboard support for detecting and scaffolding the expanded interface.
