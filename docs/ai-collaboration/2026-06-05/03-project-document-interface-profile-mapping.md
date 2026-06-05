# Project Document Interface And Profile Mapping

Date: 2026-06-05

## Goal

Design how AI Project Orchestrator should read project-specific documents across projects that already have different documentation structures.

## User Framing

The user identified that the idea is closer to an interface:

- all projects should expose common orchestration roles
- each project may already store those roles in different files or folders
- hardcoding exact file names per project feels brittle
- the design risk should be recorded before implementation

## Decision

Use a common orchestration document interface, backed by per-project profile mappings.

Common interface:

```text
projectBrief
currentTask
nextTasks
promptContext
decisionLog
reports
```

Project-specific profile example:

```json
{
  "projectBrief": ["README.md", "docs/<planning-doc>.md"],
  "currentTask": ["docs/CODEX_STATUS.md"],
  "nextTasks": ["docs/NEXT_TASKS.md"],
  "promptContext": ["AGENTS.md", "docs/WORKFLOW.md", "docs/CODEX_RUNBOOK.md"],
  "decisionLog": ["docs/DECISIONS.md", "docs/adr/"],
  "reports": ["docs/reports/units/"]
}
```

## Why This Is Not Pure Hardcoding

The hardcoded part is the interface role names, not every project file path.

This is acceptable because the roles are the product contract:

- what is this project?
- what is happening now?
- what should happen next?
- what context should Codex always receive?
- what decisions matter?
- where are work reports?

The file paths are project-specific mappings and can differ per project.

## Risk

If profile mappings become too manual, the orchestrator can feel like a config-heavy tool.

If mappings are fully automatic, the orchestrator may misread project documents because document names and meanings vary by project.

## Mitigation

Use a hybrid approach:

- auto-detect common files first
- generate a suggested profile
- allow the user to edit mappings
- show which interface roles are resolved or missing
- include resolved role content in generated Codex prompts

## LETHE Mapping Observation

LETHE already has many documents, so it should not require a brand-new document set immediately.

Likely mapping:

```text
projectBrief   -> README.md + planning docs
currentTask    -> docs/CODEX_STATUS.md
nextTasks      -> docs/NEXT_TASKS.md
promptContext  -> AGENTS.md + docs/WORKFLOW.md + docs/CODEX_RUNBOOK.md
decisionLog    -> docs/DECISIONS.md + docs/adr/
reports        -> docs/reports/units/
```

## Next Task

Implement project document profiles:

- add profile storage under `orchestration/<project-id>/profile.json`
- add document role detection
- show a dashboard panel for resolved/missing roles
- include selected document role summaries in command prompt generation
