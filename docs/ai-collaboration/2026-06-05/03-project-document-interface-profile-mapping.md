# Project Document Interface Standard

Date: 2026-06-05

## Goal

Design how AI Project Orchestrator should read project-specific documents across portfolio projects.

## User Framing

The user identified that the idea is closer to an interface:

- all projects should expose common orchestration roles
- the projects are portfolio projects, so they can share a common operating contract
- consistent documents are easier to manage than per-project one-off mappings
- profile mappings are useful, but feel like a workaround if used as the primary design
- the design should favor a stable interface that every project implements

## Decision

Use a common orchestration document interface as the primary standard.

Every orchestrated portfolio project should eventually provide the same document contract:

```text
docs/orchestration/PROJECT_BRIEF.md
docs/orchestration/CURRENT_TASK.md
docs/orchestration/NEXT_TASKS.md
docs/orchestration/PROMPT_CONTEXT.md
docs/orchestration/DECISION_LOG.md
docs/orchestration/reports/
```

Role meanings:

```text
PROJECT_BRIEF.md   -> what the project is, goals, stack, portfolio angle
CURRENT_TASK.md    -> active work, blockers, acceptance criteria
NEXT_TASKS.md      -> upcoming task candidates
PROMPT_CONTEXT.md  -> stable context Codex should receive every time
DECISION_LOG.md    -> important design and AI-direction decisions
reports/           -> work-unit reports
```

## Why A Shared Interface Is Better

This is not arbitrary hardcoding. It is a deliberate project contract.

Because the user's projects are also portfolio artifacts, the consistency itself has value:

- easier dashboard implementation
- easier prompt generation
- easier portfolio extraction
- easier cross-project comparison
- less need for manual profile configuration
- fewer ambiguous "which document should Codex read?" moments

## Profile Mapping Role

Per-project profile mappings should still exist, but as a compatibility layer, not the primary interface.

Use mappings when:

- a project already has older documents
- a project is being migrated into the standard
- a document role needs to temporarily point to an existing file
- the orchestrator needs to suggest initial content from legacy files

Example compatibility mapping for LETHE:

```text
PROJECT_BRIEF.md   <- README.md + planning docs
CURRENT_TASK.md    <- docs/CODEX_STATUS.md
NEXT_TASKS.md      <- docs/NEXT_TASKS.md
PROMPT_CONTEXT.md  <- AGENTS.md + docs/WORKFLOW.md + docs/CODEX_RUNBOOK.md
DECISION_LOG.md    <- docs/DECISIONS.md + docs/adr/
reports/           <- docs/reports/units/
```

## Migration Plan

Use a hybrid approach:

- define the standard document interface
- detect whether a project already has `docs/orchestration/*`
- if missing, generate scaffold files from templates
- if legacy docs exist, suggest content to copy or summarize into the interface docs
- keep compatibility mappings only until the project has the standard files

## LETHE Observation

LETHE already has many documents, so it should not require a brand-new document set immediately.

But as a portfolio project, LETHE should still get the standard interface eventually:

```text
docs/orchestration/PROJECT_BRIEF.md
docs/orchestration/CURRENT_TASK.md
docs/orchestration/NEXT_TASKS.md
docs/orchestration/PROMPT_CONTEXT.md
docs/orchestration/DECISION_LOG.md
docs/orchestration/reports/
```

The first version can be generated from existing LETHE docs instead of handwritten from scratch.

## Next Task

Implement the orchestration document standard:

- create templates for the six standard roles
- add a scaffold action per project
- read `docs/orchestration/*` before falling back to legacy mappings
- show interface completion status in the dashboard
- include `PROMPT_CONTEXT.md`, `CURRENT_TASK.md`, and `NEXT_TASKS.md` in command prompt generation
