# Orchestration Interface

This document defines the common AI orchestration document contract for portfolio projects.

Every project managed by AI Project Orchestrator should eventually provide:

```text
docs/orchestration/PROJECT_BRIEF.md
docs/orchestration/CURRENT_TASK.md
docs/orchestration/NEXT_TASKS.md
docs/orchestration/PROMPT_CONTEXT.md
docs/orchestration/DECISION_LOG.md
docs/orchestration/reports/
```

## Required Roles

### PROJECT_BRIEF.md

Purpose:

- explain what the project is
- state the user-facing goal
- list the stack and runtime
- describe the portfolio angle

### CURRENT_TASK.md

Purpose:

- record the current active task
- list blockers and open questions
- define acceptance criteria
- show what counts as done

### NEXT_TASKS.md

Purpose:

- list upcoming task candidates
- keep task units neither too small nor too broad
- preserve priority and verification notes

### PROMPT_CONTEXT.md

Purpose:

- provide stable context Codex should receive often
- summarize project rules, workflow, constraints, and recurring commands
- avoid re-explaining the project in every prompt

### DECISION_LOG.md

Purpose:

- record important technical and AI-direction decisions
- capture user redirections that improved the workflow
- preserve portfolio-relevant reasoning

### reports/

Purpose:

- store work-unit reports
- keep user-facing summaries separate from raw logs
- support later portfolio writing

## Compatibility

Existing projects may already have similar documents under different paths.

The orchestrator may use profile mappings to migrate existing documents into this interface, but the target state should be the shared `docs/orchestration/*` contract.

## Prompt Generation Rule

When generating a Codex command prompt, prefer these documents in order:

```text
docs/orchestration/PROMPT_CONTEXT.md
docs/orchestration/CURRENT_TASK.md
docs/orchestration/NEXT_TASKS.md
```

If they do not exist, use legacy mappings only as a fallback.
