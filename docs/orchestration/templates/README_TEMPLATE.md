# Orchestration Interface

This folder is the standard handoff surface for Codex and other AI agents working on this project.

## Required Core

- `PROJECT_BRIEF.md`: what the project is, goals, stack, and portfolio angle
- `STATUS.md`: whole-project state, latest verification, blockers, and next major step
- `CURRENT_TASK.md`: the active work unit and what counts as done
- `NEXT_TASKS.md`: the top upcoming task candidates, usually limited to five
- `PROMPT_CONTEXT.md`: stable context that Codex should receive often
- `RUNBOOK.md`: concrete commands and operating procedures
- `SCOPE_GUARD.md`: explicit non-goals and scope limits
- `DECISION_LOG.md`: index of important technical and AI-direction decisions
- `devlog/`: internal work traces
- `reports/`: user-facing and portfolio-facing reports

## Recommended Extensions

- `review_prompts/`: prompts sent to other AI reviewers
- `review_responses/`: responses received from AI reviewers
- `evidence/`: test output, screenshots, logs, benchmark results, and QA artifacts
- `templates/`: reusable report, task, review, and AGENTS templates

## Handoff Flow

Read in this order:

```text
PROMPT_CONTEXT.md
STATUS.md
CURRENT_TASK.md
NEXT_TASKS.md
SCOPE_GUARD.md
```

Read `RUNBOOK.md` when commands, verification, reporting, packaging, or deployment are involved.
