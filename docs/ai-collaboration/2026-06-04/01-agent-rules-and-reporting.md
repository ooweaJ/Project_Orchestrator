# Agent Rules And Reporting

Date: 2026-06-04

## Context

Before implementing the AI Project Orchestrator MVP, the developer wanted to set up the working rules for Codex and the documentation structure that would preserve AI collaboration evidence for future portfolio use.

This setup matters because the project itself is intended to demonstrate AI-assisted development ability, not just produce a finished dashboard.

## User Prompt Summary

The developer asked to create an `AGENTS.md` file with:

- Karpathy-inspired AI coding guardrails
- harness-style command and operating rules
- Korean-friendly Git commit conventions
- naming conventions
- development logging
- user reporting rules

The developer then refined the idea by asking whether AI usage should be documented separately for portfolio purposes and whether prompt decisions should be curated instead of saving every conversation.

## Design Decision

Use `AGENTS.md` as the root operating rule file, but keep evidence and logs in separate documents.

Final structure:

```text
AGENTS.md
docs/AI_USAGE_PORTFOLIO.md
docs/PROMPT_DECISION_LOG.md
docs/CODEX_STATUS.md
docs/NEXT_TASKS.md
docs/DEV_LOG.md
docs/ai-collaboration/YYYY-MM-DD/<sequence>-<topic>.md
```

## Why This Is Better Than One Large Document

A single document would become too long and noisy.

The selected structure separates concerns:

- `AGENTS.md` tells the AI agent how to work.
- `AI_USAGE_PORTFOLIO.md` curates the strongest portfolio examples.
- `PROMPT_DECISION_LOG.md` indexes important prompt and decision records.
- `DEV_LOG.md` indexes implementation logs.
- `CODEX_STATUS.md` summarizes current project state.
- `NEXT_TASKS.md` keeps future work visible.
- dated task records preserve detailed context without bloating top-level docs.

## User Refinement

The developer rejected the idea of full-day reports as the primary record unit.

Instead, the developer preferred records grouped by meaningful work units:

- not too small, like a typo or tiny UI tweak
- not too large, like the entire MVP
- sized around a coherent feature, section, bug fix, or workflow decision

This became the project logging rule.

The developer also reviewed the first `AGENTS.md` draft and found that the Karpathy-inspired guardrails were too compressed. The developer supplied the fuller four-part structure:

- Think Before Coding
- Simplicity First
- Surgical Changes
- Goal-Driven Execution

This was applied to `AGENTS.md` so the rules can guide real implementation behavior instead of remaining a vague summary.

## AI Collaboration Skill Demonstrated

This interaction demonstrates:

- AI coding harness design
- prompt-driven workflow design
- human-in-the-loop AI redirection
- portfolio evidence planning
- task-based development reporting
- safety-first command design
- AI operating rule review and refinement

## Portfolio Interpretation

The developer did not use AI only to generate code.

The developer used AI to design the operating system around AI-assisted development: rules, logs, reporting, safety boundaries, and portfolio evidence. This is a stronger portfolio signal than simply saying the project was made with AI.

Candidate wording:

> Before implementation, I designed an AI collaboration harness for the project: repo-level agent rules, safe command boundaries, Korean-friendly commit conventions, task-based development logs, prompt decision records, and portfolio-oriented AI usage documentation.

## Development Log

### Goal

Create the initial documentation harness for the project.

### Work Performed

- Designed `AGENTS.md` as the root AI agent operating guide.
- Expanded the Karpathy-inspired guardrails into explicit behavioral rules.
- Separated portfolio evidence from operational agent rules.
- Created a prompt decision index.
- Created status, next-task, and development log documents.
- Added the first dated AI collaboration record.

### Problem Encountered

PowerShell discovery commands failed because the sandbox process could not refresh its spawn setup.

### Resolution

Proceed with a documentation-only patch based on the project specification and the user's explicit structure request.

### Result

The project now has a documentation structure that supports:

- AI-safe development
- task-based progress tracking
- curated prompt decision records
- future portfolio writing
- future Discord reporting

### Verification

No app build exists yet, so runtime verification is not applicable.

Documentation structure should be checked once shell access is available.

### Next Task

Scaffold the MVP app with Vite, React, TypeScript, Node, and Express.
