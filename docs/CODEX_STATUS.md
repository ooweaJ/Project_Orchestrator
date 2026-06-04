# Codex Status

## Current State

The project is in pre-MVP setup.

Completed documentation setup:

- `AGENTS.md` defines AI agent operating rules.
- `docs/AI_USAGE_PORTFOLIO.md` summarizes portfolio-relevant AI usage.
- `docs/PROMPT_DECISION_LOG.md` indexes important prompt and decision records.
- `docs/DEV_LOG.md` indexes task-based development logs.
- `docs/NEXT_TASKS.md` lists upcoming work.
- `docs/ai-collaboration/2026-06-04/01-agent-rules-and-reporting.md` records the first AI collaboration design decision.

## Product Target

Build a local-first AI Project Orchestrator dashboard with:

- Vite + React + TypeScript frontend
- Node + Express backend
- local JSON config
- Git/project scanner
- rule-based risk scoring
- Codex prompt generator
- no paid AI API requirement for MVP

## Known Constraints

- Destructive Git commands must not be run automatically.
- External AI API calls are not required for MVP.
- Local project paths may be private and should be hidden in future portfolio mode.
- Large repositories should not be scanned blindly.

## Verification Notes

No app code exists yet, so no build or runtime verification has been performed.

The next meaningful verification will happen after project scaffolding.
