# Development Docs Plugin

This folder is the standard development-docs plugin for Codex, the user, and other AI agents working on this project.

Markdown is the AI source of truth. HTML is the human review surface.

## Required Core

- `interface/index.html`: human-facing project dashboard
- `interface/command.html`: human-facing next instruction block
- `interface/runbook.html`: human-facing operating procedures
- `state/PROJECT_BRIEF.md`: what the project is, goals, stack, and portfolio angle
- `state/STATUS.md`: whole-project state, latest verification, blockers, and next major step
- `state/CURRENT_TASK.md`: the active work unit and what counts as done
- `state/NEXT_TASKS.md`: the top upcoming task candidates, usually limited to five
- `state/PROMPT_CONTEXT.md`: stable context that Codex should receive often
- `state/RUNBOOK.md`: concrete commands and operating procedures
- `state/SCOPE_GUARD.md`: explicit non-goals and scope limits
- `state/DECISION_LOG.md`: index of important technical and AI-direction decisions
- `devlog/`: internal work traces
- `reports/`: user-facing and portfolio-facing reports. Prefer date journals at `reports/YYYYMMDD/index.html`.

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

In the split layout, read those files from `state/`.

Read `state/RUNBOOK.md` when commands, verification, reporting, packaging, or deployment are involved.

After meaningful work, update state Markdown, append `devlog/YYYY-MM-DD.md`, update `reports/YYYYMMDD/index.html`, and refresh `interface/*.html` if the project has generated HTML.
