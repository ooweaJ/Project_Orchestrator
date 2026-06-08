# Development Log

This document indexes task-based development logs.

Detailed logs should be written by task, not as full-day diaries.

## Log Format

Each log should include:

- goal
- work performed
- problem encountered
- resolution
- result
- verification
- next task

## Index

### 2026-06-04

#### Documentation Harness Setup

- File: `docs/ai-collaboration/2026-06-04/01-agent-rules-and-reporting.md`
- Summary: Created the initial documentation structure for AI agent rules, portfolio evidence, prompt decisions, development logs, status, and next tasks. Expanded the Karpathy-inspired guardrails after user review.
- Verification: Documentation-only change. App build verification is not applicable yet.

#### Static MVP Scaffold

- File: `docs/ai-collaboration/2026-06-04/02-static-mvp-scaffold.md`
- Summary: Created the first runnable Vite React dashboard and Express API with local project config, read-only Git scanning, basic risk scoring, and generated Codex prompts.
- Verification: `npm install`, `npm run build`, frontend HTTP `200 OK`, projects API `200 OK`, snapshots API `200 OK`.

#### Korean User Report

- File: `docs/reports/latest-status.html`
- Summary: Added a Korean HTML report for the user-facing summary and translated README into Korean.
- Verification: Documentation-only change.

#### Discord Report Webhook

- File: `scripts/send-discord-report.mjs`
- Summary: Added a Discord webhook sender that converts the Korean HTML report into a compact Discord embed.
- Verification: `npm run report:discord:dry`.

#### HTML Report Archive

- File: `docs/reports/index.html`
- Summary: Added a dated HTML report archive and changed Discord report sending to attach the HTML report file with the embed.
- Verification: `npm run report:discord:dry`, `npm run report:discord`.

#### Discord Report Ordering

- File: `scripts/send-discord-report.mjs`
- Summary: Restored the original embed shape and changed HTML delivery to a follow-up message so the file appears below the summary.
- Verification: `npm run report:discord:dry`, `npm run report:discord`.

#### Dashboard Interactions

- File: `docs/ai-collaboration/2026-06-04/03-dashboard-interactions.md`
- Summary: Added project registration, delete confirmation, and prompt type selection to the dashboard.
- Verification: `npm run build`, add/delete API flow, review prompt generation API.

### 2026-06-05

#### Scanner Signals

- File: `docs/ai-collaboration/2026-06-05/01-scanner-signals.md`
- Summary: Added recent file detection, TODO/FIXME/BUG scanning, large file detection, scan limits, improved asset-project risks, and dashboard file signal display.
- Verification: `npm run build`, frontend HTTP `200 OK`, snapshots API `200 OK`, temporary scanner test project.

#### Risk Actions, Prompts, Portfolio Mode, Snapshot Reports

- File: `docs/ai-collaboration/2026-06-05/02-risk-prompts-portfolio-report.md`
- Summary: Added action categories, expanded prompt kinds, dashboard Portfolio Mode, recommended action chips, `GET /api/report`, and scan-based Discord report commands.
- Verification: `npm run build`, `GET /api/report`, temporary full-flow prompt test, `npm run report:discord:snapshot:dry`.

#### Dashboard Korean Localization

- File: `src/main.tsx`
- Summary: Localized dashboard labels, risk badges, helper text, blocked-state explanation, risk messages, and generated prompt summaries into Korean.
- Verification: `npm run build`, frontend HTTP `200 OK`, snapshots API returned Korean risk messages, prompt API returned a Korean prompt body.

#### Project Folder Picker

- File: `server/index.mjs`, `src/main.tsx`, `src/styles.css`
- Summary: Added a local folder browsing API and a dashboard folder picker so project paths can be selected instead of typed manually.
- Verification: `npm run build`, frontend HTTP `200 OK`, `GET /api/folders`, `GET /api/folders?path=<local-path>`.

#### Command-Centered Dashboard

- File: `src/main.tsx`, `src/styles.css`
- Summary: Reworked the selected project detail view around current work, progress state, next tasks, and user-authored Codex commands. Moved file signals into a collapsed supporting section.
- Verification: `npm run build`.

#### Project Document Interface Design

- File: `docs/ai-collaboration/2026-06-05/03-project-document-interface-profile-mapping.md`
- Summary: Recorded the updated decision to make `docs/orchestration/*` a common interface for every portfolio project, with project-specific profile mappings only as a migration fallback.
- Verification: Documentation-only design note.

### 2026-06-08

#### Expanded Orchestration Interface

- File: `docs/ai-collaboration/2026-06-08/01-expanded-orchestration-interface.md`
- Summary: Expanded the orchestration document standard with status, runbook, scope guard, devlog, reports, evidence folders, and a reusable AGENTS template path.
- Verification: Documentation-only change. Markdown files and report links reviewed.
