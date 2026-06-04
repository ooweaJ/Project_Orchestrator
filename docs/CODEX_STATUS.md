# Codex Status

## Current State

The project has a first runnable MVP scaffold.

Completed documentation setup:

- `AGENTS.md` defines AI agent operating rules.
- `docs/AI_USAGE_PORTFOLIO.md` summarizes portfolio-relevant AI usage.
- `docs/PROMPT_DECISION_LOG.md` indexes important prompt and decision records.
- `docs/DEV_LOG.md` indexes task-based development logs.
- `docs/NEXT_TASKS.md` lists upcoming work.
- `docs/ai-collaboration/2026-06-04/01-agent-rules-and-reporting.md` records the first AI collaboration design decision.

Completed MVP scaffold:

- Vite + React + TypeScript frontend.
- Node + Express backend.
- Local project config at `data/projects.json`.
- Read-only Git scanner using `git` commands.
- `GET /api/projects`.
- `POST /api/projects`.
- `DELETE /api/projects/:id`.
- `GET /api/projects/:id/snapshot`.
- `GET /api/snapshots`.
- `POST /api/projects/:id/prompt`.
- `GET /api/activity`.
- Dashboard with summary metrics, project cards, detail panel, risk list, and copyable Codex prompt.

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

Verified on 2026-06-04:

- `npm install` completed with 0 vulnerabilities.
- `npm run build` passed.
- `http://127.0.0.1:5173` returned Vite HTML.
- `http://127.0.0.1:4317/api/projects` returned project JSON.
- `http://127.0.0.1:4317/api/snapshots` returned 4 project snapshots.

Browser plugin visual verification was attempted, but the browser runtime failed with a Windows sandbox spawn error. HTTP/API verification succeeded.
