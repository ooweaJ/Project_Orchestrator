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
