# Orchestration Interface

This document defines the common AI orchestration document contract for portfolio projects.

The interface has two layers:

- required core: documents needed for day-to-day project operation
- recommended extensions: evidence and templates that improve review quality and automation

Every project managed by AI Project Orchestrator should eventually provide this core:

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

Recommended extensions:

```text
docs/orchestration/
  review_prompts/
  review_responses/
  evidence/
  templates/
```

## Required Core Roles

### README.md

Purpose:

- explain how to read and maintain the orchestration folder
- define the required core and recommended extensions
- document the handoff flow for Codex or another AI agent

### PROJECT_BRIEF.md

Purpose:

- explain what the project is
- state the user-facing goal
- list the stack and runtime
- describe the portfolio angle

### STATUS.md

Purpose:

- summarize the whole project state on one page
- record the latest verification, current version or result, blockers, and next major step
- help Codex restore context without searching through logs first

### CURRENT_TASK.md

Purpose:

- define the active work unit for the current turn
- list the goal, done criteria, related files, open questions, and verification commands
- make it clear where Codex should stop

### NEXT_TASKS.md

Purpose:

- list the top upcoming task candidates
- keep the list short, usually the top five
- preserve priority and verification notes without becoming a history log

### PROMPT_CONTEXT.md

Purpose:

- provide stable context Codex should receive often
- summarize project rules, workflow, constraints, reporting rules, and recurring commands
- avoid re-explaining the project in every prompt

### RUNBOOK.md

Purpose:

- collect concrete commands and operating procedures
- cover preflight, test, build, report, dry-run, package, and deploy flows where applicable
- keep command mechanics separate from broader project rules

### SCOPE_GUARD.md

Purpose:

- record what should not be built yet
- prevent speculative expansion and scope drift
- preserve user constraints that should override tempting implementation ideas

### DECISION_LOG.md

Purpose:

- index important technical and AI-direction decisions
- capture user redirections that improved the workflow
- point to ADRs or deeper decision records when decisions become large

### devlog/

Purpose:

- store internal work traces, usually one lightweight file per day
- capture goal, changes, verification, problems, decisions, and next steps
- keep internal debugging history separate from user-facing reports

### reports/

Purpose:

- store user-facing or portfolio-facing work-unit reports
- keep polished summaries separate from raw logs
- support later portfolio writing

## Compatibility

Existing projects may already have similar documents under different paths.

The orchestrator may use profile mappings to migrate existing documents into this interface, but the target state should be the shared `docs/orchestration/*` contract.

Recommended mappings for older project documents:

```text
STATUS.md       <- CODEX_STATUS.md or equivalent state document
devlog/         <- DEV_LOG.md or task-based implementation logs
DECISION_LOG.md <- PROMPT_DECISION_LOG.md, DECISIONS.md, or docs/adr/
reports/        <- docs/reports/
```

## Install Command

From this repository, scaffold the default interface into another local project:

```powershell
npm run orchestration:install -- --target "C:\path\to\project"
```

Add a root `AGENTS.md` only when the target project does not already have one:

```powershell
npm run orchestration:install -- --target "C:\path\to\project" --with-agents
```

The installer creates missing files and folders only. It does not overwrite existing project documents.

## Prompt Generation Rule

When generating a Codex command prompt, prefer these documents in order:

```text
docs/orchestration/PROMPT_CONTEXT.md
docs/orchestration/STATUS.md
docs/orchestration/CURRENT_TASK.md
docs/orchestration/NEXT_TASKS.md
docs/orchestration/SCOPE_GUARD.md
```

Use `RUNBOOK.md` when the prompt involves verification, reporting, packaging, deployment, or repeated command workflows.

If standard orchestration documents do not exist, use legacy mappings only as a fallback.
